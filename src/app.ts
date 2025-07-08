import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import routes from "./routes";
import logger from "./utils/logger";
import { connectRedis, dynamicRateLimiter, redisClient } from "./utils/rate-limiter";
import { errorMiddleware } from "./middleware/errorMiddleware";
import passport from "passport";
import "./utils/passport"

const app = express();
app.set('trust proxy', 1);

// Define a custom format for Morgan to log using Winston
const stream = {
    write: (message: string) => logger.info(message.trim()),
};

connectRedis();

// Middleware
app.use(express.json()); // enable json
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://budget-tracker-frontend-lime.vercel.app'],
    credentials: true
})); // Cross-Origin Resource Sharing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(morgan("combined", { stream })); // Logging
// app.use(dynamicRateLimiter); // rate limiting
app.use(passport.initialize()); // using passport

// for debugging redis data 
app.get('/debug-keys', async (req, res) => {
    const keys = await redisClient.keys('*');
    const values = await Promise.all(keys.map(async (key) => {
      const value = await redisClient.get(key);
      return { key, value };
    }));
    res.json(values);
  });
  
// Routes
app.use("/api", routes);

// add the error middleware to the last to catch errors
app.use(errorMiddleware);

export default app;
