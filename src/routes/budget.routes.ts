import { Router } from "express";
import { addNewBudget, deleteOneBudget, editBudget, getBudgetCategoryList, getBudgetList, getBudgetPeriodList, getOneBudget, getShortBudgetList } from "../controllers/budget.controller";
import { authMiddleware } from "../middleware/authMiddleware";
import { abac } from "../middleware/authorizeMiddleware";

// abac middleware is "Attribute Based Access Control", this is used here only for demonstration purpose

const budgetRoutes = Router();

budgetRoutes.post('/add-new', authMiddleware, addNewBudget);
budgetRoutes.get('/', authMiddleware, abac('read:own', 'budget'), getBudgetList);
budgetRoutes.get('/categories', authMiddleware, getBudgetCategoryList);
budgetRoutes.get('/periods', authMiddleware, getBudgetPeriodList);
budgetRoutes.get('/short', authMiddleware, getShortBudgetList);
budgetRoutes
.route('/:budgetId')
.all(authMiddleware)
.put(editBudget)
.get(getOneBudget)
.delete(deleteOneBudget)

export default budgetRoutes;