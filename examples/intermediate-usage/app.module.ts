import { Module, MiddlewareConsumer } from '@nestjs/common';
import { TenancyModule } from '@angelitosystems/nestjs-multitenant-core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import tenantConfig from './config/tenant';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationModule } from './notification/notification.module';
import { AuditModule } from './audit/audit.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes
      max: 1000, // maximum number of items in cache
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Initialize multitenancy with async configuration
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
        },
        maxConnections: configService.get('MAX_TENANT_CONNECTIONS', 20),
        connectionTimeout: configService.get('TENANT_CONNECTION_TIMEOUT', 30000),
        idleTimeout: configService.get('TENANT_IDLE_TIMEOUT', 300000),
      }),
      inject: [ConfigService],
    }),

    // Application modules
    UserModule,
    ProductModule,
    OrderModule,
    AnalyticsModule,
    NotificationModule,
    AuditModule,
    HealthModule,
  ],
})
export class AppModule {
  // Additional middleware configuration can be added here if needed
}