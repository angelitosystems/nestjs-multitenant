export const TENANT_CONFIG_TOKEN = 'TENANT_CONFIG_TOKEN';
export const TENANT_CONNECTION_SERVICE_TOKEN = 'TENANT_CONNECTION_SERVICE_TOKEN';
export const TENANT_CONTEXT_TOKEN = 'TENANT_CONTEXT_TOKEN';
export const CENTRAL_DATABASE_CONNECTION_TOKEN = 'CENTRAL_DATABASE_CONNECTION_TOKEN';
export const TENANT_CONNECTION_TOKEN = 'TENANT_CONNECTION_TOKEN';
export const TENANT_REPOSITORY_TOKEN = 'TENANT_REPOSITORY_TOKEN';

export const DEFAULT_TENANT_TABLE_NAME = 'tenants';
export const DEFAULT_CONNECTION_POOL_SIZE = 10;
export const DEFAULT_CONNECTION_TIMEOUT = 30000;
export const DEFAULT_IDLE_TIMEOUT = 300000;

export const TENANT_HEADER_DEFAULT = 'X-Tenant-ID';
export const TENANT_QUERY_PARAM_DEFAULT = 'tenant';
export const TENANT_SUBDOMAIN_PATTERN_DEFAULT = '^([a-zA-Z0-9-]+)\\.';

export const ERROR_MESSAGES = {
  TENANT_NOT_FOUND: 'Tenant not found',
  TENANT_INACTIVE: 'Tenant is inactive',
  INVALID_TENANT_ID: 'Invalid tenant ID',
  CONNECTION_FAILED: 'Failed to establish tenant connection',
  CENTRAL_DB_CONNECTION_FAILED: 'Failed to connect to central database',
  TENANT_CONFIG_MISSING: 'Tenant configuration is missing',
  UNSUPPORTED_DATABASE_DRIVER: 'Unsupported database driver',
  TENANT_IDENTIFIER_NOT_FOUND: 'Tenant identifier not found in request'
} as const;