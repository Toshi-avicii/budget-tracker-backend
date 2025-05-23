import { NextFunction, Response, Request } from "express";
import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient, RedisClientType } from "redis";

export let redisClient: RedisClientType;
let useRedis = false;

// In-memory fallback
const fallbackRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: { error: "Too many requests from this IP (in-memory fallback)" }
});

// Redis-backed limiter setup
let redisRateLimiter: RateLimitRequestHandler;

// Connect to Redis with retry
export async function connectRedis() {
    redisClient = createClient();

    redisClient.on('error', (err) => {
        // console.log('❌ Redis connection failed. Using in-memory fallback.');
        useRedis = false;
    });

    redisClient.on('connect', () => {
        console.log('✅ Connected to Redis');
    });

    try {
        await redisClient.connect();
        useRedis = true;

        // Only initialize once after connection
        redisRateLimiter = rateLimit({
            windowMs: 1 * 60 * 1000,
            max: 30,
            message: { error: "Too many requests from this IP" },
            store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) })
        });
    } catch (err) {
        console.log('🔄 Retry Redis connection in 10s...');
        setTimeout(connectRedis, 10000);
    }
}

// Middleware with dynamic rate limiter
export const dynamicRateLimiter = (req: Request, res: Response, next: NextFunction) => {
    if (useRedis && redisRateLimiter) {
        return redisRateLimiter(req, res, next);
    }
    return fallbackRateLimiter(req, res, next);
};