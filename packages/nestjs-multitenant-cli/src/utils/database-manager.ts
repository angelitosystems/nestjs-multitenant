import { TenantInfo, TenancyDriver } from '../types/config.types';

interface DatabaseConfig {
  driver: TenancyDriver;
  centralDb: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl?: boolean;
  };
}

interface ConnectionTestResult {
  success: boolean;
  error?: string;
}

export class DatabaseManager {
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async testCentralConnection(): Promise<ConnectionTestResult> {
    try {
      const connection = await this.createCentralConnection();
      await this.closeCentralConnection(connection);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testTenantConnection(tenantInfo: Partial<TenantInfo>): Promise<ConnectionTestResult> {
    try {
      const connection = await this.createTenantConnection(tenantInfo);
      await this.closeTenantConnection(connection);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getTenant(tenantId: string): Promise<TenantInfo | null> {
    const connection = await this.createCentralConnection();
    
    try {
      const query = this.getSelectTenantQuery();
      const result = await this.executeQuery(connection, query, [tenantId]);
      
      if (result.length === 0) {
        return null;
      }
      
      return this.mapRowToTenantInfo(result[0]);
    } finally {
      await this.closeCentralConnection(connection);
    }
  }

  async getAllTenants(includeInactive: boolean = false): Promise<TenantInfo[]> {
    const connection = await this.createCentralConnection();
    
    try {
      const query = this.getSelectAllTenantsQuery(includeInactive);
      const result = await this.executeQuery(connection, query);
      
      return result.map(row => this.mapRowToTenantInfo(row));
    } finally {
      await this.closeCentralConnection(connection);
    }
  }

  async addTenant(tenantInfo: Partial<TenantInfo>): Promise<void> {
    const connection = await this.createCentralConnection();
    
    try {
      // Ensure tenants table exists
      await this.ensureTenantsTable(connection);
      
      const query = this.getInsertTenantQuery();
      const values = [
        tenantInfo.id,
        tenantInfo.name,
        tenantInfo.host,
        tenantInfo.port,
        tenantInfo.username,
        tenantInfo.password,
        tenantInfo.database,
        tenantInfo.schema || null,
        tenantInfo.isActive !== false, // Default to true
        JSON.stringify(tenantInfo.metadata || {}),
      ];
      
      await this.executeQuery(connection, query, values);
    } finally {
      await this.closeCentralConnection(connection);
    }
  }

  async getTenantCount(): Promise<number> {
    const connection = await this.createCentralConnection();
    
    try {
      const query = 'SELECT COUNT(*) as count FROM tenants';
      const result = await this.executeQuery(connection, query);
      
      return result[0]?.count || 0;
    } finally {
      await this.closeCentralConnection(connection);
    }
  }

  private async createCentralConnection(): Promise<any> {
    const { centralDb, driver } = this.config;
    
    switch (driver) {
      case TenancyDriver.MYSQL:
        return await this.createMySQLConnection(centralDb);
      case TenancyDriver.POSTGRESQL:
        return await this.createPostgreSQLConnection(centralDb);
      case TenancyDriver.MONGODB:
        return await this.createMongoDBConnection(centralDb);
      default:
        throw new Error(`Unsupported driver: ${driver}`);
    }
  }

  private async createTenantConnection(tenantInfo: Partial<TenantInfo>): Promise<any> {
    const connectionConfig = {
      host: tenantInfo.host!,
      port: tenantInfo.port!,
      username: tenantInfo.username!,
      password: tenantInfo.password!,
      database: tenantInfo.database!,
    };
    
    switch (this.config.driver) {
      case TenancyDriver.MYSQL:
        return await this.createMySQLConnection(connectionConfig);
      case TenancyDriver.POSTGRESQL:
        return await this.createPostgreSQLConnection(connectionConfig);
      case TenancyDriver.MONGODB:
        return await this.createMongoDBConnection(connectionConfig);
      default:
        throw new Error(`Unsupported driver: ${this.config.driver}`);
    }
  }

  private async createMySQLConnection(config: any): Promise<any> {
    const mysql = require('mysql2/promise');
    
    return await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      ssl: config.ssl,
    });
  }

  private async createPostgreSQLConnection(config: any): Promise<any> {
    const { Client } = require('pg');
    
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      ssl: config.ssl,
    });
    
    await client.connect();
    return client;
  }

  private async createMongoDBConnection(config: any): Promise<any> {
    const { MongoClient } = require('mongodb');
    
    const uri = `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
    const client = new MongoClient(uri);
    
    await client.connect();
    return client;
  }

  private async closeCentralConnection(connection: any): Promise<void> {
    await this.closeTenantConnection(connection);
  }

  private async closeTenantConnection(connection: any): Promise<void> {
    if (connection) {
      if (typeof connection.end === 'function') {
        await connection.end();
      } else if (typeof connection.close === 'function') {
        await connection.close();
      }
    }
  }

  private async executeQuery(connection: any, query: string, params: any[] = []): Promise<any[]> {
    switch (this.config.driver) {
      case TenancyDriver.MYSQL:
        const [rows] = await connection.execute(query, params);
        return rows;
      case TenancyDriver.POSTGRESQL:
        const result = await connection.query(query, params);
        return result.rows;
      case TenancyDriver.MONGODB:
        // For MongoDB, we would use different operations
        throw new Error('MongoDB operations not implemented in CLI');
      default:
        throw new Error(`Unsupported driver: ${this.config.driver}`);
    }
  }

  private getSelectTenantQuery(): string {
    return 'SELECT * FROM tenants WHERE id = ?';
  }

  private getSelectAllTenantsQuery(includeInactive: boolean): string {
    const baseQuery = 'SELECT * FROM tenants';
    if (includeInactive) {
      return `${baseQuery} ORDER BY "createdAt" DESC`;
    }
    return `${baseQuery} WHERE "isActive" = true ORDER BY "createdAt" DESC`;
  }

  private getInsertTenantQuery(): string {
    if (this.config.driver === TenancyDriver.MYSQL) {
      return `
        INSERT INTO tenants (
          id, name, host, port, username, password, \`database\`, \`schema\`, isActive, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
    } else {
      return `
        INSERT INTO tenants (
          id, name, host, port, username, password, "database", "schema", "isActive", metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
    }
  }

  private async ensureTenantsTable(connection: any): Promise<void> {
    const createTableQuery = this.getCreateTableQuery();
    
    try {
      await this.executeQuery(connection, createTableQuery);
    } catch (error) {
      // Table might already exist, ignore error
    }
  }

  private getCreateTableQuery(): string {
    if (this.config.driver === TenancyDriver.MYSQL) {
      return `
        CREATE TABLE IF NOT EXISTS tenants (
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
        CREATE TABLE IF NOT EXISTS tenants (
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
          metadata JSONB
        );
        
        CREATE INDEX IF NOT EXISTS IDX_TENANT_ACTIVE ON tenants ("isActive");
        CREATE INDEX IF NOT EXISTS IDX_TENANT_NAME ON tenants (name);
      `;
    }
  }

  private mapRowToTenantInfo(row: any): TenantInfo {
    return {
      id: row.id,
      name: row.name,
      host: row.host,
      port: row.port,
      username: row.username,
      password: row.password,
      database: row.database,
      schema: row.schema,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    };
  }
}