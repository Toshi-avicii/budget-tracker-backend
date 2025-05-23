import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';
import BudgetService from '../services/budget.service';
import { AuthenticationError, CustomError } from '../utils/errors';

export const addNewBudget = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const { budgetName, amount, budgetExpensePeriodType, budgetExpenseType, currencyCode } = req.body;
        const tokenHeader = req.headers.authorization;
        const token = tokenHeader?.split(' ')[1];

        const result = await BudgetService.addNew({
            name: budgetName,
            amount,
            expensePeriodType: budgetExpensePeriodType,
            expenseType: budgetExpenseType,
            currencyCode,
            token: token ? token : ''
        });
        if(result) {
            logger.info('Budget created successfully');
            res.status(201).json({
               message: result.message
            });
        }
    } catch(err) {
        if(err instanceof Error) {
            logger.error("Error occurred", { message: err.message });
            next(err);
        }
    }
}

export const getBudgetList = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const tokenHeader = req.headers.authorization;
        const token = tokenHeader?.split(' ')[1];
        if(token) {
            const result = await BudgetService.getAll(token);
            if(result) {
                logger.info('Budget list API hit successfully');
                res.status(200).json({
                   data: result
                });
            } else {
                throw new CustomError('Could not fetch budgets');
            }
        } else {
            throw new AuthenticationError('Token not passed');
        }
    } catch(err) {
        if(err instanceof Error) {
            logger.error("Error occurred", { message: err.message });
            next(err);
        }
    }
}

export const getBudgetCategoryList = async(req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info("Budget category list API hit successfully")
        const result = await BudgetService.getAllCategories();
        if(result) {
            res.status(200).json({
                data: result.data
            })
        } else {
            throw new CustomError('Could not fetch category list')
        }
    } catch(err) {
        if(err instanceof Error) {
            logger.error("Error occurred", { message: err.message });
            next(err);
        }
    }
}

export const getBudgetPeriodList = async(req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info("Budget category list API hit successfully")
        const result = await BudgetService.getAllPeriods();
        if(result) {
            res.status(200).json({
                data: result.data
            })
        } else {
            throw new CustomError('Could not fetch category list')
        }
    } catch(err) {
        if(err instanceof Error) {
            logger.error("Error occurred", { message: err.message });
            next(err);
        }
    }
}

export const editBudget = async(req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info("Edit Budget by id API hit successfully");
        const body = {
            id: req.params.budgetId,
            name: req.body.name,
            amount: req.body.amount,
            expensePeriodType: req.body.expensePeriodType,
            expenseType: req.body.expenseType,
            currencyCode: req.body.currencyCode,
        }
        const result = await BudgetService.editBudgetById(body);
        if(result) {
            res.status(201).json({
                data: result
            })
        } 
    } catch(err) {
        if(err instanceof Error) {
            logger.error("Error occurred", { message: err.message });
            next(err)
        }
    }
}

export const getOneBudget = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const tokenHeader = req.headers.authorization;
        const token = tokenHeader?.split(' ')[1];
        const body = {
            budgetId: req.params.budgetId as string,
            token: token as string
        }
        const result = await BudgetService.getBudgetById(body);
        if(result) {
            res.status(200).json({
                data: result
            })
        } else {
            throw new CustomError('Some error occurred');
        }
    } catch(err) {
        if(err instanceof Error) {
            next(err);
        }
    }
}

export const deleteOneBudget = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const tokenHeader = req.headers.authorization;
        const token = tokenHeader?.split(' ')[1];
        const body = {
            budgetId: req.params.budgetId as string,
            token: token as string
        }
        const result = await BudgetService.deleteBudget(body);
        if(result) {
            res.status(201).json({
                data: result
            })
        } else {
            throw new CustomError('Some error occurred');
        }
    } catch(err) {
        if(err instanceof Error) {
            next(err);
        }
    }
}

export const getShortBudgetList = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const tokenHeader = req.headers.authorization;
        const token = tokenHeader?.split(' ')[1];
        const result = await BudgetService.getShortBudgetList(token ? token : '');
        if(result) {
            res.status(201).json({
                data: result
            })
        } else {
            throw new CustomError('Some error occurred');
        }
    } catch(err) {
        if(err instanceof Error) {
           next(err);
        }
    }
}