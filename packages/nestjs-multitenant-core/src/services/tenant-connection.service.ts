import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Connection as MongoConnection } from 'mongoose';
import {
  TenantConfig,
  TenantConnectionInfo,
  TenancyDriver,
  TenantContext,
} from '../interfaces/tenant-config.interface';
import {
  TENANT_CONFIG_TOKEN,
  CENTRAL_DATABASE_CONNECTION_TOKEN,
  DEFAULT_CONNECTION_POOL_SIZE,
  DEFAULT_CONNECTION_TIMEOUT,
  DEFAULT_IDLE_TIMEOUT,
} from '../constants/tokens';
import {
  TenantNotFoundException,
  TenantInactiveException,
  TenantConnectionException,
} from '../exceptions/tenant.exceptions';

@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionService.name);
  private readonly connectionCache = new Map<string, any>();
  private readonly connectionTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    @Inject(TENANT_CONFIG_TOKEN)
    private readonly tenantConfig: TenantConfig,
    @Inject(CENTRAL_DATABASE_CONNECTION_TOKEN)
    private readonly centralConnection: DataSource,
  ) {}

  async getTenantConnection(tenantId: string): Promise<any> {
    // Check cache first
    if (this.tenantConfig.cacheConnections && this.connectionCache.has(tenantId)) {
      this.logger.debug(`Using cached connection for tenant: ${tenantId}`);
      this.resetConnectionTimer(tenantId);
      return this.connectionCache.get(tenantId);
    }

    // Get tenant info from central database
    const tenantInfo = await this.getTenantInfo(tenantId);
    if (!tenantInfo) {
      throw new TenantNotFoundException(tenantId);
    }

    if (!tenantInfo.isActive) {
      throw new TenantInactiveException(tenantId);
    }

    // Create new connection
    const connection = await this.createTenantConnection(tenantInfo);

    // Cache connection if enabled
    if (this.tenantConfig.cacheConnections) {
      this.connectionCache.set(tenantId, connection);
      this.setConnectionTimer(tenantId);
      this.logger.debug(`Cached connection for tenant: ${tenantId}`);
    }

    return connection;
  }

  async getTenantContext(tenantId: string): Promise<TenantContext> {
    const tenantInfo = await this.getTenantInfo(tenantId);
    if (!tenantInfo) {
      throw new TenantNotFoundException(tenantId);
    }

    const connection = await this.getTenantConnection(tenantId);

    return {
      tenantId,
      tenantInfo,
      connection,
    };
  }

  private async getTenantInfo(tenantId: string): Promise<TenantConnectionInfo | null> {
    try {
      const repository = this.centralConnection.getRepository('tenants');
      const tenant = await repository.findOne({
        where: { id: tenantId },
      });

      return tenant as TenantConnectionInfo | null;
    } catch (error) {
      this.logger.error(`Failed to get tenant info for ${tenantId}:`, error);
      return null;
    }
  }

  private async createTenantConnection(tenantInfo: TenantConnectionInfo): Promise<any> {
    try {
      switch (this.tenantConfig.driver) {
        case TenancyDriver.MYSQL:
        case TenancyDriver.POSTGRESQL:
          return await this.createSqlConnection(tenantInfo);
        case TenancyDriver.MONGODB:
          return await this.createMongoConnection(tenantInfo);
        default:
          throw new Error(`Unsupported driver: ${this.tenantConfig.driver}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create connection for tenant ${tenantInfo.id}:`, error);
      throw new TenantConnectionException(tenantInfo.id, error as Error);
    }
  }

  private async createSqlConnection(tenantInfo: TenantConnectionInfo): Promise<DataSource> {
    const dataSource = new DataSource({
      type: this.tenantConfig.driver as 'mysql' | 'postgres',
      host: tenantInfo.host,
      port: tenantInfo.port,
      username: tenantInfo.username,
      password: tenantInfo.password,
      database: tenantInfo.database,
      schema: tenantInfo.schema,
      synchronize: false,
      logging: false,
      entities: [],
      poolSize: this.tenantConfig.maxConnections || DEFAULT_CONNECTION_POOL_SIZE,
      connectTimeoutMS: this.tenantConfig.connectionTimeout || DEFAULT_CONNECTION_TIMEOUT,
      extra: {
        idleTimeoutMillis: this.tenantConfig.idleTimeout || DEFAULT_IDLE_TIMEOUT,
        ...tenantInfo.metadata?.connectionOptions,
      },
    });

    await dataSource.initialize();
    this.logger.log(`SQL connection established for tenant: ${tenantInfo.id}`);
    return dataSource;
  }

  private async createMongoConnection(tenantInfo: TenantConnectionInfo): Promise<MongoConnection> {
    const mongoose = require('mongoose');
    const connectionString = `mongodb://${tenantInfo.username}:${tenantInfo.password}@${tenantInfo.host}:${tenantInfo.port}/${tenantInfo.database}`;
    
    const connection = await mongoose.createConnection(connectionString, {
      maxPoolSize: this.tenantConfig.maxConnections || DEFAULT_CONNECTION_POOL_SIZE,
      serverSelectionTimeoutMS: this.tenantConfig.connectionTimeout || DEFAULT_CONNECTION_TIMEOUT,
      socketTimeoutMS: this.tenantConfig.idleTimeout || DEFAULT_IDLE_TIMEOUT,
      ...tenantInfo.metadata?.connectionOptions,
    });

    this.logger.log(`MongoDB connection established for tenant: ${tenantInfo.id}`);
    return connection;
  }

  private setConnectionTimer(tenantId: string): void {
    const timeout = this.tenantConfig.idleTimeout || DEFAULT_IDLE_TIMEOUT;
    
    const timer = setTimeout(async () => {
      await this.closeConnection(tenantId);
    }, timeout);

    this.connectionTimers.set(tenantId, timer);
  }

  private resetConnectionTimer(tenantId: string): void {
    const existingTimer = this.connectionTimers.get(tenantId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    this.setConnectionTimer(tenantId);
  }

  private async closeConnection(tenantId: string): Promise<void> {
    const connection = this.connectionCache.get(tenantId);
    if (connection) {
      try {
        if (connection instanceof DataSource) {
          await connection.destroy();
        } else if (connection.close) {
          await connection.close();
        }
        
        this.connectionCache.delete(tenantId);
        this.connectionTimers.delete(tenantId);
        this.logger.debug(`Connection closed for tenant: ${tenantId}`);
      } catch (error) {
        this.logger.error(`Failed to close connection for tenant ${tenantId}:`, error);
      }
    }
  }

  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connectionCache.keys()).map(tenantId =>
      this.closeConnection(tenantId)
    );
    
    await Promise.all(closePromises);
    this.logger.log('All tenant connections closed');
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeAllConnections();
  }

  getConnectionStats(): { totalConnections: number; activeTenants: string[] } {
    return {
      totalConnections: this.connectionCache.size,
      activeTenants: Array.from(this.connectionCache.keys()),
    };
  }
}