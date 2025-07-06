import { TenancyStrategy, TenancyDriver, TenantIdentifierType } from '@angelitosystems/nestjs-multitenant-core';

/**
 * Advanced tenant configuration for intermediate usage
 * 
 * This configuration demonstrates more advanced features:
 * - Multiple tenant identification methods
 * - Connection pooling optimization
 * - Caching strategies
 * - Error handling configuration
 */
export default {
  // Database driver for tenant connections
  driver: TenancyDriver.POSTGRESQL,
  
  // Tenancy strategy - database per tenant for maximum isolation
  strategy: TenancyStrategy.DATABASE_PER_TENANT,
  
  // Central database configuration with enhanced security
  centralDb: {
    host: process.env.CENTRAL_DB_HOST || 'localhost',
    port: parseInt(process.env.CENTRAL_DB_PORT || '5432'),
    username: process.env.CENTRAL_DB_USERNAME || 'postgres',
    password: process.env.CENTRAL_DB_PASSWORD || 'password',
    database: process.env.CENTRAL_DB_DATABASE || 'central_tenants',
    ssl: process.env.CENTRAL_DB_SSL === 'true' || false,
    extra: {
      // Connection pool settings for central database
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  },
  
  // Primary tenant identification method
  tenantIdentifier: {
    type: TenantIdentifierType.HEADER,
    key: 'X-Tenant-ID',
  },
  
  // Fallback tenant identification methods
  fallbackIdentifiers: [
    {
      type: TenantIdentifierType.SUBDOMAIN,
      pattern: '^([a-zA-Z0-9-]+)\\.',
    },
    {
      type: TenantIdentifierType.QUERY_PARAM,
      key: 'tenant',
    },
  ],
  
  // Enhanced connection management
  cacheConnections: true,
  maxConnections: parseInt(process.env.MAX_TENANT_CONNECTIONS || '20'),
  connectionTimeout: parseInt(process.env.TENANT_CONNECTION_TIMEOUT || '30000'),
  idleTimeout: parseInt(process.env.TENANT_IDLE_TIMEOUT || '300000'),
  
  // Connection pool settings per tenant
  connectionPool: {
    min: 2,
    max: 10,
    acquire: 30000,
    idle: 10000,
    evict: 1000,
  },
  
  // Caching configuration
  cache: {
    enabled: true,
    ttl: parseInt(process.env.TENANT_CACHE_TTL || '300'), // 5 minutes
    maxSize: parseInt(process.env.TENANT_CACHE_SIZE || '1000'),
    refreshThreshold: 0.8, // Refresh cache when 80% of TTL has passed
  },
  
  // Error handling and retry configuration
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    circuitBreakerThreshold: 5, // Open circuit after 5 failures
    circuitBreakerTimeout: 60000, // 1 minute
  },
  
  // Monitoring and logging
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    logLevel: process.env.LOG_LEVEL || 'info',
    metricsEnabled: true,
    healthCheckInterval: 30000, // 30 seconds
  },
  
  // Security settings
  security: {
    encryptPasswords: true,
    validateTenantAccess: true,
    auditEnabled: true,
    rateLimiting: {
      enabled: true,
      windowMs: 60000, // 1 minute
      maxRequests: 100,
    },
  },
};