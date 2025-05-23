import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { abac } from "../middleware/authorizeMiddleware";
import { getExpenseTypeData, getMonthlyData, getSummaryData } from "../controllers/dashboard.controller";

const dashboardRoutes = Router();

dashboardRoutes.get('/data/summary', authMiddleware, getSummaryData);
dashboardRoutes.get('/data/monthly', authMiddleware, getMonthlyData);
dashboardRoutes.get('/data/expense-types', authMiddleware, getExpenseTypeData)

export default dashboardRoutes;