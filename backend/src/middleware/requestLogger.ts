import { Request, Response, NextFunction } from "express";
import { createCustomLogger } from "shared/server";

const logger = createCustomLogger("backend");

const requestLogger = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const startTime = Date.now();
	res.on("finish", () => {
		const duration = Date.now() - startTime;
		logger.info(
			`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${
				res.statusCode
			} - ${duration}ms`,
		);
	});
	next();
};

export default requestLogger;
