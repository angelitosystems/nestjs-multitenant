import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  TenantConfig,
  TenancyDriver,
  CentralDatabaseConfig,
} from '../interfaces/tenant-config.interface';
import {
  TENANT_CONFIG_TOKEN,
  DEFAULT_CONNECTION_POOL_SIZE,
  DEFAULT_CONNECTION_TIMEOUT,
} from '../constants/tokens';
import { CentralDatabaseConnectionException } from '../exceptions/tenant.exceptions';

@Injectable()
export class CentralDatabaseService implements OnModuleInit {
  private readonly logger = new Logger(CentralDatabaseService.name);
  private dataSource: DataSource | null = null;

  constructor(
    @Inject(TENANT_CONFIG_TOKEN)
    private readonly tenantConfig: TenantConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.createCentralConnection();
    await this.ensureTenantsTable();
  }

  private async createCentralConnection(): Promise<void> {
    try {
      const config = this.tenantConfig.centralDb;
      
      this.dataSource = new DataSource({
        type: this.getDatabaseType(),
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database: config.database,
        synchronize: false,
        logging: false,
        entities: [this.getTenantEntity()],
        poolSize: DEFAULT_CONNECTION_POOL_SIZE,
        connectTimeoutMS: DEFAULT_CONNECTION_TIMEOUT,
        ssl: config.ssl,
        extra: config.extra,
      });

      await this.dataSource.initialize();
      this.logger.log('Central database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to central database:', error);
      throw new CentralDatabaseConnectionException(error as Error);
    }
  }

  private getDatabaseType(): 'mysql' | 'postgres' {
    switch (this.tenantConfig.driver) {
      case TenancyDriver.MYSQL:
        return 'mysql';
      case TenancyDriver.POSTGRESQL:
        return 'postgres';
      default:
        throw new Error(`Unsupported driver for central database: ${this.tenantConfig.driver}`);
    }
  }

  private getTenantEntity() {
    // Define the tenant entity schema
    return {
      name: 'tenants',
      columns: {
        id: {
          type: 'varchar',
          length: 100,
          primary: true,
        },
        name: {
          type: 'varchar',
          length: 255,
          nullable: false,
        },
        host: {
          type: 'varchar',
          length: 255,
          nullable: false,
        },
        port: {
          type: 'int',
          nullable: false,
        },
        username: {
          type: 'varchar',
          length: 100,
          nullable: false,
        },
        password: {
          type: 'varchar',
          length: 255,
          nullable: false,
        },
        database: {
          type: 'varchar',
          length: 100,
          nullable: false,
        },
        schema: {
          type: 'varchar',
          length: 100,
          nullable: true,
        },
        isActive: {
          type: 'boolean',
          default: true,
        },
        createdAt: {
          type: 'timestamp',
          default: () => 'CURRENT_TIMESTAMP',
        },
        updatedAt: {
          type: 'timestamp',
          default: () => 'CURRENT_TIMESTAMP',
          onUpdate: 'CURRENT_TIMESTAMP',
        },
        metadata: {
          type: 'json',
          nullable: true,
        },
      },
      indices: [
        {
          name: 'IDX_TENANT_ACTIVE',
          columns: ['isActive'],
        },
        {
          name: 'IDX_TENANT_NAME',
          columns: ['name'],
        },
      ],
    };
  }

  private async ensureTenantsTable(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('Central database connection not established');
    }

    try {
      const queryRunner = this.dataSource.createQueryRunner();
      
      // Check if tenants table exists
      const tableExists = await queryRunner.hasTable('tenants');
      
      if (!tableExists) {
        this.logger.log('Creating tenants table...');
        
        const createTableQuery = this.getCreateTableQuery();
        await queryRunner.query(createTableQuery);
        
        this.logger.log('Tenants table created successfully');
      } else {
        this.logger.debug('Tenants table already exists');
      }
      
      await queryRunner.release();
    } catch (error) {
      this.logger.error('Failed to ensure tenants table:', error);
      throw error;
    }
  }

  private getCreateTableQuery(): string {
    const dbType = this.getDatabaseType();
    
    if (dbType === 'mysql') {
      return `
        CREATE TABLE tenants (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          host VARCHAR(255) NOT NULL,
          port INT NOT NULL,
          username VARCHAR(100) NOT NULL,
          password VARCHAR(255) NOT NULL,
          \`database\` VARCHAR(100) NOT NULL,
          \`schema\` VARCHAR(100) NULL,
          isActive BOOLEAN DEFAULT TRUE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          metadata JSON NULL,
          INDEX IDX_TENANT_ACTIVE (isActive),
          INDEX IDX_TENANT_NAME (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    } else {
      return `
        CREATE TABLE tenants (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          host VARCHAR(255) NOT NULL,
          port INTEGER NOT NULL,
          username VARCHAR(100) NOT NULL,
          password VARCHAR(255) NOT NULL,
          "database" VARCHAR(100) NOT NULL,
          "schema" VARCHAR(100),
          "isActive" BOOLEAN DEFAULT TRUE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB,
          CONSTRAINT idx_tenant_active CHECK ("isActive" IN (TRUE, FALSE))
        );
        
        CREATE INDEX IDX_TENANT_ACTIVE ON tenants ("isActive");
        CREATE INDEX IDX_TENANT_NAME ON tenants (name);
        
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW."updatedAt" = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_tenants_updated_at
          BEFORE UPDATE ON tenants
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `;
    }
  }

  getConnection(): DataSource {
    if (!this.dataSource) {
      throw new Error('Central database connection not established');
    }
    return this.dataSource;
  }

  async closeConnection(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.logger.log('Central database connection closed');
    }
  }
}