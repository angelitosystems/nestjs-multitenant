import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  // Main Redis Configuration
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  username: process.env.REDIS_USERNAME || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  
  // Connection Options
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10) || 10000,
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT, 10) || 5000,
  retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY_FAILOVER, 10) || 100,
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST, 10) || 3,
  lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true' || true,
  keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE, 10) || 30000,
  
  // SSL/TLS Configuration
  tls: process.env.REDIS_TLS_ENABLED === 'true' ? {
    rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
    cert: process.env.REDIS_TLS_CERT || undefined,
    key: process.env.REDIS_TLS_KEY || undefined,
    ca: process.env.REDIS_TLS_CA || undefined,
  } : undefined,

  // Cache Configuration
  cache: {
    db: parseInt(process.env.REDIS_CACHE_DB, 10) || 1,
    ttl: parseInt(process.env.REDIS_CACHE_TTL, 10) || 300, // 5 minutes
    max: parseInt(process.env.REDIS_CACHE_MAX_ITEMS, 10) || 1000,
    keyPrefix: process.env.REDIS_CACHE_KEY_PREFIX || 'cache:',
    
    // Cache strategies
    strategies: {
      tenant: {
        ttl: parseInt(process.env.REDIS_TENANT_CACHE_TTL, 10) || 600, // 10 minutes
        keyPrefix: 'tenant:',
      },
      connection: {
        ttl: parseInt(process.env.REDIS_CONNECTION_CACHE_TTL, 10) || 1800, // 30 minutes
        keyPrefix: 'connection:',
      },
      session: {
        ttl: parseInt(process.env.REDIS_SESSION_CACHE_TTL, 10) || 3600, // 1 hour
        keyPrefix: 'session:',
      },
      user: {
        ttl: parseInt(process.env.REDIS_USER_CACHE_TTL, 10) || 900, // 15 minutes
        keyPrefix: 'user:',
      },
    },
  },

  // Session Store Configuration
  session: {
    db: parseInt(process.env.REDIS_SESSION_DB, 10) || 2,
    ttl: parseInt(process.env.REDIS_SESSION_TTL, 10) || 86400, // 24 hours
    keyPrefix: process.env.REDIS_SESSION_KEY_PREFIX || 'sess:',
    rolling: process.env.REDIS_SESSION_ROLLING === 'true' || true,
    resave: process.env.REDIS_SESSION_RESAVE === 'true' || false,
    saveUninitialized: process.env.REDIS_SESSION_SAVE_UNINITIALIZED === 'true' || false,
  },

  // Queue Configuration (Bull/BullMQ)
  queue: {
    db: parseInt(process.env.REDIS_QUEUE_DB, 10) || 3,
    keyPrefix: process.env.REDIS_QUEUE_KEY_PREFIX || 'bull:',
    
    // Default job options
    defaultJobOptions: {
      removeOnComplete: parseInt(process.env.REDIS_QUEUE_REMOVE_ON_COMPLETE, 10) || 100,
      removeOnFail: parseInt(process.env.REDIS_QUEUE_REMOVE_ON_FAIL, 10) || 50,
      attempts: parseInt(process.env.REDIS_QUEUE_ATTEMPTS, 10) || 3,
      backoff: {
        type: process.env.REDIS_QUEUE_BACKOFF_TYPE || 'exponential',
        delay: parseInt(process.env.REDIS_QUEUE_BACKOFF_DELAY, 10) || 2000,
      },
      delay: parseInt(process.env.REDIS_QUEUE_DELAY, 10) || 0,
    },
    
    // Queue settings
    settings: {
      stalledInterval: parseInt(process.env.REDIS_QUEUE_STALLED_INTERVAL, 10) || 30000,
      maxStalledCount: parseInt(process.env.REDIS_QUEUE_MAX_STALLED_COUNT, 10) || 1,
      retryProcessDelay: parseInt(process.env.REDIS_QUEUE_RETRY_PROCESS_DELAY, 10) || 5000,
    },
  },

  // Rate Limiting Configuration
  rateLimit: {
    db: parseInt(process.env.REDIS_RATE_LIMIT_DB, 10) || 4,
    keyPrefix: process.env.REDIS_RATE_LIMIT_KEY_PREFIX || 'rl:',
    
    // Default rate limit windows
    windows: {
      short: {
        duration: parseInt(process.env.REDIS_RATE_LIMIT_SHORT_DURATION, 10) || 60000, // 1 minute
        limit: parseInt(process.env.REDIS_RATE_LIMIT_SHORT_LIMIT, 10) || 100,
      },
      medium: {
        duration: parseInt(process.env.REDIS_RATE_LIMIT_MEDIUM_DURATION, 10) || 600000, // 10 minutes
        limit: parseInt(process.env.REDIS_RATE_LIMIT_MEDIUM_LIMIT, 10) || 500,
      },
      long: {
        duration: parseInt(process.env.REDIS_RATE_LIMIT_LONG_DURATION, 10) || 3600000, // 1 hour
        limit: parseInt(process.env.REDIS_RATE_LIMIT_LONG_LIMIT, 10) || 2000,
      },
    },
  },

  // Pub/Sub Configuration
  pubsub: {
    db: parseInt(process.env.REDIS_PUBSUB_DB, 10) || 5,
    keyPrefix: process.env.REDIS_PUBSUB_KEY_PREFIX || 'pubsub:',
    
    // Channel patterns
    channels: {
      tenant: 'tenant:*',
      user: 'user:*',
      notification: 'notification:*',
      audit: 'audit:*',
      system: 'system:*',
    },
  },

  // Cluster Configuration (if using Redis Cluster)
  cluster: {
    enabled: process.env.REDIS_CLUSTER_ENABLED === 'true' || false,
    nodes: process.env.REDIS_CLUSTER_NODES ? 
      process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
        const [host, port] = node.split(':');
        return { host, port: parseInt(port, 10) || 6379 };
      }) : [],
    options: {
      enableReadyCheck: process.env.REDIS_CLUSTER_READY_CHECK !== 'false',
      redisOptions: {
        password: process.env.REDIS_PASSWORD || undefined,
      },
      maxRetriesPerRequest: parseInt(process.env.REDIS_CLUSTER_MAX_RETRIES, 10) || 3,
      retryDelayOnFailover: parseInt(process.env.REDIS_CLUSTER_RETRY_DELAY, 10) || 100,
    },
  },

  // Sentinel Configuration (if using Redis Sentinel)
  sentinel: {
    enabled: process.env.REDIS_SENTINEL_ENABLED === 'true' || false,
    sentinels: process.env.REDIS_SENTINEL_HOSTS ?
      process.env.REDIS_SENTINEL_HOSTS.split(',').map(host => {
        const [hostname, port] = host.split(':');
        return { host: hostname, port: parseInt(port, 10) || 26379 };
      }) : [],
    name: process.env.REDIS_SENTINEL_MASTER_NAME || 'mymaster',
    password: process.env.REDIS_SENTINEL_PASSWORD || undefined,
    sentinelPassword: process.env.REDIS_SENTINEL_AUTH_PASSWORD || undefined,
  },

  // Monitoring and Health Checks
  monitoring: {
    enabled: process.env.REDIS_MONITORING_ENABLED === 'true' || true,
    healthCheckInterval: parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL, 10) || 30000,
    slowLogThreshold: parseInt(process.env.REDIS_SLOW_LOG_THRESHOLD, 10) || 10000, // 10ms
    memoryUsageThreshold: parseInt(process.env.REDIS_MEMORY_USAGE_THRESHOLD, 10) || 80, // 80%
    connectionPoolThreshold: parseInt(process.env.REDIS_CONNECTION_POOL_THRESHOLD, 10) || 90, // 90%
  },

  // Backup and Persistence
  persistence: {
    rdbEnabled: process.env.REDIS_RDB_ENABLED === 'true' || true,
    aofEnabled: process.env.REDIS_AOF_ENABLED === 'true' || false,
    backupSchedule: process.env.REDIS_BACKUP_SCHEDULE || '0 3 * * *', // Daily at 3 AM
    backupRetention: parseInt(process.env.REDIS_BACKUP_RETENTION_DAYS, 10) || 7,
  },
}));