import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'
import config from "../config";
import { AuthenticationError } from "../utils/errors";
import userModel from "../models/user.model";

interface CustomJwtPayload {
    email: string;
    username: string;
    role: 'admin' | 'user'
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader) {
        res.status(401).json({
            message: 'Access Denied. No token provided'
        })
    } else {

        try {
            const token = tokenHeader?.split(' ')[1];
    
            if (token) {
                const isValidToken: jwt.JwtPayload | string = jwt.verify(token, config.jwtSecret) as CustomJwtPayload;
                
                if(isValidToken) {
                    const existingUser = await userModel.findOne({ email: isValidToken.email }).select("_id");
                    if(existingUser) {
                        res.locals.userId = existingUser._id;
                    }
                    next();
                }
            } else {
                throw new AuthenticationError('Token not present')
            }
        } catch (err) {
            if (err instanceof Error) {
                res.status(403).json({
                    error: {
                        message: err.message
                    }
                })
            }
        }
    }
}