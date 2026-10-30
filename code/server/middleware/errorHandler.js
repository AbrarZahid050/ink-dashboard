import { ApiError } from "../utils/ApiError.js";
import { logger } from "../config/logger.js";
import { Prisma } from "@prisma/client";

const prismaErrorMap = {
  P2002: {
    statusCode: 409,
    message: "A record with these values already exists.",
  },
  P2003: {
    statusCode: 409,
    message: "The operation violates a relationship constraint.",
  },
  P2025: {
    statusCode: 404,
    message: "Requested record not found.",
  },
};

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  // Handle application errors.
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.errors && { errors: error.errors }),
    });
  }

  // Handle known Prisma errors.
  const isPrismaError = error instanceof Prisma.PrismaClientKnownRequestError;
  const prismaError = isPrismaError ? prismaErrorMap[error.code] : null;

  if (prismaError) {
    return res.status(prismaError.statusCode).json({
      success: false,
      message: prismaError.message,
    });
  }

  // Handle unexpected errors.
  logger.error(
    {
      err: error,
      method: req.method,
      path: req.originalUrl,
    },
    "Unhandled application error",
  );

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
