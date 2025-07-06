import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    
    // Generate correlation ID if not present
    const correlationId = (headers['x-correlation-id'] as string) || uuidv4();
    request.headers['x-correlation-id'] = correlationId;
    response.setHeader('X-Correlation-ID', correlationId);
    
    const tenantId = headers['x-tenant-id'] as string;
    const userAgent = headers['user-agent'] || 'Unknown';
    const startTime = Date.now();
    
    const logContext = {
      correlationId,
      tenantId,
      method,
      url,
      ip,
      userAgent,
    };

    this.logger.log(
      `Incoming Request: ${method} ${url}`,
      JSON.stringify(logContext),
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          
          const responseLogContext = {
            ...logContext,
            statusCode,
            duration: `${duration}ms`,
            responseSize: JSON.stringify(data).length,
          };

          this.logger.log(
            `Outgoing Response: ${method} ${url} - ${statusCode} - ${duration}ms`,
            JSON.stringify(responseLogContext),
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          
          const errorLogContext = {
            ...logContext,
            statusCode,
            duration: `${duration}ms`,
            error: error.message,
          };

          this.logger.error(
            `Request Error: ${method} ${url} - ${statusCode} - ${duration}ms`,
            error.stack,
            JSON.stringify(errorLogContext),
          );
        },
      }),
    );
  }
}