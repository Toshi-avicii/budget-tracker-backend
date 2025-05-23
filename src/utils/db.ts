import mongoose from "mongoose";
import config from '../config';
import { CustomError, DatabaseError } from "./errors";

const DB_URL = config.dbUrl;

export default async function connectDb (): Promise<string | Error | undefined> {
    const connectionUrl: string | undefined = DB_URL;
    try {
        if(connectionUrl) {
            const conn = await mongoose.connect(connectionUrl);
            if(conn) {
                return 'connection successfull to db';
            } else {
                throw new CustomError('Something went wrong');
            }
        }
    } catch(err) {
        if(err instanceof Error) {
            throw new DatabaseError(err.message);
        }
    }
}