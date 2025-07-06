import * as fs from 'fs-extra';
import * as path from 'path';
import { TenancyDriver, TenancyStrategy, TenantIdentifierType } from '../types/config.types';

export interface ConfigGeneratorOptions {
  driver: TenancyDriver;
  strategy: TenancyStrategy;
  centralHost: string;
  centralPort: number;
  centralUsername: string;
  centralPassword: string;
  centralDatabase: string;
  identifierType: TenantIdentifierType;
  identifierKey: string;
  identifierPattern?: string;
}

export class ConfigGenerator {
  private readonly projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async generateConfig(options: ConfigGeneratorOptions): Promise<void> {
    // Ensure config directory exists
    const configDir = path.join(this.projectRoot, 'config');
    await fs.ensureDir(configDir);

    // Generate tenant configuration
    const configContent = this.generateTenantConfig(options);
    const configPath = path.join(configDir, 'tenant.ts');
    
    await fs.writeFile(configPath, configContent, 'utf-8');

    // Generate example environment file
    await this.generateEnvExample(options);

    // Generate README for configuration
    await this.generateConfigReadme(options);
  }

  private generateTenantConfig(options: ConfigGeneratorOptions): string {
    const {
      driver,
      strategy,
      centralHost,
      centralPort,
      centralUsername,
      centralPassword,
      centralDatabase,
      identifierType,
      identifierKey,
      identifierPattern,
    } = options;

    const sslConfig = driver === TenancyDriver.POSTGRESQL ? '\n    ssl: process.env.DB_SSL === \'true\' || false,' : '';
    const patternConfig = identifierType === TenantIdentifierType.SUBDOMAIN && identifierPattern
      ? `\n    pattern: '${identifierPattern}',`
      : '';

    return `import { TenancyStrategy, TenancyDriver, TenantIdentifierType } from '@angelitosystems/nestjs-multitenant-core';

/**
 * Tenant configuration for multitenancy
 * 
 * This configuration defines how the multitenancy system should work:
 * - driver: The database driver to use (${driver})
 * - strategy: How tenants are isolated (${strategy})
 * - centralDb: Connection to the central database that stores tenant information
 * - tenantIdentifier: How to identify which tenant a request belongs to
 */
export default {
  // Database driver for tenant connections
  driver: TenancyDriver.${driver.toUpperCase()},
  
  // Tenancy strategy - how tenants are isolated
  strategy: TenancyStrategy.${strategy.toUpperCase()},
  
  // Central database configuration
  // This database stores information about all tenants
  centralDb: {
    host: process.env.CENTRAL_DB_HOST || '${centralHost}',
    port: parseInt(process.env.CENTRAL_DB_PORT || '${centralPort}'),
    username: process.env.CENTRAL_DB_USERNAME || '${centralUsername}',
    password: process.env.CENTRAL_DB_PASSWORD || '${centralPassword}',
    database: process.env.CENTRAL_DB_DATABASE || '${centralDatabase}',${sslConfig}
  },
  
  // How to identify tenants in incoming requests
  tenantIdentifier: {
    type: TenantIdentifierType.${identifierType.toUpperCase()},
    key: '${identifierKey}',${patternConfig}
  },
  
  // Connection pooling and caching options
  cacheConnections: true,
  maxConnections: parseInt(process.env.MAX_TENANT_CONNECTIONS || '10'),
  connectionTimeout: parseInt(process.env.TENANT_CONNECTION_TIMEOUT || '30000'),
  idleTimeout: parseInt(process.env.TENANT_IDLE_TIMEOUT || '300000'),
};
`;
  }

  private async generateEnvExample(options: ConfigGeneratorOptions): Promise<void> {
    const envPath = path.join(this.projectRoot, '.env.example');
    const existingEnv = await fs.pathExists(envPath) ? await fs.readFile(envPath, 'utf-8') : '';
    
    const tenantEnvVars = `
# Multitenancy Configuration
# Central database (stores tenant information)
CENTRAL_DB_HOST=${options.centralHost}
CENTRAL_DB_PORT=${options.centralPort}
CENTRAL_DB_USERNAME=${options.centralUsername}
CENTRAL_DB_PASSWORD=${options.centralPassword}
CENTRAL_DB_DATABASE=${options.centralDatabase}
${options.driver === TenancyDriver.POSTGRESQL ? 'CENTRAL_DB_SSL=false' : ''}

# Tenant connection settings
MAX_TENANT_CONNECTIONS=10
TENANT_CONNECTION_TIMEOUT=30000
TENANT_IDLE_TIMEOUT=300000
`;

    // Check if tenant config already exists in .env.example
    if (!existingEnv.includes('CENTRAL_DB_HOST')) {
      const newContent = existingEnv + tenantEnvVars;
      await fs.writeFile(envPath, newContent, 'utf-8');
    }
  }

  private async generateConfigReadme(options: ConfigGeneratorOptions): Promise<void> {
    const readmePath = path.join(this.projectRoot, 'config', 'README.md');
    
    const readmeContent = `# Multitenancy Configuration

This directory contains the configuration for the NestJS multitenancy system.

## Files

- \`tenant.ts\` - Main tenant configuration

## Configuration Overview

### Database Driver
**${options.driver}** - The database system used for tenant connections.

### Tenancy Strategy
**${options.strategy}** - How tenants are isolated:

${this.getStrategyDescription(options.strategy)}

### Tenant Identification
**${options.identifierType}** - How tenants are identified in requests:

${this.getIdentifierDescription(options.identifierType, options.identifierKey)}

## Central Database

The central database stores information about all tenants. Each tenant record contains:

- \`id\` - Unique tenant identifier
- \`name\` - Human-readable tenant name
- \`host\` - Database host for this tenant
- \`port\` - Database port
- \`username\` - Database username
- \`password\` - Database password (encrypted)
- \`database\` - Database name
- \`schema\` - Database schema (for PostgreSQL)
- \`isActive\` - Whether the tenant is active
- \`metadata\` - Additional tenant-specific configuration

## Environment Variables

Copy \`.env.example\` to \`.env\` and configure the following variables:

\`\`\`env
CENTRAL_DB_HOST=localhost
CENTRAL_DB_PORT=${options.centralPort}
CENTRAL_DB_USERNAME=${options.centralUsername}
CENTRAL_DB_PASSWORD=your_password
CENTRAL_DB_DATABASE=${options.centralDatabase}
\`\`\`

## Usage

### 1. Import the module in your AppModule

\`\`\`typescript
import { TenancyModule } from '@angelitosystems/nestjs-multitenant-core';
import tenantConfig from './config/tenant';

@Module({
  imports: [TenancyModule.forRoot(tenantConfig)],
})
export class AppModule {}
\`\`\`

### 2. Use decorators in your controllers

\`\`\`typescript
import { InjectTenantConnection } from '@angelitosystems/nestjs-multitenant-core';
import { DataSource } from 'typeorm';

@Controller('users')
export class UserController {
  constructor(
    @InjectTenantConnection() private connection: DataSource
  ) {}

  @Get()
  async findAll() {
    return this.connection.getRepository(User).find();
  }
}
\`\`\`

### 3. Add tenants

Use the CLI to add tenants to your central database:

\`\`\`bash
nestjs-multitenant-init add-tenant
\`\`\`

## Security Notes

- Store sensitive configuration in environment variables
- Use encrypted connections when possible
- Regularly rotate database passwords
- Monitor tenant access patterns
`;

    await fs.writeFile(readmePath, readmeContent, 'utf-8');
  }

  private getStrategyDescription(strategy: TenancyStrategy): string {
    switch (strategy) {
      case TenancyStrategy.DATABASE_PER_TENANT:
        return '- Each tenant has its own separate database\n- Complete data isolation\n- Easy to backup and restore individual tenants\n- Recommended for most use cases';
      case TenancyStrategy.SCHEMA_PER_TENANT:
        return '- Each tenant has its own schema within the same database\n- Good balance between isolation and resource usage\n- PostgreSQL only\n- Suitable for medium-scale applications';
      case TenancyStrategy.SHARED_DATABASE:
        return '- All tenants share the same database with tenant ID columns\n- Most resource-efficient\n- Requires careful query filtering\n- Suitable for simple applications with many small tenants';
      default:
        return 'Unknown strategy';
    }
  }

  private getIdentifierDescription(type: TenantIdentifierType, key: string): string {
    switch (type) {
      case TenantIdentifierType.HEADER:
        return `- Tenants are identified by the \`${key}\` HTTP header\n- Easy to implement in API clients\n- Works well with API gateways\n- Example: \`${key}: tenant123\``;
      case TenantIdentifierType.SUBDOMAIN:
        return `- Tenants are identified by subdomain\n- Pattern: \`${key}\`\n- User-friendly URLs\n- Example: \`tenant123.yourdomain.com\``;
      case TenantIdentifierType.QUERY_PARAM:
        return `- Tenants are identified by the \`${key}\` query parameter\n- Simple to implement\n- Visible in URLs\n- Example: \`/api/users?${key}=tenant123\``;
      default:
        return 'Unknown identifier type';
    }
  }
}