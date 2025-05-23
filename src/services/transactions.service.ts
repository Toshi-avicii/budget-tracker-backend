
import config from "../config";
import { AddTransactionPayload } from "../controllers/transactions.controller";
import transactionModel from "../models/transaction/transaction.model";
import jwt, { JwtPayload } from 'jsonwebtoken'
import userModel from "../models/user.model";
import mongoose from "mongoose";
import { AuthenticationError, CustomError } from "../utils/errors";

interface CustomJwtPayload extends JwtPayload {
    username: string;
    email: string;
}

class TransactionService {
    static async add(data: AddTransactionPayload) {
        try {
            const tokenData = jwt.verify(data.token, config.jwtSecret) as CustomJwtPayload;
            const existingUser = await userModel.findOne({ email: tokenData.email }).select("_id");
            if (existingUser) {
                const newTransaction = await transactionModel.create({
                    userId: existingUser._id,
                    budgetId: data.budgetId,
                    amount: data.amount,
                    type: data.transactionType,
                    description: data.description,
                    date: data.date,
                    paymentMethod: data.paymentMethod,
                    expenseType: data.expenseType,
                    isRecurring: data.isRecurring
                })

                if (newTransaction) {
                    return {
                        success: true,
                        message: 'Transaction created successfully'
                    }
                }
            } else {
                throw new AuthenticationError("User is not valid");
            }
        } catch (err) {
            const errorMsgs = [];
            if (err instanceof mongoose.Error.ValidationError) {
                for (let e of Object.values(err.errors)) {
                    if (e instanceof mongoose.Error.CastError) {
                        errorMsgs.push(`${e.path} is not valid`);
                    } else {
                        errorMsgs.push(e.message);
                    }
                }
            } else if (err instanceof mongoose.Error.CastError) {
                const message = err.path === 'expenseType'
                    ? `"${err.value}" is not a valid expense type`
                    : err.path === 'paymentMethod'
                        ? `"${err.value}" is not a valid payment method`
                        : `"${err.value}" is not valid for ${err.path}`;
                errorMsgs.push(message);
            } else {
                errorMsgs.push('Something went wrong');
            }

            return {
                success: false,
                errors: errorMsgs
            }
        }
    }

    static async getAllTransactions({
        token,
        limit,
        skip,
        page
    }: {
        token: string,
        limit: number,
        skip: number,
        page: number
    }) {
        try {
            const { email } = jwt.verify(token, config.jwtSecret) as CustomJwtPayload;
            const existingUser = await userModel.findOne({ email }).select("_id");
            // this is useful for explaining query status
            // const existingUserStats = await userModel.findOne({ email }).select("_id").explain("executionStats");
            // console.log(existingUserStats);
            if (existingUser) {
                const transactionsByUser = await transactionModel.aggregate([
                    {
                        $match: {
                            userId: existingUser?._id
                        }
                    },
                    {
                        $lookup: {
                            from: 'budgets',
                            localField: 'budgetId', // this field's name in this collection
                            foreignField: '_id', // this field's name in table from which we want the name of the budget
                            as: 'budget'
                        }
                    },
                    {
                        $unwind: {
                            path: '$budget',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: 'budgetCategories',
                            localField: 'expenseType',
                            foreignField: '_id',
                            as: 'expenseType'
                        }
                    },
                    {
                        $unwind: {
                            path: '$expenseType',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            userId: 1,
                            amount: 1,
                            type: 1,
                            date: 1,
                            paymentMethod: 1,
                            isRecurring: 1,
                            description: 1,
                            budget: {
                                name: '$budget.name',
                                id: '$budget._id'
                            },
                            expenseType: {
                                name: '$expenseType.name',
                                id: '$expenseType._id'
                            }
                        }
                    },
                    {
                        $skip: skip,
                    },
                    {
                        $limit: limit
                    }
                ]);

                const transactionsCount = await transactionModel.countDocuments({ userId: existingUser?._id })

                return {
                    data: transactionsByUser,
                    total: transactionsCount,
                    totalPages: Math.ceil(transactionsCount / limit),
                    page
                };
            } else {
                throw new AuthenticationError('User is not valid');
            }
        } catch (err) {
            if(err instanceof AuthenticationError) {
                return {
                    success: false,
                    errors: [err.message]
                }
            }
            if (err instanceof Error) {
                return {
                    success: false,
                    errors: [err.message]
                }
            }
        }
    }
}

export default TransactionService;