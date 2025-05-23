import { NextFunction, Request, Response } from "express";
import { AuthenticationError } from "../utils/errors";
import { Action, Attributes, policy, Resource } from "../policy";
import mongoose from "mongoose";

export const abac = (action: Action, resource: Resource) => {
    return async(req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = res.locals.userId as mongoose.Types.ObjectId;
            const attributes: Attributes = {
                user: {
                    role: 'user',
                    id: userId
                },
                environment: {
                    ip: req.ip || '',
                    time: new Date()
                },
                resource: {
                    id: 'budget',
                    createdBy: userId
                }
            }

            const foundedPolicy = policy.find(p => p.resource === resource && p.action === action);
            
            if(foundedPolicy && foundedPolicy.condition(attributes)) {
                return next(); // authorized
            } else {
                throw new AuthenticationError("Permission not granted");
            }
        } catch(err) {
            if(err instanceof Error) {
                // throw new AuthenticationError('Permission not granted');
                next(err);
            }
        }
    }
}