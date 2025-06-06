import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || "development",
  dbUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  mailAppPassword: process.env.MAIL_APP_PASSWORD || "",
  senderMailId: process.env.MAIL_ID || '',
  frontendUrl: process.env.FRONTEND_URL,
  upstashRedisUrl: process.env.UPSTASH_REDIS_URL,
  upstashRedisPassword: process.env.UPSTASH_REDIS_PASSWORD,
  googleId: process.env.GOOGLE_ID || '',
  googleSecret: process.env.GOOGLE_SECRET || '',
  backendUrl: process.env.BACKEND_URL || ''
};
