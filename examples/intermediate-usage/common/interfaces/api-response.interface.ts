import { PaginationMetaDto } from '../dto/pagination.dto';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  timestamp: Date;
  pagination?: PaginationMetaDto;
  metadata?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  timestamp: Date;
  path?: string;
  method?: string;
  correlationId?: string;
  details?: Record<string, any>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string;
  timestamp: Date;
  pagination?: PaginationMetaDto;
  metadata?: Record<string, any>;
}

export interface BulkOperationResponse {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors?: Array<{
    index: number;
    error: string;
    data?: any;
  }>;
  timestamp: Date;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: Record<string, {
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  }>;
}