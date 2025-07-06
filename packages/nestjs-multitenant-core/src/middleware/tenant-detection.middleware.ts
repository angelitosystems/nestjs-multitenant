import { Injectable, NestMiddleware, Inject, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  TenantConfig,
  TenantIdentifierType,
} from '../interfaces/tenant-config.interface';
import {
  TENANT_CONFIG_TOKEN,
  TENANT_CONTEXT_TOKEN,
} from '../constants/tokens';
import {
  TenantIdentifierNotFoundException,
  InvalidTenantIdException,
} from '../exceptions/tenant.exceptions';
import { TenantConnectionService } from '../services/tenant-connection.service';

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantContext?: any;
    }
  }
}

@Injectable()
export class TenantDetectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantDetectionMiddleware.name);

  constructor(
    @Inject(TENANT_CONFIG_TOKEN)
    private readonly tenantConfig: TenantConfig,
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = this.extractTenantId(req);
      
      if (!tenantId) {
        throw new TenantIdentifierNotFoundException(
          this.tenantConfig.tenantIdentifier.type,
          this.tenantConfig.tenantIdentifier.key,
        );
      }

      if (!this.isValidTenantId(tenantId)) {
        throw new InvalidTenantIdException(tenantId);
      }

      // Set tenant ID in request
      req.tenantId = tenantId;

      // Optionally preload tenant context
      if (this.shouldPreloadContext(req)) {
        req.tenantContext = await this.tenantConnectionService.getTenantContext(tenantId);
      }

      this.logger.debug(`Tenant detected: ${tenantId}`);
      next();
    } catch (error) {
      this.logger.error('Tenant detection failed:', error);
      next(error);
    }
  }

  private extractTenantId(req: Request): string | null {
    const { type, key, pattern } = this.tenantConfig.tenantIdentifier;

    switch (type) {
      case TenantIdentifierType.HEADER:
        return this.extractFromHeader(req, key);
      
      case TenantIdentifierType.SUBDOMAIN:
        return this.extractFromSubdomain(req, pattern || '^([a-zA-Z0-9-]+)\\.');
      
      case TenantIdentifierType.QUERY_PARAM:
        return this.extractFromQueryParam(req, key);
      
      default:
        this.logger.error(`Unsupported tenant identifier type: ${type}`);
        return null;
    }
  }

  private extractFromHeader(req: Request, headerName: string): string | null {
    const tenantId = req.headers[headerName.toLowerCase()] as string;
    return tenantId || null;
  }

  private extractFromSubdomain(req: Request, pattern: string): string | null {
    const host = req.get('host');
    if (!host) {
      return null;
    }

    try {
      const regex = new RegExp(pattern);
      const match = host.match(regex);
      return match ? match[1] : null;
    } catch (error) {
      this.logger.error(`Invalid subdomain pattern: ${pattern}`, error);
      return null;
    }
  }

  private extractFromQueryParam(req: Request, paramName: string): string | null {
    return (req.query[paramName] as string) || null;
  }

  private isValidTenantId(tenantId: string): boolean {
    // Basic validation - can be extended
    if (!tenantId || typeof tenantId !== 'string') {
      return false;
    }

    // Check length
    if (tenantId.length < 1 || tenantId.length > 100) {
      return false;
    }

    // Check for valid characters (alphanumeric, hyphens, underscores)
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(tenantId);
  }

  private shouldPreloadContext(req: Request): boolean {
    // Preload context for certain routes or methods
    // This can be configured based on your needs
    const preloadRoutes = ['/api/', '/graphql'];
    const path = req.path;
    
    return preloadRoutes.some(route => path.startsWith(route));
  }
}

// Factory function for creating the middleware
export function createTenantDetectionMiddleware(
  tenantConfig: TenantConfig,
  tenantConnectionService: TenantConnectionService,
): TenantDetectionMiddleware {
  return new TenantDetectionMiddleware(tenantConfig, tenantConnectionService);
}