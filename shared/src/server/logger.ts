import type { Logger as WinstonLogger } from "winston";
import { createLogger, format, transports } from "winston";
import path from "path";
import fs from "fs";
import { getConfigPath } from "./utils.js";

/**
 * Interface for a logger with standard log methods.
 */
export interface Logger {
    /**
     * Log informational messages.
     * @param args - Arguments to log.
     */
    info: (...args: unknown[]) => void;
    /**
     * Log warning messages.
     * @param args - Arguments to log.
     */
    warn: (...args: unknown[]) => void;
    /**
     * Log error messages.
     * @param args - Arguments to log.
     */
    error: (...args: unknown[]) => void;
    /**
     * Log debug messages.
     * @param args - Arguments to log.
     */
    debug: (...args: unknown[]) => void;
}

/**
 * Creates a custom Winston logger for a given project.
 * Logs to files in a project-specific directory and to the console in non-production environments.
 *
 * @param projectName - The name of the project for which to create the logger.
 * @returns A logger instance with info, warn, error, and debug methods.
 */
export const createCustomLogger = (projectName: string): Logger => {
    // Determine the log directory.
    const logDirectory = path.join(getConfigPath(), "logs", projectName);
    console.log("logDirectory", logDirectory);
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    }

    // Create the Winston logger.
    const logger: WinstonLogger = createLogger({
        level: "info",
        format: format.combine(format.timestamp(), format.json()),
        transports: [
            new transports.File({
                filename: path.join(logDirectory, "error.log"),
                level: "error",
            }),
            new transports.File({
                filename: path.join(logDirectory, "combined.log"),
            }),
        ],
    });

    // Add console transport if not in production.
    if (process.env.NODE_ENV !== "production") {
        logger.add(
            new transports.Console({
                format: format.simple(),
            }),
        );
    }

    return logger;
};
