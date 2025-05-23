import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

// Define log rotation
const logRotation = new DailyRotateFile({
  filename: path.join(__dirname, "../../logs", "application-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d", // Keep logs for 14 days
});

// Create Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    logRotation,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Log to console in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
