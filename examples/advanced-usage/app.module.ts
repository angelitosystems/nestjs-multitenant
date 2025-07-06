import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TenancyModule } from '@angelitosystems/nestjs-multitenant-core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { HealthModule } from '@nestjs/terminus';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Configuration
import tenantConfig from './config/tenant';
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';
import { SecurityConfig } from './config/security.config';

// Core Modules
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TenantModule } from './tenant/tenant.module';
import { OrganizationModule } from './organization/organization.module';
import { ProjectModule } from './project/project.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ReportingModule } from './reporting/reporting.module';
import { IntegrationModule } from './integration/integration.module';
import { WebhookModule } from './webhook/webhook.module';
import { AuditModule } from './audit/audit.module';
import { NotificationModule } from './notification/notification.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { SearchModule } from './search/search.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BillingModule } from './billing/billing.module';
import { ComplianceModule } from './compliance/compliance.module';

// Middleware & Guards
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { TenantValidationMiddleware } from './common/middleware/tenant-validation.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { TenantAccessGuard } from './common/guards/tenant-access.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Interceptors & Filters
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TenantExceptionFilter } from './common/filters/tenant-exception.filter';

// Health Checks
import { CustomHealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [DatabaseConfig, RedisConfig, SecurityConfig],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Event System
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Task Scheduling
    ScheduleModule.forRoot(),

    // Queue Management
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Caching with Redis
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: 'redis',
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_CACHE_DB', 1),
        ttl: configService.get('CACHE_TTL', 300),
        max: configService.get('CACHE_MAX_ITEMS', 1000),
        isGlobal: true,
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 60000, // 1 minute
          limit: configService.get('RATE_LIMIT_SHORT', 100),
        },
        {
          name: 'medium',
          ttl: 600000, // 10 minutes
          limit: configService.get('RATE_LIMIT_MEDIUM', 500),
        },
        {
          name: 'long',
          ttl: 3600000, // 1 hour
          limit: configService.get('RATE_LIMIT_LONG', 2000),
        },
      ],
      inject: [ConfigService],
    }),

    // Metrics and Monitoring
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'nestjs_multitenant_',
        },
      },
    }),

    // Health Checks
    HealthModule,
    CustomHealthModule,

    // Authentication & Authorization
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),

    // Multitenancy with Advanced Configuration
    TenancyModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ...tenantConfig,
        centralDb: {
          ...tenantConfig.centralDb,
          host: configService.get('CENTRAL_DB_HOST', tenantConfig.centralDb.host),
          port: configService.get('CENTRAL_DB_PORT', tenantConfig.centralDb.port),
          username: configService.get('CENTRAL_DB_USERNAME', tenantConfig.centralDb.username),
          password: configService.get('CENTRAL_DB_PASSWORD', tenantConfig.centralDb.password),
          database: configService.get('CENTRAL_DB_DATABASE', tenantConfig.centralDb.database),
          ssl: configService.get('CENTRAL_DB_SSL', false),
        },
        maxConnections: configService.get('MAX_TENANT_CONNECTIONS', 50),
        connectionTimeout: configService.get('TENANT_CONNECTION_TIMEOUT', 30000),
        idleTimeout: configService.get('TENANT_IDLE_TIMEOUT', 300000),
        enableMetrics: true,
        enableCircuitBreaker: true,
        circuitBreakerOptions: {
          threshold: 5,
          timeout: 60000,
          errorThresholdPercentage: 50,
          resetTimeout: 30000,
        },
      }),
      inject: [ConfigService],
    }),

    // Core Business Modules
    AuthModule,
    UserModule,
    TenantModule,
    OrganizationModule,
    ProjectModule,
    WorkflowModule,
    ReportingModule,
    IntegrationModule,
    WebhookModule,
    AuditModule,
    NotificationModule,
    FileStorageModule,
    SearchModule,
    AnalyticsModule,
    BillingModule,
    ComplianceModule,
  ],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantAccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },

    // Global Exception Filters
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: TenantExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        SecurityHeadersMiddleware,
        LoggingMiddleware,
        TenantValidationMiddleware,
      )
      .forRoutes('*');
  }
}