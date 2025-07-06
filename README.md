# NestJS Multitenant / NestJS Multiinquilino

[English](#english) | [Español](#español)

---

## English

🏢 **A comprehensive multitenancy solution for NestJS applications with dynamic database connections and automatic tenant detection.**

### Features

✅ **Multiple Database Support**: MySQL, PostgreSQL, MongoDB  
✅ **Dynamic Connections**: Automatic tenant database connection management  
✅ **Flexible Tenant Identification**: Headers, subdomains, or query parameters  
✅ **Zero Configuration**: No need to manually define each tenant in code  
✅ **Security First**: Tenant data stored securely in central database  
✅ **Connection Pooling**: Efficient connection management with caching  
✅ **CLI Tools**: Easy setup and tenant management  
✅ **TypeScript**: Full TypeScript support with decorators  
✅ **Enterprise Ready**: Advanced features for enterprise applications
✅ **Scalable**: Designed to handle thousands of tenants  

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Client App    │    │   Client App    │
│   (Tenant A)    │    │   (Tenant B)    │    │   (Tenant C)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     NestJS Application    │
                    │   (Multitenant Module)    │
                    └─────────────┬─────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼─────────┐ ┌───────▼───────┐ ┌─────────▼─────────┐
    │   Database A      │ │   Database B  │ │   Database C      │
    │   (Tenant A)      │ │   (Tenant B)  │ │   (Tenant C)      │
    └───────────────────┘ └───────────────┘ └───────────────────┘
```

This package consists of two main components:

- **`@angelitosystems/nestjs-multitenant-core`**: The core library that handles multitenancy logic
- **`@angelitosystems/nestjs-multitenant-cli`**: CLI tool for project initialization and tenant management

## Quick Start

### Option 1: Create a new project with template

```bash
# Install the CLI tool globally
npm install -g @angelitosystems/nestjs-multitenant-cli

# Create a new project with basic template
angelito-multitenant create my-app --template basic

# Or create with advanced enterprise features
angelito-multitenant create my-enterprise-app --template advanced

# Navigate to your project
cd my-app

# Start development
npm run start:dev
```

### Option 2: Add to existing NestJS project

```bash
# Install the CLI tool globally
npm install -g @angelitosystems/nestjs-multitenant-cli

# Navigate to your existing NestJS project
cd my-existing-nestjs-app

# Initialize multitenancy (CLI will detect existing project)
angelito-multitenant init
```

### Manual Installation

```bash
# Install the core package
npm install @angelitosystems/nestjs-multitenant-core
```

### 1. Initialize Your Project

```bash
# Or use npx
npx angelito-multitenant --help
```

The CLI will:
- Detect your NestJS project
- Ask about your database preferences
- Generate the configuration file
- Install required dependencies

### 3. Configure Your App Module

```typescript
import { Module } from '@nestjs/common';
import { TenancyModule } from '@angelitosystems/nestjs-multitenant-core';
import tenantConfig from './config/tenant';

@Module({
  imports: [
    TenancyModule.forRoot(tenantConfig),
    // ... your other modules
  ],
})
export class AppModule {}
```

### 4. Use in Your Controllers

```typescript
import { Controller, Get } from '@nestjs/common';
import { InjectTenantConnection } from '@angelitosystems/nestjs-multitenant-core';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';

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
```

### 5. Add Tenants

```bash
# Add a new tenant interactively
angelito-multitenant add-tenant

# List all tenants
angelito-multitenant list-tenants
```

### 6. Test Your Application

```bash
# Make requests with tenant header
curl -H "X-Tenant-ID: tenant1" http://localhost:3000/api/users
```

## Configuration

The CLI generates a `config/tenant.ts` file:

```typescript
import { TenancyStrategy, TenancyDriver, TenantIdentifierType } from '@angelitosystems/nestjs-multitenant-core';

export default {
  // Database driver
  driver: TenancyDriver.POSTGRESQL,
  
  // Tenancy strategy
  strategy: TenancyStrategy.DATABASE_PER_TENANT,
  
  // Central database (stores tenant info)
  centralDb: {
    host: process.env.CENTRAL_DB_HOST || 'localhost',
    port: parseInt(process.env.CENTRAL_DB_PORT || '5432'),
    username: process.env.CENTRAL_DB_USERNAME || 'postgres',
    password: process.env.CENTRAL_DB_PASSWORD || '',
    database: process.env.CENTRAL_DB_DATABASE || 'central_tenants',
  },
  
  // How to identify tenants
  tenantIdentifier: {
    type: TenantIdentifierType.HEADER,
    key: 'X-Tenant-ID',
  },
  
  // Connection options
  cacheConnections: true,
  maxConnections: 10,
  connectionTimeout: 30000,
  idleTimeout: 300000,
};
```

## Tenancy Strategies

### Database Per Tenant (Recommended)
- Each tenant has its own database
- Complete data isolation
- Easy backup and restore
- Scales well

### Schema Per Tenant (PostgreSQL only)
- Each tenant has its own schema
- Good balance of isolation and resources
- Suitable for medium-scale applications

### Shared Database
- All tenants share the same database
- Most resource-efficient
- Requires careful query filtering

## Tenant Identification

### HTTP Header (Recommended)
```typescript
tenantIdentifier: {
  type: TenantIdentifierType.HEADER,
  key: 'X-Tenant-ID',
}
```

### Subdomain
```typescript
tenantIdentifier: {
  type: TenantIdentifierType.SUBDOMAIN,
  key: '^([a-zA-Z0-9-]+)\\.',
}
```

### Query Parameter
```typescript
tenantIdentifier: {
  type: TenantIdentifierType.QUERY_PARAM,
  key: 'tenant',
}
```

## Available Decorators

```typescript
// Inject tenant database connection
@InjectTenantConnection() connection: DataSource

// Inject full tenant context
@InjectTenantContext() context: TenantContext

// Inject only tenant ID
@InjectTenantId() tenantId: string

// Inject tenant information
@InjectTenantInfo() tenantInfo: TenantConnectionInfo

// Inject tenant connection service
@InjectTenantConnectionService() service: TenantConnectionService
```

## 🛠️ CLI Commands

### Project Creation
```bash
# Create a new project with template selection
angelito-multitenant create [project-name]

# Create with specific template
angelito-multitenant create my-app --template basic
angelito-multitenant create my-app --template intermediate  
angelito-multitenant create my-app --template advanced

# Non-interactive mode
angelito-multitenant create my-app --template basic --no-interactive
```

### Project Configuration
```bash
# Initialize multitenancy in existing project
angelito-multitenant init

# Force overwrite existing configuration
angelito-multitenant init --force

# Non-interactive mode with defaults
angelito-multitenant init --no-interactive
```

### Tenant Management
```bash
# Add a new tenant
angelito-multitenant add-tenant

# Add tenant with specific details
angelito-multitenant add-tenant --id tenant1 --name "Tenant One"

# List all tenants
angelito-multitenant list-tenants

# List all tenants including inactive ones
angelito-multitenant list-tenants --all

# Output in JSON format
angelito-multitenant list-tenants --json
```

### Validation and Help
```bash
# Validate your configuration
angelito-multitenant validate

# Get help
angelito-multitenant help

# Get help for specific command
angelito-multitenant create --help
```

## Environment Variables

```env
# Central database configuration
CENTRAL_DB_HOST=localhost
CENTRAL_DB_PORT=5432
CENTRAL_DB_USERNAME=postgres
CENTRAL_DB_PASSWORD=your_password
CENTRAL_DB_DATABASE=central_tenants
CENTRAL_DB_SSL=false

# Connection settings
MAX_TENANT_CONNECTIONS=10
TENANT_CONNECTION_TIMEOUT=30000
TENANT_IDLE_TIMEOUT=300000
```

## Examples

### Basic Usage

```typescript
@Controller('products')
export class ProductController {
  constructor(
    @InjectTenantConnection() private connection: DataSource
  ) {}

  @Get()
  async findAll() {
    return this.connection.getRepository(Product).find();
  }

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    const repository = this.connection.getRepository(Product);
    const product = repository.create(createProductDto);
    return repository.save(product);
  }
}
```

### Using Tenant Context

```typescript
@Controller('dashboard')
export class DashboardController {
  @Get('stats')
  async getStats(@InjectTenantContext() context: TenantContext) {
    const { tenantInfo, connection } = context;
    
    const userCount = await connection.getRepository(User).count();
    const productCount = await connection.getRepository(Product).count();
    
    return {
      tenant: tenantInfo.name,
      users: userCount,
      products: productCount,
    };
  }
}
```

### MongoDB Usage

```typescript
@Controller('users')
export class UserController {
  constructor(
    @InjectTenantConnection() private connection: Connection
  ) {}

  @Get()
  async findAll() {
    const User = this.connection.model('User');
    return User.find().exec();
  }
}
```

## Security Considerations

- Store sensitive configuration in environment variables
- Use encrypted database connections when possible
- Regularly rotate database passwords
- Monitor tenant access patterns
- Validate tenant IDs to prevent injection attacks
- Use connection pooling to prevent resource exhaustion

## Performance Tips

- Enable connection caching for better performance
- Set appropriate connection timeouts
- Monitor connection pool usage
- Use database indexes on tenant lookup fields
- Consider read replicas for high-traffic applications

## Troubleshooting

### Common Issues

1. **Tenant not found**: Ensure the tenant exists in the central database
2. **Connection failed**: Check tenant database credentials and network connectivity
3. **Middleware not working**: Ensure TenancyModule is imported in AppModule
4. **Headers not detected**: Verify the header name matches your configuration

### Debug Mode

```typescript
// Enable debug logging
export default {
  // ... other config
  debug: true,
};
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/angelitosystems/nestjs-multitenant/docs)
- 🐛 [Issue Tracker](https://github.com/angelitosystems/nestjs-multitenant/issues)
- 💬 [Discussions](https://github.com/angelitosystems/nestjs-multitenant/discussions)
- 📧 [Email Support](mailto:support@angelitosystems.com)

---

**Made with ❤️ by [Angelito Systems](https://angelitosystems.net)**