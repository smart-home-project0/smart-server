//*************** Import Internal Modules ****************//
import AppError from './appError.js';
import logger from './utils/logger.js';

//*************** Error Handler Function ****************//
function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        // Operational error (known error)
        logger.error(`[ERROR] ${err.message}`);
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    // Unexpected errors
    logger.error(`[ERROR] ${err.message}`);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong on the server';
    
    res.status(statusCode).json({
        success: false,
        message: message,
    });
}   

// Unhandled Promise Rejection
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error.message);
});

// Uncaught Exception
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
});

export default errorHandler;
