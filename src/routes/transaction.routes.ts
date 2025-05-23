import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { addNewTransaction, deleteAllTransactionByUserId, deleteOneTransactionById, getAllTransactionsByUserId, getOneTransactionById, updateOneTransactionById } from "../controllers/transactions.controller";
import mongoose from "mongoose";

const transactionRoutes = Router();

// route parameter middleware to check if the transaction id is valid
transactionRoutes.param('transactionId', (req: Request, res: Response, next: NextFunction, transactionId: string) => {
    if (mongoose.Types.ObjectId.isValid(transactionId)) {
        next();
    } else {
        res.status(404).json({
            message: 'Transaction not found'
        })
    }
})

transactionRoutes
    .route('/')
    .all(authMiddleware)
    .post(addNewTransaction)
    .get(getAllTransactionsByUserId)
    .delete(deleteAllTransactionByUserId);

transactionRoutes
    .route('/:transactionId')
    .all(authMiddleware)
    .get(getOneTransactionById)
    .put(updateOneTransactionById)
    .delete(deleteOneTransactionById);

export default transactionRoutes;