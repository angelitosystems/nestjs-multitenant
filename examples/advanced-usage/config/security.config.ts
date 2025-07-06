import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'nestjs-multitenant',
    audience: process.env.JWT_AUDIENCE || 'nestjs-multitenant-users',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    
    // Advanced JWT options
    clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE, 10) || 60, // seconds
    ignoreExpiration: process.env.JWT_IGNORE_EXPIRATION === 'true' || false,
    ignoreNotBefore: process.env.JWT_IGNORE_NOT_BEFORE === 'true' || false,
    
    // Token rotation
    enableTokenRotation: process.env.JWT_ENABLE_TOKEN_ROTATION === 'true' || true,
    rotationThreshold: parseInt(process.env.JWT_ROTATION_THRESHOLD, 10) || 300, // 5 minutes before expiry
  },

  // Password Security
  password: {
    saltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS, 10) || 12,
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8,
    maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH, 10) || 128,
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS !== 'false',
    
    // Password history
    historyCount: parseInt(process.env.PASSWORD_HISTORY_COUNT, 10) || 5,
    
    // Password expiration
    expirationDays: parseInt(process.env.PASSWORD_EXPIRATION_DAYS, 10) || 90,
    warningDays: parseInt(process.env.PASSWORD_WARNING_DAYS, 10) || 7,
    
    // Account lockout
    maxFailedAttempts: parseInt(process.env.PASSWORD_MAX_FAILED_ATTEMPTS, 10) || 5,
    lockoutDuration: parseInt(process.env.PASSWORD_LOCKOUT_DURATION, 10) || 900000, // 15 minutes
    lockoutIncrement: process.env.PASSWORD_LOCKOUT_INCREMENT === 'true' || true,
  },

  // Session Security
  session: {
    secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
    name: process.env.SESSION_NAME || 'nestjs.multitenant.sid',
    resave: process.env.SESSION_RESAVE === 'true' || false,
    saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED === 'true' || false,
    rolling: process.env.SESSION_ROLLING === 'true' || true,
    
    cookie: {
      secure: process.env.SESSION_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
      httpOnly: process.env.SESSION_COOKIE_HTTP_ONLY !== 'false',
      maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE, 10) || 86400000, // 24 hours
      sameSite: process.env.SESSION_COOKIE_SAME_SITE || 'strict',
      domain: process.env.SESSION_COOKIE_DOMAIN || undefined,
      path: process.env.SESSION_COOKIE_PATH || '/',
    },
    
    // Session store options
    store: {
      touchAfter: parseInt(process.env.SESSION_TOUCH_AFTER, 10) || 3600, // 1 hour
      ttl: parseInt(process.env.SESSION_TTL, 10) || 86400, // 24 hours
      disableTouch: process.env.SESSION_DISABLE_TOUCH === 'true' || false,
    },
  },

  // CORS Configuration
  cors: {
    enabled: process.env.CORS_ENABLED !== 'false',
    origin: process.env.CORS_ORIGIN ? 
      (process.env.CORS_ORIGIN.includes(',') ? 
        process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : 
        process.env.CORS_ORIGIN) : 
      true,
    methods: process.env.CORS_METHODS ? 
      process.env.CORS_METHODS.split(',').map(m => m.trim()) : 
      ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS ?
      process.env.CORS_ALLOWED_HEADERS.split(',').map(h => h.trim()) :
      ['Content-Type', 'Accept', 'Authorization', 'X-Tenant-ID', 'X-API-Key'],
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS ?
      process.env.CORS_EXPOSED_HEADERS.split(',').map(h => h.trim()) :
      ['X-Total-Count', 'X-Page-Count', 'X-Current-Page'],
    credentials: process.env.CORS_CREDENTIALS === 'true' || true,
    maxAge: parseInt(process.env.CORS_MAX_AGE, 10) || 86400, // 24 hours
    preflightContinue: process.env.CORS_PREFLIGHT_CONTINUE === 'true' || false,
    optionsSuccessStatus: parseInt(process.env.CORS_OPTIONS_SUCCESS_STATUS, 10) || 204,
  },

  // Rate Limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    
    // Global rate limiting
    global: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000,
      message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP',
      standardHeaders: process.env.RATE_LIMIT_STANDARD_HEADERS !== 'false',
      legacyHeaders: process.env.RATE_LIMIT_LEGACY_HEADERS === 'true' || false,
    },
    
    // Authentication rate limiting
    auth: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 5,
      message: process.env.AUTH_RATE_LIMIT_MESSAGE || 'Too many authentication attempts',
      skipSuccessfulRequests: process.env.AUTH_RATE_LIMIT_SKIP_SUCCESSFUL === 'true' || true,
      skipFailedRequests: process.env.AUTH_RATE_LIMIT_SKIP_FAILED === 'true' || false,
    },
    
    // API rate limiting
    api: {
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1 minute
      max: parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 100,
      message: process.env.API_RATE_LIMIT_MESSAGE || 'API rate limit exceeded',
    },
  },

  // Helmet Security Headers
  helmet: {
    enabled: process.env.HELMET_ENABLED !== 'false',
    
    contentSecurityPolicy: {
      enabled: process.env.CSP_ENABLED !== 'false',
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    
    hsts: {
      enabled: process.env.HSTS_ENABLED !== 'false',
      maxAge: parseInt(process.env.HSTS_MAX_AGE, 10) || 31536000, // 1 year
      includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
      preload: process.env.HSTS_PRELOAD === 'true' || false,
    },
    
    noSniff: process.env.NO_SNIFF_ENABLED !== 'false',
    frameguard: {
      enabled: process.env.FRAMEGUARD_ENABLED !== 'false',
      action: process.env.FRAMEGUARD_ACTION || 'deny',
    },
    xssFilter: process.env.XSS_FILTER_ENABLED !== 'false',
    referrerPolicy: {
      enabled: process.env.REFERRER_POLICY_ENABLED !== 'false',
      policy: process.env.REFERRER_POLICY || 'same-origin',
    },
  },

  // API Security
  api: {
    // API Key configuration
    apiKey: {
      enabled: process.env.API_KEY_ENABLED === 'true' || false,
      header: process.env.API_KEY_HEADER || 'X-API-Key',
      query: process.env.API_KEY_QUERY || 'apiKey',
      length: parseInt(process.env.API_KEY_LENGTH, 10) || 32,
      prefix: process.env.API_KEY_PREFIX || 'ak_',
    },
    
    // Request validation
    validation: {
      maxBodySize: process.env.MAX_BODY_SIZE || '10mb',
      maxParamLength: parseInt(process.env.MAX_PARAM_LENGTH, 10) || 100,
      maxQueryLength: parseInt(process.env.MAX_QUERY_LENGTH, 10) || 1000,
      maxHeaderSize: parseInt(process.env.MAX_HEADER_SIZE, 10) || 8192,
    },
    
    // Request sanitization
    sanitization: {
      enabled: process.env.SANITIZATION_ENABLED !== 'false',
      removeNullBytes: process.env.SANITIZE_REMOVE_NULL_BYTES !== 'false',
      removeControlChars: process.env.SANITIZE_REMOVE_CONTROL_CHARS !== 'false',
      normalizeUnicode: process.env.SANITIZE_NORMALIZE_UNICODE !== 'false',
    },
  },

  // Encryption
  encryption: {
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here',
    ivLength: parseInt(process.env.ENCRYPTION_IV_LENGTH, 10) || 16,
    tagLength: parseInt(process.env.ENCRYPTION_TAG_LENGTH, 10) || 16,
    
    // Field-level encryption
    fields: {
      enabled: process.env.FIELD_ENCRYPTION_ENABLED === 'true' || false,
      sensitiveFields: process.env.SENSITIVE_FIELDS ?
        process.env.SENSITIVE_FIELDS.split(',').map(f => f.trim()) :
        ['ssn', 'creditCard', 'bankAccount', 'passport'],
    },
  },

  // Audit and Compliance
  audit: {
    enabled: process.env.AUDIT_ENABLED !== 'false',
    logLevel: process.env.AUDIT_LOG_LEVEL || 'info',
    
    // Events to audit
    events: {
      authentication: process.env.AUDIT_AUTH_EVENTS !== 'false',
      authorization: process.env.AUDIT_AUTHZ_EVENTS !== 'false',
      dataAccess: process.env.AUDIT_DATA_ACCESS_EVENTS !== 'false',
      dataModification: process.env.AUDIT_DATA_MODIFICATION_EVENTS !== 'false',
      adminActions: process.env.AUDIT_ADMIN_ACTIONS !== 'false',
      systemEvents: process.env.AUDIT_SYSTEM_EVENTS !== 'false',
    },
    
    // Retention
    retention: {
      days: parseInt(process.env.AUDIT_RETENTION_DAYS, 10) || 2555, // 7 years
      archiveAfterDays: parseInt(process.env.AUDIT_ARCHIVE_AFTER_DAYS, 10) || 365, // 1 year
      compressionEnabled: process.env.AUDIT_COMPRESSION_ENABLED !== 'false',
    },
  },

  // Compliance Standards
  compliance: {
    gdpr: {
      enabled: process.env.GDPR_ENABLED === 'true' || false,
      dataRetentionDays: parseInt(process.env.GDPR_DATA_RETENTION_DAYS, 10) || 2555, // 7 years
      rightToBeForgotten: process.env.GDPR_RIGHT_TO_BE_FORGOTTEN !== 'false',
      dataPortability: process.env.GDPR_DATA_PORTABILITY !== 'false',
      consentTracking: process.env.GDPR_CONSENT_TRACKING !== 'false',
    },
    
    hipaa: {
      enabled: process.env.HIPAA_ENABLED === 'true' || false,
      encryptionRequired: process.env.HIPAA_ENCRYPTION_REQUIRED !== 'false',
      auditTrailRequired: process.env.HIPAA_AUDIT_TRAIL_REQUIRED !== 'false',
      accessControlRequired: process.env.HIPAA_ACCESS_CONTROL_REQUIRED !== 'false',
    },
    
    soc2: {
      enabled: process.env.SOC2_ENABLED === 'true' || false,
      securityMonitoring: process.env.SOC2_SECURITY_MONITORING !== 'false',
      availabilityMonitoring: process.env.SOC2_AVAILABILITY_MONITORING !== 'false',
      processingIntegrity: process.env.SOC2_PROCESSING_INTEGRITY !== 'false',
      confidentiality: process.env.SOC2_CONFIDENTIALITY !== 'false',
      privacy: process.env.SOC2_PRIVACY !== 'false',
    },
  },
}));