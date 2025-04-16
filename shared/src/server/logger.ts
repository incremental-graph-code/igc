export interface Logger {
	info: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	error: (...args: any[]) => void;
	debug: (...args: any[]) => void;
}

export const createCustomLogger = (projectName: string): Logger => {
	// In Node, load the required modules.
	// Using require ensures these modules are only loaded in Node.
	const { createLogger, format, transports } = require("winston");
	const path = require("path");
	const fs = require("fs");
	const { getConfigPath } = require("./utils");

	// Determine the log directory.
	const logDirectory = path.join(getConfigPath(), "logs", projectName);
	console.log("logDirectory", logDirectory);
	if (!fs.existsSync(logDirectory)) {
		fs.mkdirSync(logDirectory, { recursive: true });
	}

	// Create the Winston logger.
	const logger = createLogger({
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
