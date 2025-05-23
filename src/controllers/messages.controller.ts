import { Request, Response } from "express";
import MessageService from "../services/chatMessages.service";

export async function getConversation(req: Request, res: Response) {
    try {
        const users = req.params;
        const user1 = users.user1;
        const user2 = users.user2;
        const result = await MessageService.getChatMessages({
            user1,
            user2
        });

        if(result.success) {
            res.status(200).json({
                success: result.success,
                data: result.data
            })
        } else {
            throw new Error('API Error')
        }
    } catch(err) {
        if(err instanceof Error) {
            res.status(401).json({
                success: false,
                message: err.message
            })
        }
    }
}