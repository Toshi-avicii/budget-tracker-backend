import mongoose from "mongoose";
import transactionModel from "../models/transaction/transaction.model";
import config from "../config";
import jwt, { JwtPayload } from "jsonwebtoken";
import userModel from "../models/user.model";
import { CustomError } from "../utils/errors";

interface CustomJwtPayload extends JwtPayload {
    username: string;
    email: string;
}

interface GetDataByMonthRangeParams {
    monthFrom: number,
    monthTo: number,
    yearFrom: number,
    yearTo: number,
    token: string
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default class DashboardService {
    static async getSummary({ fromMonth, toMonth, token }: { fromMonth: Date, toMonth: Date, token: string }) {
        try {
            const tokenData = jwt.verify(token, config.jwtSecret) as CustomJwtPayload;
            const user = await userModel.findOne({ email: tokenData?.email }).select("_id");
            console.log(user);
            if (user) {
                const data = await transactionModel.aggregate([
                    {
                        $match: {
                            $and: [
                                { date: { $lte: toMonth } },
                                { date: { $gte: fromMonth } },
                                { userId: new mongoose.Types.ObjectId(user._id) }
                            ]
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalExpenses: {
                                $sum: {
                                    $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
                                }
                            },
                            totalIncome: {
                                $sum: {
                                    $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
                                }
                            }
                        }
                    },
                    {
                        $addFields: {
                            balance: { $subtract: ["$totalIncome", "$totalExpenses"] }
                        }
                    },
                    {
                        $addFields: {
                            debt: {
                                $cond: [
                                    { $gt: ["$totalExpenses", "$totalIncome"] },
                                    { $subtract: ["$totalExpenses", "$totalIncome"] },
                                    0
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            totalExpenses: 1,
                            totalIncome: 1,
                            balance: 1,
                            debt: 1
                        }
                    }
                ]);
                
                if (data) {
                    console.log({ data });
                    return data[0] ? data[0] : {
                        totalExpenses: 0,
                        totalIncome: 0,
                        balance: 0,
                        debt: 0
                    };
                } 
                return {}
            }
        } catch (err) {
            if (err instanceof Error) {
                throw new Error(err.message);
            }
        }
    }

    static async getDataByMonthRange({ monthFrom, monthTo, yearFrom, yearTo, token }: GetDataByMonthRangeParams) {
        try {
            const tokenData = jwt.verify(token, config.jwtSecret) as CustomJwtPayload;
            const user = await userModel.findOne({ email: tokenData?.email }).select("_id");
            if (user) {
                const data = await transactionModel.aggregate([
                    {
                        $addFields: {
                            month: { $month: "$date" },
                            year: { $year: "$date" },
                        }
                    },
                    {
                        $match: {
                            month: { $gte: monthFrom, $lte: monthTo },
                            year: { $gte: yearFrom, $lte: yearTo },
                            userId: new mongoose.Types.ObjectId(user._id)
                        }
                    },
                    {
                        // group by month and year
                        $group: {
                            _id: {
                                year: '$year',
                                month: '$month'
                            },
                            totalExpenses: {
                                $sum: {
                                    $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
                                }
                            },
                            totalIncome: {
                                $sum: {
                                    $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
                                }
                            },
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            month: "$_id.month",
                            year: "$_id.year",
                            monthName: {
                                $arrayElemAt: [
                                    [
                                        "", "January", "February", "March", "April", "May", "June",
                                        "July", "August", "September", "October", "November", "December"
                                    ],
                                    "$_id.month"
                                ]
                            },
                            data: {
                                totalExpenses: "$totalExpenses",
                                totalIncome: "$totalIncome",
                                balance: {
                                    $subtract: ["$totalIncome", "$totalExpenses"]
                                },
                                debt: {
                                    $cond: [
                                        { $gt: ["$totalExpenses", "$totalIncome"] },
                                        { $subtract: ["$totalExpenses", "$totalIncome"] },
                                        0
                                    ]
                                }
                            }
                        }
                    },
                    {
                        $sort: { month: 1, year: 1 }
                    }
                ]);

                if (data) {
                    return data;
                } else {
                    throw new CustomError("Some error occurred");
                }
            }
        } catch (err) {
            if (err instanceof Error) {
                throw new Error(err.message);
            }
        }
    }

    static async getDataByExpenseTypes({ date, token }: { date: Date, token: string }) {
        try {
            const tokenData = jwt.verify(token, config.jwtSecret) as CustomJwtPayload;
            const dateMonth = date.getMonth() + 1;
            const user = await userModel.findOne({ email: tokenData?.email }).select("_id");
            if (user) {
                const data = await transactionModel.aggregate([
                    {
                        $addFields: {
                            month: { $month: "$date" }
                        }
                    },
                    {
                        $match: {
                            userId: new mongoose.Types.ObjectId(user._id),
                            type: "expense",
                            month: { $eq: dateMonth }
                        }
                    },
                    {
                        $lookup: {
                            from: "budgetCategories",
                            localField: "expenseType",
                            foreignField: "_id",
                            as: "expenseType"
                        }
                    },
                    {
                        $unwind: {
                            path: '$expenseType',
                            preserveNullAndEmptyArrays: false
                        }
                    },
                    {
                        $group: {
                            _id: "$expenseType",
                            amount: {
                                $sum: "$amount"
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            type: "$_id.name",
                            amount: 1,
                            month: 1
                        }
                    },
                    {
                        $sort: {
                            amount: -1
                        }
                    }
                ]);

                if (data) {
                    return data;
                } else {
                    throw new CustomError("Some error occurred");
                }
            }
        } catch (err) {
            if (err instanceof Error) {
                throw new Error(err.message);
            }
        }
    }
}