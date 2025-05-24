import { Server as IOServer, Socket } from 'socket.io';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import config from '../config';
import { PrivateMessageFnPayload } from './types';
import logger from './logger';
import userModel from '../models/user.model';
import chatMessageModel from '../models/message.model';
import type { Redis } from 'ioredis';
import { Server as HttpServer } from 'http';
import mongoose from 'mongoose';

interface CustomJwtPayload extends JwtPayload {
  email: string;
  username: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  decoded?: CustomJwtPayload;
}

interface Params {
  server: HttpServer,
  redisClient: Redis;
  pub: Redis;
  sub: Redis;
}

export default async function setupSocketEvents({
  server,
  redisClient,
  pub,
  sub
}: Params) {
  const io = new IOServer(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001', 'https://budget-tracker-frontend-lime.vercel.app'], // adjust in production
      methods: ['GET', 'POST'],
      credentials: true
    },
  });
  // Handle socket connection
  io.use((socket: AuthenticatedSocket, next) => {
    if (socket.handshake.auth && socket.handshake.auth.token) {
      jwt.verify(socket.handshake.auth.token, config.jwtSecret, (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
        if (err) {
          return next(new Error('Authentication error'));
        }
        socket.decoded = decoded as CustomJwtPayload;
        next();
      });
    } else {
      next(new Error('Authentication error'));
    }
  });

  sub.on('message', async (channel, message) => {
    const parsed = JSON.parse(message);
    const { from, to, socketId, message: msg, replyMessage, id } = parsed;
    console.log(parsed);

    const clientsFromRedis = await redisClient.hgetall('connected_clients');
    const targetRaw = clientsFromRedis[to];
    const senderRaw = clientsFromRedis[from];

    const targetClient = targetRaw ? JSON.parse(targetRaw) : null;
    const senderClient = senderRaw ? JSON.parse(senderRaw) : null;

    let payload: undefined | Object;

    if (replyMessage) {
      // 🟢 Publish the message to Redis instead of emitting directly
      const foundedReplyMsg = await chatMessageModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(replyMessage.id)
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'from',
            foreignField: '_id',
            as: 'replyFrom'
          }
        },
        {
          $unwind: {
            path: '$replyFrom',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'to',
            foreignField: '_id',
            as: 'replyTo'
          }
        },
        {
          $unwind: {
            path: '$replyTo',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            from: 1,
            message: 1,
            to: 1,
            replyFrom: "$replyFrom.username",
            replyTo: "$replyTo.username"
          }
        }
      ]);

      payload = {
        from: { id: from, name: senderClient?.name },
        message: msg,
        socketId,
        to: { id: to, name: targetClient?.name },
        replyMessage: foundedReplyMsg ? {
          id: foundedReplyMsg[0]._id,
          message: foundedReplyMsg[0].message,
          to: foundedReplyMsg[0].to,
          from: foundedReplyMsg[0].from
        } : {}, // include if available
        replyFrom: foundedReplyMsg[0].replyFrom,
        replyTo: foundedReplyMsg[0].replyTo
      };

    } else {
      payload = {
        from: { id: from, name: senderClient?.name },
        message: msg,
        socketId,
        to: { id: to, name: targetClient?.name },
        id
      };
    }

    if (targetClient) {
      io.to(targetClient.socketId).emit('receive-message', payload);
    }
    if (senderClient) {
      io.to(senderClient.socketId).emit('receive-message', payload);
    }

  });
  io.on('connection', (socket: AuthenticatedSocket) => {

    socket.on('init', async (username) => {
      if (socket.decoded && typeof socket.decoded !== 'string') {
        const user = await userModel.findOne({ email: socket.decoded.email }).select("_id");

        if (user) {
          await redisClient.hset('connected_clients', String(user._id), JSON.stringify({
            name: username,
            id: user._id,
            socketId: socket.id
          }));
        }

        const clientsFromRedis = await redisClient.hgetall('connected_clients');
        const userList = Object.entries(clientsFromRedis).map(([id, val]) => {
          const parsed = JSON.parse(val);
          return {
            id,
            name: parsed.name,
            socketId: parsed.socketId
          };
        });
        io.emit('clients-list', userList);
      }
    })
    socket.on('message', (data) => {
      console.log(`Received message: ${data}`);
      io.emit('message', data); // send to all clients including sender
    });

    socket.on('private-message', async ({ from, to, message, socketId, reply }: PrivateMessageFnPayload) => {
      try {
        const foundedReplyMsg = await chatMessageModel.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(reply)
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'from',
              foreignField: '_id',
              as: 'replyFrom'
            }
          },
          {
            $unwind: {
              path: '$replyFrom',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'to',
              foreignField: '_id',
              as: 'replyTo'
            }
          },
          {
            $unwind: {
              path: '$replyTo',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              _id: 1,
              from: 1,
              message: 1,
              to: 1,
              replyFrom: "$replyFrom.username",
              replyTo: "$replyTo.username"
            }
          }
        ]);

        let newMsg: undefined | mongoose.Document;

        if (reply) {
          newMsg = await chatMessageModel.create({
            from,
            to,
            message,
            reply
          });
        } else {
          newMsg = await chatMessageModel.create({
            from,
            to,
            message
          });
        }

        console.log({
          newMsg,
          foundedReplyMsg
        })

        if (newMsg && foundedReplyMsg.length > 0) {
          const parsed = JSON.stringify({
            from,
            to,
            message,
            socketId,
            replyMessage: {
              from: foundedReplyMsg[0].from,
              to: foundedReplyMsg[0].to,
              id: foundedReplyMsg[0]._id,
              message: foundedReplyMsg[0].message
            },
            replyFrom: foundedReplyMsg[0].replyFrom,
            replyTo: foundedReplyMsg[0].replyTo,
            reply
          });

          await pub.publish('chat-messages', parsed);
          await pub.publish('receive-message', parsed);
        } else {
          const parsed = JSON.stringify({
            from,
            to,
            message,
            socketId,
            id: newMsg._id
          });

          await pub.publish('chat-messages', parsed);
          await pub.publish('receive-message', parsed);
        }
      } catch (err) {
        if (err instanceof Error) {
          logger.error(err.message);
          console.error(err.message);
        }
      }
    })

    socket.on('disconnect', async (username) => {
      // Remove from Redis
      const clientsFromRedis = await redisClient.hgetall('connected_clients');
      for (const [id, val] of Object.entries(clientsFromRedis)) {
        const parsed = JSON.parse(val);
        if (parsed.socketId === socket.id) {
          await redisClient.hdel('connected_clients', id);
          break;
        }
      }

      // Re-broadcast updated list
      const updatedClients = await redisClient.hgetall('connected_clients');
      const userList = Object.entries(updatedClients).map(([id, val]) => {
        const parsed = JSON.parse(val);
        return {
          id,
          name: parsed.name,
          socketId: parsed.socketId
        };
      });
      io.emit('clients-list', userList);
    });
  });

  io.on('connection_error', (err) => {
    console.log("Connection Error: ", err);
  })

  await sub.subscribe('receive-message');
}