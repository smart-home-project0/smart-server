import logger from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
    status?: number;
}

function errorHandler(err: ErrorWithStatus, req: Request, res: Response, next: NextFunction): void {
    logger.error(`[ERROR] ${err.message}`);

    const statusCode = err.status || 500;

    // Map with status codes and messages.  
    const errorMessages: Map<number, string> = new Map([
        [400, 'Bad Request'],
        [401, 'Unauthorized'],
        [403, 'Forbidden'],
        [404, 'Not Found'],
        [500, 'Internal Server Error'],
    ]);

    // If no message matched, use the default message
    const message = errorMessages.get(statusCode) || 'Something went wrong on the server';

    res.status(statusCode).json({
        success: false,
        message: message,
    });
}

// Unhandled Promise Rejection
process.on("unhandledRejection", (error: any) => {
    console.error("Unhandled Promise Rejection:", error.message);
});

// Uncaught Exception
process.on("uncaughtException", (error: any) => {
    console.error("Uncaught Exception:", error.message);
});

export default errorHandler;
