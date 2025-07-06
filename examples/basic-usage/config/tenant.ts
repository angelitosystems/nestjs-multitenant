import { TenancyStrategy, TenancyDriver, TenantIdentifierType } from '@angelitosystems/nestjs-multitenant-core';

/**
 * Tenant configuration for multitenancy
 * 
 * This configuration defines how the multitenancy system should work:
 * - driver: The database driver to use (postgresql)
 * - strategy: How tenants are isolated (database_per_tenant)
 * - centralDb: Connection to the central database that stores tenant information
 * - tenantIdentifier: How to identify which tenant a request belongs to
 */
export default {
  // Database driver for tenant connections
  driver: TenancyDriver.POSTGRESQL,
  
  // Tenancy strategy - how tenants are isolated
  strategy: TenancyStrategy.DATABASE_PER_TENANT,
  
  // Central database configuration
  // This database stores information about all tenants
  centralDb: {
    host: process.env.CENTRAL_DB_HOST || 'localhost',
    port: parseInt(process.env.CENTRAL_DB_PORT || '5432'),
    username: process.env.CENTRAL_DB_USERNAME || 'postgres',
    password: process.env.CENTRAL_DB_PASSWORD || 'password',
    database: process.env.CENTRAL_DB_DATABASE || 'central_tenants',
    ssl: process.env.CENTRAL_DB_SSL === 'true' || false,
  },
  
  // How to identify tenants in incoming requests
  tenantIdentifier: {
    type: TenantIdentifierType.HEADER,
    key: 'X-Tenant-ID',
  },
  
  // Connection pooling and caching options
  cacheConnections: true,
  maxConnections: parseInt(process.env.MAX_TENANT_CONNECTIONS || '10'),
  connectionTimeout: parseInt(process.env.TENANT_CONNECTION_TIMEOUT || '30000'),
  idleTimeout: parseInt(process.env.TENANT_IDLE_TIMEOUT || '300000'),
};