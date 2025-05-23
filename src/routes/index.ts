import { Router } from "express";
import authRoutes from "./auth.routes";
import testRoutes from "./test.routes";
import budgetRoutes from "./budget.routes";
import transactionRoutes from "./transaction.routes";
import messagesRoute from "./messages.routes";
import dashboardRoutes from "./dashboard.routes";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use('/budget', budgetRoutes);
routes.use('/transactions', transactionRoutes);
routes.use('/messages', messagesRoute);
routes.use('/dashboard', dashboardRoutes);
routes.use("/test", testRoutes);

export default routes;
