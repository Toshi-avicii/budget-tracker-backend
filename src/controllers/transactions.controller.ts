import { NextFunction, Request, Response } from 'express'
import TransactionService from '../services/transactions.service'
import { AuthenticationError, CustomError, FieldError } from '../utils/errors';
export interface AddTransactionPayload {
    token: string;
    budgetId: string;
    amount: number;
    transactionType: string;
    description?: string;
    date: Date;
    paymentMethod: string,
    expenseType: string;
    isRecurring: boolean;
}

export const addNewTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tokenHeader = req.headers.authorization;
        const token = tokenHeader?.split(' ')[1];
        const {
            budgetId,
            amount,
            transactionType,
            description,
            date,
            paymentMethod,
            expenseType,
            isRecurring
        } = req.body;
        const body: AddTransactionPayload = {
            token: token ? token : '',
            budgetId,
            amount,
            transactionType,
            description,
            date,
            paymentMethod,
            expenseType,
            isRecurring
        }

        const result = await TransactionService.add(body);

        if (result?.success) {
            res.status(200).json({
                data: result
            })
        } else {
            if (Array.isArray(result?.errors)) {
                const errorMsg =  {
                    error: {
                        type: "ValidationError", // you can set the specific type you want
                        message: "Error occurred", // taking first error as main message
                        errors: result.errors // keeping all errors
                    }
                };

                throw new FieldError(errorMsg.error);
            }
            const fallbackError = {
                error: {
                    type: "UnknownError",
                    message: result?.message || 'Error Occurred',
                    errors: result?.errors || []
                }
            };

            throw new FieldError(fallbackError.error);
        }
    } catch (err) {
        if (err instanceof Error) {
            next(err);
        }
    }
}

export const getAllTransactionsByUserId = async (req: Request, res: Response) => {
    try {
        const tokenHeader = req.headers.authorization;
        const token = tokenHeader?.split(' ')[1];
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const result = await TransactionService.getAllTransactions({
            limit,
            skip,
            token: token ? token : '',
            page
        });

        if (result) {
            res.status(200).json({
                success: true,
                data: result.data,
                total: result.total,
                totalPages: result.totalPages,
                page: result.page
            });
        } else {
            throw new AuthenticationError('Some error occurred');
        }
    } catch (err) {
        if (err instanceof Error) {
            res.status(401).json({
                errors: err,
                message: err.message
            })
        }
    }
}

export const deleteAllTransactionByUserId = async (req: Request, res: Response) => {
    try {

    } catch (err) {

    }
}

export const getOneTransactionById = async (req: Request, res: Response) => {
    try {
        res.status(200).json({
            message: 'Route hit'
        })
    } catch (err) {
        if (err instanceof Error) {
            res.status(401).json({
                errors: err,
                message: err.message
            })
        }
    }
}

export const updateOneTransactionById = async (req: Request, res: Response) => {
    try {

    } catch (err) {

    }
}

export const deleteOneTransactionById = async (req: Request, res: Response) => {
    try {

    } catch (err) {

    }
}