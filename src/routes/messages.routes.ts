import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getConversation } from "../controllers/messages.controller";

const messagesRoute = Router();

messagesRoute.get('/:user1/:user2', authMiddleware, getConversation)

export default messagesRoute;