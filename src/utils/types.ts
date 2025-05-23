import mongoose from "mongoose";

export type PrivateMessageFnPayload = {
    from: string;
    to: string;
    message: string;
    socketId: string;
    reply?: string;
}

export type SocketClient = {
    name: string;
    id: mongoose.Types.ObjectId | string;
    socketId: string;
}