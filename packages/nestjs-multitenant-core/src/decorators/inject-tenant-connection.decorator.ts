import { Inject, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TENANT_CONNECTION_TOKEN } from '../constants/tokens';
import { TenantConnectionService } from '../services/tenant-connection.service';

/**
 * Parameter decorator that injects the tenant connection for the current request
 * Usage: constructor(@InjectTenantConnection() private connection: DataSource) {}
 */
export const InjectTenantConnection = () => {
  return createParamDecorator(
    async (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const tenantId = request.tenantId;
      
      if (!tenantId) {
        throw new Error('Tenant ID not found in request. Make sure TenantDetectionMiddleware is properly configured.');
      }

      // Get tenant connection service from the context
      const tenantConnectionService = ctx.switchToHttp().getRequest().app.get(TenantConnectionService);
      
      if (!tenantConnectionService) {
        throw new Error('TenantConnectionService not found. Make sure TenancyModule is properly imported.');
      }

      return await tenantConnectionService.getTenantConnection(tenantId);
    },
  )();
};

/**
 * Property decorator for injecting TenantConnectionService
 * Usage: constructor(@InjectTenantConnectionService() private tenantService: TenantConnectionService) {}
 */
export const InjectTenantConnectionService = () => {
  return Inject(TenantConnectionService);
};

/**
 * Parameter decorator that injects the full tenant context (tenant info + connection)
 * Usage: async method(@InjectTenantContext() tenantContext: TenantContext) {}
 */
export const InjectTenantContext = () => {
  return createParamDecorator(
    async (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const tenantId = request.tenantId;
      
      if (!tenantId) {
        throw new Error('Tenant ID not found in request. Make sure TenantDetectionMiddleware is properly configured.');
      }

      // Return cached context if available
      if (request.tenantContext) {
        return request.tenantContext;
      }

      // Get tenant connection service from the context
      const tenantConnectionService = ctx.switchToHttp().getRequest().app.get(TenantConnectionService);
      
      if (!tenantConnectionService) {
        throw new Error('TenantConnectionService not found. Make sure TenancyModule is properly imported.');
      }

      return await tenantConnectionService.getTenantContext(tenantId);
    },
  )();
};

/**
 * Parameter decorator that injects only the tenant ID
 * Usage: async method(@InjectTenantId() tenantId: string) {}
 */
export const InjectTenantId = () => {
  return createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const tenantId = request.tenantId;
      
      if (!tenantId) {
        throw new Error('Tenant ID not found in request. Make sure TenantDetectionMiddleware is properly configured.');
      }

      return tenantId;
    },
  )();
};

/**
 * Parameter decorator that injects tenant information without the connection
 * Usage: async method(@InjectTenantInfo() tenantInfo: TenantConnectionInfo) {}
 */
export const InjectTenantInfo = () => {
  return createParamDecorator(
    async (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const tenantId = request.tenantId;
      
      if (!tenantId) {
        throw new Error('Tenant ID not found in request. Make sure TenantDetectionMiddleware is properly configured.');
      }

      // Return cached context if available
      if (request.tenantContext) {
        return request.tenantContext.tenantInfo;
      }

      // Get tenant connection service from the context
      const tenantConnectionService = ctx.switchToHttp().getRequest().app.get(TenantConnectionService);
      
      if (!tenantConnectionService) {
        throw new Error('TenantConnectionService not found. Make sure TenancyModule is properly imported.');
      }

      const context = await tenantConnectionService.getTenantContext(tenantId);
      return context.tenantInfo;
    },
  )();
};