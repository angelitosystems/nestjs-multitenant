import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  // Central Database Configuration
  central: {
    type: process.env.CENTRAL_DB_TYPE || 'postgres',
    host: process.env.CENTRAL_DB_HOST || 'localhost',
    port: parseInt(process.env.CENTRAL_DB_PORT, 10) || 5432,
    username: process.env.CENTRAL_DB_USERNAME || 'postgres',
    password: process.env.CENTRAL_DB_PASSWORD || 'password',
    database: process.env.CENTRAL_DB_DATABASE || 'multitenant_central',
    ssl: process.env.CENTRAL_DB_SSL === 'true' ? {
      rejectUnauthorized: false,
    } : false,
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/central/*.js'],
    migrationsRun: true,
    extra: {
      max: parseInt(process.env.CENTRAL_DB_MAX_CONNECTIONS, 10) || 20,
      min: parseInt(process.env.CENTRAL_DB_MIN_CONNECTIONS, 10) || 5,
      acquire: parseInt(process.env.CENTRAL_DB_ACQUIRE_TIMEOUT, 10) || 30000,
      idle: parseInt(process.env.CENTRAL_DB_IDLE_TIMEOUT, 10) || 10000,
    },
  },

  // Tenant Database Template
  tenant: {
    type: process.env.TENANT_DB_TYPE || 'postgres',
    ssl: process.env.TENANT_DB_SSL === 'true' ? {
      rejectUnauthorized: false,
    } : false,
    synchronize: false, // Always use migrations in production
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/tenant/*.js'],
    migrationsRun: true,
    extra: {
      max: parseInt(process.env.TENANT_DB_MAX_CONNECTIONS, 10) || 10,
      min: parseInt(process.env.TENANT_DB_MIN_CONNECTIONS, 10) || 2,
      acquire: parseInt(process.env.TENANT_DB_ACQUIRE_TIMEOUT, 10) || 30000,
      idle: parseInt(process.env.TENANT_DB_IDLE_TIMEOUT, 10) || 10000,
    },
  },

  // Connection Pool Settings
  pool: {
    maxConnections: parseInt(process.env.MAX_TENANT_CONNECTIONS, 10) || 50,
    minConnections: parseInt(process.env.MIN_TENANT_CONNECTIONS, 10) || 5,
    acquireTimeoutMillis: parseInt(process.env.TENANT_ACQUIRE_TIMEOUT, 10) || 30000,
    idleTimeoutMillis: parseInt(process.env.TENANT_IDLE_TIMEOUT, 10) || 300000,
    reapIntervalMillis: parseInt(process.env.TENANT_REAP_INTERVAL, 10) || 1000,
    createTimeoutMillis: parseInt(process.env.TENANT_CREATE_TIMEOUT, 10) || 30000,
    destroyTimeoutMillis: parseInt(process.env.TENANT_DESTROY_TIMEOUT, 10) || 5000,
    createRetryIntervalMillis: parseInt(process.env.TENANT_CREATE_RETRY_INTERVAL, 10) || 200,
    propagateCreateError: process.env.TENANT_PROPAGATE_CREATE_ERROR === 'true' || false,
  },

  // Performance Monitoring
  monitoring: {
    enabled: process.env.DB_MONITORING_ENABLED === 'true' || true,
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD, 10) || 5000,
    connectionTimeoutThreshold: parseInt(process.env.DB_CONNECTION_TIMEOUT_THRESHOLD, 10) || 1000,
    enableQueryLogging: process.env.DB_ENABLE_QUERY_LOGGING === 'true' || false,
    enableConnectionLogging: process.env.DB_ENABLE_CONNECTION_LOGGING === 'true' || false,
  },

  // Backup and Recovery
  backup: {
    enabled: process.env.DB_BACKUP_ENABLED === 'true' || false,
    schedule: process.env.DB_BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retention: parseInt(process.env.DB_BACKUP_RETENTION_DAYS, 10) || 30,
    compression: process.env.DB_BACKUP_COMPRESSION === 'true' || true,
    encryption: process.env.DB_BACKUP_ENCRYPTION === 'true' || false,
    storageType: process.env.DB_BACKUP_STORAGE_TYPE || 'local', // local, s3, gcs
    storagePath: process.env.DB_BACKUP_STORAGE_PATH || './backups',
  },

  // Read Replicas (for high availability)
  readReplicas: {
    enabled: process.env.DB_READ_REPLICAS_ENABLED === 'true' || false,
    hosts: process.env.DB_READ_REPLICA_HOSTS ? process.env.DB_READ_REPLICA_HOSTS.split(',') : [],
    loadBalancing: process.env.DB_READ_REPLICA_LOAD_BALANCING || 'round-robin', // round-robin, random, least-connections
    maxRetries: parseInt(process.env.DB_READ_REPLICA_MAX_RETRIES, 10) || 3,
    retryDelay: parseInt(process.env.DB_READ_REPLICA_RETRY_DELAY, 10) || 1000,
  },
}));