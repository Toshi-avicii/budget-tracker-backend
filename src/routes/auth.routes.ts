import { Router } from "express";
import { googleSignIn, login, logout, resetPassword, sendResetLink, setTokenCookie, signUp } from '../controllers/auth.controller';
import { authMiddleware } from "../middleware/authMiddleware";
import rateLimit from "express-rate-limit";
import passport from "passport";
import config from "../config";
import jwt from 'jsonwebtoken'

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
authRoutes.get('/google', passport.authenticate("google", { scope: ["profile", "email"] }));
authRoutes.get("/google/callback", 
    passport.authenticate("google", { session: false, failureRedirect: `${config.frontendUrl}/sign-in` }), 
    (req, res) => {
        const user = req.user as any;
        const token = jwt.sign(user, config.jwtSecret, {
            expiresIn: '1d'
        });
        // Redirect to frontend with token in query
        res.redirect(`${config.frontendUrl}/sign-in?token=${token}`);
    })

export default authRoutes;
