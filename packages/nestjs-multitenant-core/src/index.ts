// Main module
export { TenancyModule } from './tenancy.module';

// Interfaces and types
export {
  TenantConfig,
  TenantConnectionInfo,
  TenantContext,
  CentralDatabaseConfig,
  TenantIdentifierConfig,
  TenancyDriver,
  TenancyStrategy,
  TenantIdentifierType,
} from './interfaces/tenant-config.interface';

// Services
export { TenantConnectionService } from './services/tenant-connection.service';
export { CentralDatabaseService } from './services/central-database.service';

// Middleware
export { TenantDetectionMiddleware } from './middleware/tenant-detection.middleware';

// Decorators
export {
  InjectTenantConnection,
  InjectTenantConnectionService,
  InjectTenantContext,
  InjectTenantId,
  InjectTenantInfo,
} from './decorators/inject-tenant-connection.decorator';

// Exceptions
export {
  TenantNotFoundException,
  TenantInactiveException,
  InvalidTenantIdException,
  TenantConnectionException,
  CentralDatabaseConnectionException,
  TenantConfigMissingException,
  UnsupportedDatabaseDriverException,
  TenantIdentifierNotFoundException,
} from './exceptions/tenant.exceptions';

// Constants
export {
  TENANT_CONFIG_TOKEN,
  TENANT_CONNECTION_SERVICE_TOKEN,
  TENANT_CONTEXT_TOKEN,
  CENTRAL_DATABASE_CONNECTION_TOKEN,
  TENANT_CONNECTION_TOKEN,
  TENANT_REPOSITORY_TOKEN,
  DEFAULT_TENANT_TABLE_NAME,
  DEFAULT_CONNECTION_POOL_SIZE,
  DEFAULT_CONNECTION_TIMEOUT,
  DEFAULT_IDLE_TIMEOUT,
  TENANT_HEADER_DEFAULT,
  TENANT_QUERY_PARAM_DEFAULT,
  TENANT_SUBDOMAIN_PATTERN_DEFAULT,
  ERROR_MESSAGES,
} from './constants/tokens';