import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import { CustomError, FieldError, ValidationError } from "../utils/errors";
import config from "../config";

interface CustomErrorObject extends Error {
    statusCode?: number;
}

export async function errorMiddleware(err: CustomErrorObject, req: Request, res: Response, next: NextFunction) {
    logger.error(err.message, err.statusCode);

    // set default status code and message
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if(err instanceof CustomError) {
        res.status(statusCode).json({
            error: {
                message,
                type: err.name
            }
        })
    } else if(err instanceof ValidationError) {
        res.status(statusCode).json({
            error: {
                message,
                type: err.name
            }
        })
    } else if(err instanceof FieldError) {
        res.status(400).json({
            error: {
                message: err.message,
                type: err.name,
                error: err.error
            }
        })
    } else if(config.env === 'production') {
        // if we are in production
        res.status(500).json({ error: { message: 'Internal Server Error' } })
    } else {
        // if we are in development
        res.status(statusCode).json({ error: { message } })
    }
}