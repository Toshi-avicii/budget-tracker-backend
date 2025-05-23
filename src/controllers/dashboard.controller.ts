import { Request, Response } from "express"
import DashboardService from "../services/dashboard.service";
import { CustomError, ValidationError } from "../utils/errors";

export const getSummaryData = async (req: Request, res: Response) => {
    try {
        const tokenHeader = req.headers.authorization;
        const token = tokenHeader?.split(' ')[1];
        const { from, to } = req.query;

        if (typeof from !== "string" || typeof to !== "string") {
            throw new ValidationError("Date is not valid");
        } else {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            if (token) {
                const result = await DashboardService.getSummary({ fromMonth: fromDate, toMonth: toDate, token });
                console.log(result);
                if (result) {
                    res.status(200).json({
                        success: true,
                        data: result
                    })
                } else {
                    throw new CustomError("Some error occurred");
                }
            }
        }

    } catch (err) {
        if (err instanceof Error) {
            res.status(401).json({
                success: false,
                message: err.message
            })
        }
    }
}

export const getMonthlyData = async (req: Request, res: Response) => {
    try {
        const tokenHeader = req.headers.authorization;
        const token = tokenHeader?.split(' ')[1];
        const { monthFrom, monthTo, yearFrom, yearTo } = req.query;

        // const parsedMonthFrom = parseInt(monthFrom);

        if (typeof monthFrom !== "string" || typeof monthTo !== "string" || typeof yearFrom !== "string" || typeof yearTo !== "string") {
            throw new ValidationError("invalid request parameters");
        } else {
            const parsedMonthFrom = parseInt(monthFrom);
            const parsedMonthTo = parseInt(monthTo);
            const parsedYearFrom = parseInt(yearFrom);
            const parsedYearTo = parseInt(yearTo);

            if (token) {
                const result = await DashboardService.getDataByMonthRange({
                    monthFrom: parsedMonthFrom,
                    monthTo: parsedMonthTo,
                    yearFrom: parsedYearFrom,
                    yearTo: parsedYearTo,
                    token
                });
                if (result) {
                    res.status(200).json({
                        success: true,
                        data: result
                    })
                } else {
                    throw new CustomError("Some error occurred");
                }
            }
        }

    } catch (err) {
        if (err instanceof Error) {
            res.status(401).json({
                success: false,
                message: err.message
            })
        }
    }
}

export const getExpenseTypeData = async (req: Request, res: Response) => {
    try {
        const tokenHeader = req.headers.authorization;
        const token = tokenHeader?.split(' ')[1];
        const { date } = req.query;

        // const parsedMonthFrom = parseInt(monthFrom);

        if (typeof date !== "string") {
            throw new ValidationError("invalid request parameters");
        } else {
            const parsedDate = new Date(date);

            if (token) {
                const result = await DashboardService.getDataByExpenseTypes({ date: parsedDate, token });
                if (result) {
                    res.status(200).json({
                        success: true,
                        data: result
                    })
                } else {
                    throw new CustomError("Some error occurred");
                }
            }
        }

    } catch (err) {
        if (err instanceof Error) {
            res.status(401).json({
                success: false,
                message: err.message
            })
        }
    }
}

