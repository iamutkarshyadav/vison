import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ERROR_MESSAGES, ENV_CONSTANTS } from "./constants";

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const createError = (message: string, statusCode: number = 500): CustomError => {
    return new CustomError(message, statusCode);
};

export const handleError = (error: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = 500;
    let message = ERROR_MESSAGES.GENERAL.INTERNAL_ERROR;

    // Handle specific error types
    if (error instanceof CustomError) {
        statusCode = error.statusCode;
        message = error.message;
    } else if (error instanceof mongoose.Error.ValidationError) {
        statusCode = 400;
        message = "Validation failed";
    } else if (error instanceof mongoose.Error.CastError) {
        statusCode = 400;
        message = "Invalid data format";
    } else if (error instanceof mongoose.Error.MongoServerError) {
        if (error.code === 11000) {
            statusCode = 409;
            message = "Duplicate entry";
        } else {
            statusCode = 500;
            message = ERROR_MESSAGES.DATABASE.CONNECTION_FAILED;
        }
    } else if (error.name === "MongooseServerSelectionError") {
        statusCode = 503;
        message = ERROR_MESSAGES.DATABASE.CONNECTION_FAILED;
    } else if (error.name === "JsonWebTokenError") {
        statusCode = 401;
        message = ERROR_MESSAGES.AUTH.TOKEN_INVALID;
    } else if (error.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
    } else if (error.message) {
        message = error.message;
    }

    // Log error
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${statusCode}: ${message}`);
    if (error.stack && ENV_CONSTANTS.IS_DEVELOPMENT) {
        console.error(error.stack);
    }

    // Send response
    const response: any = {
        success: false,
        message,
    };

    // Add error details in development
    if (ENV_CONSTANTS.IS_DEVELOPMENT) {
        response.error = error.message;
        response.stack = error.stack;
    }

    // Add validation errors if available
    if (error.errors && Array.isArray(error.errors)) {
        response.errors = error.errors;
    }

    res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.path}`,
    });
};

export const methodNotAllowedHandler = (req: Request, res: Response) => {
    res.status(405).json({
        success: false,
        message: `Method not allowed: ${req.method} ${req.path}`,
    });
}; 