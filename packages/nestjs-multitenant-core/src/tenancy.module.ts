import {
  Module,
  DynamicModule,
  MiddlewareConsumer,
  NestModule,
  Provider,
} from '@nestjs/common';
import { TenantConfig } from './interfaces/tenant-config.interface';
import {
  TENANT_CONFIG_TOKEN,
  CENTRAL_DATABASE_CONNECTION_TOKEN,
} from './constants/tokens';
import { TenantConnectionService } from './services/tenant-connection.service';
import { CentralDatabaseService } from './services/central-database.service';
import { TenantDetectionMiddleware } from './middleware/tenant-detection.middleware';
import { TenantConfigMissingException } from './exceptions/tenant.exceptions';

@Module({})
export class TenancyModule implements NestModule {
  static forRoot(config: TenantConfig): DynamicModule {
    if (!config) {
      throw new TenantConfigMissingException();
    }

    const providers: Provider[] = [
      {
        provide: TENANT_CONFIG_TOKEN,
        useValue: config,
      },
      CentralDatabaseService,
      {
        provide: CENTRAL_DATABASE_CONNECTION_TOKEN,
        useFactory: (centralDbService: CentralDatabaseService) => {
          return centralDbService.getConnection();
        },
        inject: [CentralDatabaseService],
      },
      TenantConnectionService,
      TenantDetectionMiddleware,
    ];

    return {
      module: TenancyModule,
      providers,
      exports: [
        TENANT_CONFIG_TOKEN,
        CENTRAL_DATABASE_CONNECTION_TOKEN,
        TenantConnectionService,
        CentralDatabaseService,
        TenantDetectionMiddleware,
      ],
      global: true,
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<TenantConfig> | TenantConfig;
    inject?: any[];
    imports?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: TENANT_CONFIG_TOKEN,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      CentralDatabaseService,
      {
        provide: CENTRAL_DATABASE_CONNECTION_TOKEN,
        useFactory: (centralDbService: CentralDatabaseService) => {
          return centralDbService.getConnection();
        },
        inject: [CentralDatabaseService],
      },
      TenantConnectionService,
      TenantDetectionMiddleware,
    ];

    return {
      module: TenancyModule,
      imports: options.imports || [],
      providers,
      exports: [
        TENANT_CONFIG_TOKEN,
        CENTRAL_DATABASE_CONNECTION_TOKEN,
        TenantConnectionService,
        CentralDatabaseService,
        TenantDetectionMiddleware,
      ],
      global: true,
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantDetectionMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}

// Re-export everything for convenience
export * from './interfaces/tenant-config.interface';
export * from './services/tenant-connection.service';
export * from './services/central-database.service';
export * from './middleware/tenant-detection.middleware';
export * from './decorators/inject-tenant-connection.decorator';
export * from './exceptions/tenant.exceptions';
export * from './constants/tokens';