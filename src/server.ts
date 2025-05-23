import app from "./app";
import config from "./config";
import logger from "./utils/logger";
import connectDb from "./utils/db";
import Redis, { RedisOptions } from "ioredis";
import http from 'http';
import setupSocketEvents from "./utils/setupSocket";


const PORT = config.port;

const server = http.createServer(app);

const redisOptions: RedisOptions = { maxRetriesPerRequest: null, connectTimeout: 10000 };
const redisClient = new Redis(redisOptions);
const pub = new Redis(redisOptions);
const sub = new Redis(redisOptions);
let redisEnabled = true;
let redisReadyCount = 0;
let errorCount = 0;

[redisClient, pub, sub].forEach((client, index) => {
  client.on('ready', () => {
    redisReadyCount++;
    if (redisReadyCount === 3) {
      redisEnabled = true;
      logger.info('✅ Redis connected. Enabling Redis pub/sub features.');
      setupSocketEvents({
        server,
        pub,
        sub,
        redisClient
      })
    }
  })
  client.on('error', (err: Error & { code: string }) => {
    errorCount++;
    redisEnabled = false;
    if (err.code === 'ECONNREFUSED' && errorCount >= 5) return; // Prevent flooding logs
    logger.error(['RedisClient', 'Publisher', 'Subscriber'][index] + ' Error:', err.message);
  });
})

server.listen(PORT, async () => {
  const dbConResult = await connectDb();
  if (dbConResult) {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  } else {
    logger.error(dbConResult);
  }
});