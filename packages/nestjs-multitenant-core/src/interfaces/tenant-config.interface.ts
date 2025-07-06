export enum TenancyDriver {
  MYSQL = 'mysql',
  POSTGRESQL = 'postgresql',
  MONGODB = 'mongodb'
}

export enum TenancyStrategy {
  DATABASE_PER_TENANT = 'database_per_tenant',
  SCHEMA_PER_TENANT = 'schema_per_tenant',
  SHARED_DATABASE = 'shared_database'
}

export enum TenantIdentifierType {
  HEADER = 'header',
  SUBDOMAIN = 'subdomain',
  QUERY_PARAM = 'query_param'
}

export interface CentralDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  extra?: Record<string, any>;
}

export interface TenantIdentifierConfig {
  type: TenantIdentifierType;
  key: string; // Header name, query param name, or subdomain pattern
  pattern?: string; // For subdomain extraction
}

export interface TenantConfig {
  driver: TenancyDriver;
  strategy: TenancyStrategy;
  centralDb: CentralDatabaseConfig;
  tenantIdentifier: TenantIdentifierConfig;
  cacheConnections?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
}

export interface TenantConnectionInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface TenantContext {
  tenantId: string;
  tenantInfo: TenantConnectionInfo;
  connection?: any; // DataSource for SQL or Connection for MongoDB
}