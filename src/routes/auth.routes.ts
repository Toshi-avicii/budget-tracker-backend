import { Router } from "express";
import { googleSignIn, login, logout, resetPassword, sendResetLink, setTokenCookie, signUp } from '../controllers/auth.controller';
import { authMiddleware } from "../middleware/authMiddleware";
import rateLimit from "express-rate-limit";

const authRoutes = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 login attempts per IP
    message: {
        error: {
            message: "Too many login attempts, please try again after 15 min"
        }
    }
});

authRoutes.post("/sign-up", signUp);
authRoutes.post('/login', loginLimiter, login);
authRoutes.post('/forgot-password', sendResetLink);
authRoutes.post('/set-cookie', setTokenCookie);
authRoutes.get('/logout', authMiddleware, logout);
authRoutes.post('/reset-password', resetPassword);
authRoutes.post('/google-sign-in', googleSignIn);

export default authRoutes;
