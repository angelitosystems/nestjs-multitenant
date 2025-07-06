import { TenancyStrategy, TenancyDriver, TenantIdentifierType } from '@angelitosystems/nestjs-multitenant-core';

export default {
  // Multi-strategy tenant identification
  strategy: TenancyStrategy.MULTI,
  
  // Primary identification methods (in order of priority)
  identifiers: [
    {
      type: TenantIdentifierType.HEADER,
      key: 'x-tenant-id',
      required: false,
      priority: 1,
    },
    {
      type: TenantIdentifierType.SUBDOMAIN,
      key: 'subdomain',
      required: false,
      priority: 2,
      transform: (value: string) => value.toLowerCase().trim(),
    },
    {
      type: TenantIdentifierType.JWT_CLAIM,
      key: 'tenant_id',
      required: false,
      priority: 3,
    },
    {
      type: TenantIdentifierType.QUERY_PARAM,
      key: 'tenant',
      required: false,
      priority: 4,
    },
  ],

  // Database configuration
  driver: TenancyDriver.POSTGRES,
  
  // Central database for tenant management
  centralDb: {
    type: 'postgres',
    host: process.env.CENTRAL_DB_HOST || 'localhost',
    port: parseInt(process.env.CENTRAL_DB_PORT) || 5432,
    username: process.env.CENTRAL_DB_USERNAME || 'postgres',
    password: process.env.CENTRAL_DB_PASSWORD || 'password',
    database: process.env.CENTRAL_DB_DATABASE || 'multitenant_central',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.CENTRAL_DB_SSL === 'true' ? {
      rejectUnauthorized: false,
    } : false,
    extra: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  },

  // Tenant database template
  tenantDbTemplate: {
    type: 'postgres',
    synchronize: false, // Use migrations in production
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    ssl: process.env.TENANT_DB_SSL === 'true' ? {
      rejectUnauthorized: false,
    } : false,
    extra: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    migrations: ['dist/migrations/tenant/*.js'],
    migrationsRun: true,
    entities: ['dist/**/*.entity.js'],
  },

  // Advanced connection pooling
  connectionPooling: {
    enabled: true,
    maxConnections: 50,
    minConnections: 5,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 300000,
    reapIntervalMillis: 1000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    createRetryIntervalMillis: 200,
    propagateCreateError: false,
  },

  // Caching configuration
  caching: {
    enabled: true,
    ttl: 300, // 5 minutes
    maxSize: 1000,
    strategy: 'lru',
    keyPrefix: 'tenant:',
    
    // Cache tenant configurations
    cacheTenantConfig: true,
    tenantConfigTtl: 600, // 10 minutes
    
    // Cache database connections
    cacheConnections: true,
    connectionCacheTtl: 1800, // 30 minutes
    
    // Cache tenant metadata
    cacheTenantMetadata: true,
    metadataTtl: 300, // 5 minutes
  },

  // Security configuration
  security: {
    // Tenant isolation validation
    strictIsolation: true,
    validateTenantAccess: true,
    
    // Cross-tenant data protection
    preventCrossTenantQueries: true,
    auditCrossTenantAttempts: true,
    
    // Rate limiting per tenant
    enableTenantRateLimit: true,
    tenantRateLimit: {
      windowMs: 60000, // 1 minute
      max: 1000, // requests per window
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    
    // IP whitelisting per tenant
    enableIpWhitelist: true,
    defaultIpWhitelist: [],
    
    // Encryption for sensitive tenant data
    encryptSensitiveData: true,
    encryptionKey: process.env.TENANT_ENCRYPTION_KEY,
  },

  // Error handling and resilience
  errorHandling: {
    // Retry configuration
    retryAttempts: 3,
    retryDelay: 1000,
    retryDelayMultiplier: 2,
    maxRetryDelay: 10000,
    
    // Circuit breaker
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    },
    
    // Fallback strategies
    fallbackToDefault: false,
    defaultTenantId: null,
    
    // Error reporting
    reportErrors: true,
    errorReportingService: 'sentry',
  },

  // Monitoring and metrics
  monitoring: {
    enabled: true,
    
    // Performance metrics
    trackPerformance: true,
    performanceThresholds: {
      connectionTime: 1000, // ms
      queryTime: 5000, // ms
      requestTime: 10000, // ms
    },
    
    // Health checks
    healthChecks: {
      enabled: true,
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retries: 3,
    },
    
    // Metrics collection
    metrics: {
      enabled: true,
      prefix: 'multitenant',
      labels: ['tenant_id', 'operation', 'status'],
    },
    
    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: 'json',
      includeMetadata: true,
      sensitiveFields: ['password', 'token', 'secret'],
    },
  },

  // Multi-region support
  multiRegion: {
    enabled: false,
    defaultRegion: 'us-east-1',
    regions: [
      {
        name: 'us-east-1',
        primary: true,
        dbConfig: {
          host: 'db-us-east-1.example.com',
          port: 5432,
        },
      },
      {
        name: 'eu-west-1',
        primary: false,
        dbConfig: {
          host: 'db-eu-west-1.example.com',
          port: 5432,
        },
      },
    ],
    
    // Cross-region replication
    replication: {
      enabled: false,
      strategy: 'async',
      lag: 1000, // ms
    },
  },

  // Compliance and governance
  compliance: {
    // Data residency
    enforceDataResidency: true,
    defaultDataRegion: 'us',
    
    // GDPR compliance
    gdprCompliant: true,
    dataRetentionDays: 2555, // 7 years
    enableRightToBeDeleted: true,
    
    // SOC2 compliance
    soc2Compliant: true,
    auditLogging: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
    
    // HIPAA compliance (if applicable)
    hipaaCompliant: false,
    enableBaa: false,
  },

  // Feature flags per tenant
  featureFlags: {
    enabled: true,
    provider: 'database', // 'database' | 'redis' | 'external'
    cacheFlags: true,
    flagCacheTtl: 300, // 5 minutes
    
    // Default flags
    defaultFlags: {
      advancedReporting: false,
      apiAccess: true,
      webhooks: false,
      sso: false,
      customBranding: false,
      advancedSecurity: false,
    },
  },

  // Tenant lifecycle management
  lifecycle: {
    // Automatic provisioning
    autoProvisioning: true,
    provisioningTimeout: 300000, // 5 minutes
    
    // Tenant suspension
    enableSuspension: true,
    suspensionReasons: ['payment_failed', 'policy_violation', 'security_breach'],
    
    // Tenant archival
    enableArchival: true,
    archivalAfterDays: 90,
    
    // Tenant deletion
    enableDeletion: true,
    deletionAfterDays: 365,
    softDelete: true,
  },

  // Integration hooks
  hooks: {
    // Tenant creation hooks
    onTenantCreate: [
      'sendWelcomeEmail',
      'setupDefaultData',
      'createBillingAccount',
      'notifyAdmins',
    ],
    
    // Tenant update hooks
    onTenantUpdate: [
      'validateChanges',
      'updateBillingInfo',
      'auditChanges',
    ],
    
    // Tenant deletion hooks
    onTenantDelete: [
      'backupData',
      'cancelBilling',
      'notifyStakeholders',
      'cleanupResources',
    ],
    
    // Connection hooks
    onConnectionCreate: ['validateConnection', 'logConnection'],
    onConnectionDestroy: ['logDisconnection', 'cleanupResources'],
  },
};