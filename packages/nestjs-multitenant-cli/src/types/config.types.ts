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

export interface TenantConfigTemplate {
  driver: TenancyDriver;
  strategy: TenancyStrategy;
  centralDb: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl?: boolean;
  };
  tenantIdentifier: {
    type: TenantIdentifierType;
    key: string;
    pattern?: string;
  };
  cacheConnections?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
}

export interface TenantInfo {
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

export interface ProjectStructure {
  isNestJS: boolean;
  hasPackageJson: boolean;
  hasNestCLI: boolean;
  hasAppModule: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  nestVersion?: string | undefined;
}