import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  details?: any;
  correlationId?: string;
  tenantId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error
    this.logError(exception, request, errorResponse);

    // Send the response
    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const correlationId = request.headers['x-correlation-id'] as string;
    const tenantId = request.headers['x-tenant-id'] as string;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | undefined;
    let details: any;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || exception.message;
        error = responseObj.error;
        details = responseObj.details;
      }
    } else if (exception instanceof QueryFailedError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Database query failed';
      error = 'Database Error';
      
      // Handle specific database errors
      if (exception.message.includes('duplicate key')) {
        message = 'Resource already exists';
        statusCode = HttpStatus.CONFLICT;
      } else if (exception.message.includes('foreign key')) {
        message = 'Referenced resource not found';
        statusCode = HttpStatus.BAD_REQUEST;
      } else if (exception.message.includes('not null')) {
        message = 'Required field is missing';
        statusCode = HttpStatus.BAD_REQUEST;
      }
      
      // In development, include more details
      if (process.env.NODE_ENV === 'development') {
        details = {
          query: exception.query,
          parameters: exception.parameters,
          driverError: exception.driverError,
        };
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      
      // Handle specific error types
      if (exception.name === 'ValidationError') {
        statusCode = HttpStatus.BAD_REQUEST;
      } else if (exception.name === 'UnauthorizedError') {
        statusCode = HttpStatus.UNAUTHORIZED;
      } else if (exception.name === 'ForbiddenError') {
        statusCode = HttpStatus.FORBIDDEN;
      } else if (exception.name === 'NotFoundError') {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (exception.name === 'ConflictError') {
        statusCode = HttpStatus.CONFLICT;
      } else if (exception.name === 'TooManyRequestsError') {
        statusCode = HttpStatus.TOO_MANY_REQUESTS;
      }
      
      // In development, include stack trace
      if (process.env.NODE_ENV === 'development') {
        details = {
          stack: exception.stack,
        };
      }
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      timestamp,
      path,
      method,
      message,
    };

    if (error) {
      errorResponse.error = error;
    }

    if (details) {
      errorResponse.details = details;
    }

    if (correlationId) {
      errorResponse.correlationId = correlationId;
    }

    if (tenantId) {
      errorResponse.tenantId = tenantId;
    }

    return errorResponse;
  }

  private logError(exception: unknown, request: Request, errorResponse: ErrorResponse): void {
    const { statusCode, message, correlationId, tenantId } = errorResponse;
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';

    const logContext = {
      statusCode,
      method,
      url,
      ip,
      userAgent,
      correlationId,
      tenantId,
      timestamp: errorResponse.timestamp,
    };

    if (statusCode >= 500) {
      // Server errors - log as error with full details
      this.logger.error(
        `${method} ${url} - ${statusCode} - ${message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logContext),
      );
    } else if (statusCode >= 400) {
      // Client errors - log as warning
      this.logger.warn(
        `${method} ${url} - ${statusCode} - ${message}`,
        JSON.stringify(logContext),
      );
    } else {
      // Other errors - log as debug
      this.logger.debug(
        `${method} ${url} - ${statusCode} - ${message}`,
        JSON.stringify(logContext),
      );
    }
  }
}