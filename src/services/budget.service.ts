import config from "../config";
import budgetModel from "../models/budget/budget.model";
import jwt, { JwtPayload } from 'jsonwebtoken';
import userModel from "../models/user.model";
import budgetCategoryModel from "../models/budget/budgetCategory.model";
import budgetPeriodModel from "../models/budget/budgetPeriod.model";
import mongoose from "mongoose";
import { AuthenticationError, CustomError, InternalServerError, NotFoundError, ValidationError } from "../utils/errors";
import transactionModel from "../models/transaction/transaction.model";

type ExpensePeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'nolimit';
type ExpenseType = "food" | "transport" | "healthcare" | "education" | "clothes" | "entertainment" | "miscellanous";
type AllowedCurrencies = 'INR' | 'USD' | 'GBP';

interface AddNewBudgetParams {
    name: string;
    amount: number;
    expensePeriodType: ExpensePeriodType;
    expenseType: ExpenseType;
    currencyCode: AllowedCurrencies;
    token: string;
}

interface CustomJwtPayload extends JwtPayload {
    username: string;
    email: string;
}

interface EditBudget {
    id: string;
    name: string;
    amount: number;
    expensePeriodType: string;
    expenseType: string;
    currencyCode: string;
}

class BudgetService {
    static async addNew({ name, amount, expensePeriodType, expenseType, currencyCode, token }: AddNewBudgetParams) {
        const session = await mongoose.startSession();
        session.startTransaction();
        const tokenData = jwt.verify(token, config.jwtSecret) as CustomJwtPayload;
        try {
            if (tokenData) {
                const data = {
                    name,
                    amount,
                    expensePeriodType,
                    expenseType,
                    currencyCode,
                }
                const user = await userModel.findOne({ email: tokenData?.email }).select("_id").session(session);
                const existingEntriesByUser = await budgetModel.countDocuments({ createdBy: user?._id }).session(session);
                // check if the user has created more than 10 budgets
                if (existingEntriesByUser >= 10) {
                    throw new ValidationError('You cannot create more than 10 budgets');
                }
                const newEntry = await budgetModel.create([{ ...data, createdBy: user?._id }], { session });
                if (newEntry) {
                    await session.commitTransaction();
                    return {
                        message: 'Budget Created successfully'
                    }
                }
            } else {
                throw new ValidationError('Token is not valid');
            }
        } catch (err) {
            await session.abortTransaction();
            if(err instanceof ValidationError) {
                throw new ValidationError(err.message);
            }
            if (err instanceof Error) {
                throw new CustomError(err.message, 400);
            }
        } finally {
            session.endSession();
        }
    }

    static async getAll(token: string) {
        const tokenData = jwt.verify(token, config.jwtSecret) as CustomJwtPayload;
        try {
            if (tokenData) {
                const user = await userModel.findOne({ email: tokenData?.email }).select("_id");

                const userBudgetList = await budgetModel.aggregate([
                    {
                        $match: {
                            createdBy: user?._id // find by user id
                        }
                    },
                    {
                        $lookup: {
                            from: 'budgetCategories', // collection name
                            // local field in the budget model to lookup to in the budgetCategories model
                            localField: 'expenseType',
                            foreignField: '_id', // foreign field in the budget model
                            as: 'expenseType' // new name of the field you want to name
                        }
                    },
                    {
                        $unwind: '$expenseType' // convert array into object
                    },
                    {
                        $lookup: {
                            from: 'budgetPeriods',
                            localField: 'expensePeriodType',
                            foreignField: '_id',
                            as: 'expensePeriodType'
                        }
                    },
                    {
                        $unwind: '$expensePeriodType'
                    },
                    {
                        $project: {
                            amount: 1,
                            name: 1,
                            currencyCode: 1,
                            createdBy: 1,
                            expenseType: '$expenseType.name',
                            expensePeriodType: '$expensePeriodType.name'
                        }
                    }
                ])
                return userBudgetList;
            } else {
                throw new InternalServerError('Token is not valid');
            }
        } catch (err) {
            if (err instanceof Error) {
                throw new CustomError(err.message);
            }
        }
    }

    static async getAllCategories() {
        try {
            const list = await budgetCategoryModel.find({}, { name: 1, _id: 1 });
            if (list) {
                return {
                    data: list
                }
            } else {
                throw new InternalServerError('Some error occurred');
            }
        } catch (err) {
            if (err instanceof Error) {
                throw new CustomError(err.message);
            }
        }
    }

    static async getAllPeriods() {
        try {
            const list = await budgetPeriodModel.find({}, { name: 1, _id: 1 });
            if (list) {
                return {
                    data: list
                }
            } else {
                throw new InternalServerError('Some error occurred');
            }
        } catch (err) {
            if (err instanceof Error) {
                throw new CustomError(err.message);
            }
        }
    }

    static async editBudgetById(body: EditBudget) {
        try {
            const updatedBudget = await budgetModel.findOneAndUpdate({ _id: body.id }, {
                $set: {
                    name: body.name,
                    amount: body.amount,
                    expensePeriodType: body.expensePeriodType,
                    expenseType: body.expenseType,
                    currencyCode: body.currencyCode
                }
            }, { new: true, runValidators: true, context: 'query' });

            if(updatedBudget) {
                return {
                    message: 'Budget updated successfully'
                }
            } else {
                throw new InternalServerError('Some error occurred while updating budget');
            }
        } catch (err) {
            if (err instanceof mongoose.Error.CastError && err.path === 'expensePeriodType') {
                throw new ValidationError(`"${err.value}" is not a valid expense period`);
            } 
              
            if(err instanceof mongoose.Error.CastError && err.path === 'expenseType') {
                throw new ValidationError(`"${err.value}" is not a valid expense type`)
            }

            if (err instanceof mongoose.Error.ValidationError) {
                throw new ValidationError(err.message);
            }
            
            if (err instanceof Error) {
                throw new CustomError(err.message, 400);
            }
        }
    }

    static async getBudgetById({ budgetId, token }: {
        budgetId: string;
        token: string;
    }) {
        try {
            const decodedToken = jwt.verify(token, config.jwtSecret) as CustomJwtPayload;
            const user = await userModel.findOne({ email: decodedToken.email }).select('_id');
            const foundedBudgetById = await budgetModel.aggregate([
                {
                    $match: {
                        createdBy: user?._id, // find by user id
                        _id: new mongoose.Types.ObjectId(budgetId)
                    }
                },
                {
                    $lookup: {
                        from: 'budgetCategories', // collection name
                        // local field in the budget model to lookup to in the budgetCategories model
                        localField: 'expenseType',
                        foreignField: '_id', // foreign field in the budget model
                        as: 'expenseType' // new name of the field you want to name
                    }
                },
                {
                    $unwind: '$expenseType' // convert array into object
                },
                {
                    $lookup: {
                        from: 'budgetPeriods',
                        localField: 'expensePeriodType',
                        foreignField: '_id',
                        as: 'expensePeriodType'
                    }
                },
                {
                    $unwind: '$expensePeriodType'
                },
                {
                    $project: {
                        amount: 1,
                        name: 1,
                        currencyCode: 1,
                        createdBy: 1,
                        expenseType: '$expenseType.name',
                        expensePeriodType: '$expensePeriodType.name'
                    }
                },
                
            ]).limit(1);

            if(foundedBudgetById.length > 0) {
                return foundedBudgetById[0];
            } else {
                throw new NotFoundError("Budget not found");
            }
        } catch(err) {
            if(err instanceof NotFoundError) {
                throw new NotFoundError('Budget not found');
            }
            if(err instanceof Error) {
                throw new CustomError(err.message);
            }
        }
    }

    static async deleteBudget({ budgetId, token }: {
        budgetId: string;
        token: string;
    }) {
        const session = await mongoose.startSession();
        try {
            // session.startTransaction();
            const decodedToken = jwt.verify(token, config.jwtSecret) as CustomJwtPayload;
            const user = await userModel.findOne({ email: decodedToken.email }).select('_id');
            if (!user) throw new InternalServerError("User not found");
            const deletedBudgetById = await budgetModel.deleteOne({
                createdBy: user?._id,
                _id: budgetId
            })
            const deleteTransactionsByBudgetId = await transactionModel.deleteMany({
                budgetId: new mongoose.Types.ObjectId(budgetId)
            })

            if(deletedBudgetById.deletedCount === 1 && deleteTransactionsByBudgetId.deletedCount >= 0) {
                // await session.commitTransaction();
                return {
                    message: 'Budget Deleted Successfully'
                }
            } else {
                throw new InternalServerError("Some error occurred");
            }
        } catch(err) {
            await session.abortTransaction();
            if(err instanceof Error) {
                throw new CustomError(err.message);
            }
        } 
        // finally {
        //     session.endSession();
        // }
    }

    static async getShortBudgetList(token: string) {
        const tokenData = jwt.verify(token, config.jwtSecret) as CustomJwtPayload;
        try {
            if (tokenData) {
                const user = await userModel.findOne({ email: tokenData?.email }).select("_id");
                const userBudgetList = await budgetModel.find({ createdBy: user?._id }).select("name");
                return userBudgetList;
            } else {
                throw new AuthenticationError('Token is not valid');
            }
        } catch (err) {
            if (err instanceof Error) {
                throw new CustomError(err.message);
            }
        }
    }
}

export default BudgetService;