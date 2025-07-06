import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    return next.handle().pipe(
      map((data) => {
        const correlationId = request.headers['x-correlation-id'] as string;
        const tenantId = request.headers['x-tenant-id'] as string;
        
        // Set additional response headers
        if (correlationId) {
          response.setHeader('X-Correlation-ID', correlationId);
        }
        
        if (tenantId) {
          response.setHeader('X-Tenant-ID', tenantId);
        }
        
        response.setHeader('X-Response-Time', Date.now().toString());
        response.setHeader('X-API-Version', '1.0.0');
        
        // Handle different response types
        if (this.isApiResponse(data)) {
          // Data is already in the correct format
          return data;
        }
        
        if (this.isPaginatedResponse(data)) {
          // Handle paginated responses
          return {
            success: true,
            data: data.data,
            meta: data.meta,
            timestamp: new Date().toISOString(),
            correlationId,
            tenantId,
          };
        }
        
        if (this.isBulkResponse(data)) {
          // Handle bulk operation responses
          return {
            success: true,
            data: data.results,
            meta: {
              total: data.total,
              successful: data.successful,
              failed: data.failed,
              errors: data.errors,
            },
            timestamp: new Date().toISOString(),
            correlationId,
            tenantId,
          };
        }
        
        // Standard response transformation
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          correlationId,
          tenantId,
        };
      }),
    );
  }
  
  private isApiResponse(data: any): data is ApiResponse<T> {
    return (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      'timestamp' in data
    );
  }
  
  private isPaginatedResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'data' in data &&
      'meta' in data &&
      Array.isArray(data.data)
    );
  }
  
  private isBulkResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'results' in data &&
      'total' in data &&
      'successful' in data &&
      'failed' in data
    );
  }
}