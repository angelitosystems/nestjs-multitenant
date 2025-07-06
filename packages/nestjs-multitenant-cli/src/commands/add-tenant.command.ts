import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { TenantInfo, TenancyDriver } from '../types/config.types';
import { DatabaseManager } from '../utils/database-manager';
import { ProjectValidator } from '../utils/project-validator';

interface AddTenantOptions {
  id?: string;
  name?: string;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  database?: string;
  schema?: string;
  interactive?: boolean;
}

interface AddTenantAnswers {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export async function addTenantCommand(options: AddTenantOptions): Promise<void> {
  try {
    console.log(chalk.blue.bold('\n🏢 Add New Tenant\n'));

    // Validate project and configuration
    const validator = new ProjectValidator();
    const configValidation = await validator.validateTenantConfig();
    
    if (!configValidation.exists) {
      console.error(chalk.red('❌ Tenant configuration not found.'));
      console.log(chalk.yellow('Please run "angelito-multitenant init" first.'));
      process.exit(1);
    }

    if (!configValidation.isValid) {
      console.error(chalk.red('❌ Invalid tenant configuration:'));
      configValidation.errors.forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
      process.exit(1);
    }

    // Load tenant configuration
    const tenantConfig = await loadTenantConfig();
    
    // Get tenant information
    const tenantInfo = await getTenantInformation(options, tenantConfig.driver);
    
    // Validate tenant doesn't already exist
    const dbManager = new DatabaseManager(tenantConfig);
    const existingTenant = await dbManager.getTenant(tenantInfo.id);
    
    if (existingTenant) {
      console.error(chalk.red(`❌ Tenant with ID "${tenantInfo.id}" already exists.`));
      process.exit(1);
    }

    // Test tenant database connection
    console.log(chalk.blue('🔍 Testing tenant database connection...'));
    const connectionTest = await dbManager.testTenantConnection(tenantInfo);
    
    if (!connectionTest.success) {
      console.error(chalk.red('❌ Failed to connect to tenant database:'));
      console.error(chalk.red(connectionTest.error));
      
      const { continueAnyway } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueAnyway',
          message: 'Do you want to add the tenant anyway? (You can fix the connection later)',
          default: false,
        },
      ]);
      
      if (!continueAnyway) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
      
      tenantInfo.isActive = false; // Mark as inactive if connection failed
    } else {
      console.log(chalk.green('✅ Tenant database connection successful'));
    }

    // Add tenant to central database
    console.log(chalk.blue('💾 Adding tenant to central database...'));
    await dbManager.addTenant(tenantInfo);
    
    console.log(chalk.green.bold('\n🎉 Tenant added successfully!\n'));
    
    // Show tenant information
    showTenantInfo(tenantInfo);
    
    // Show next steps
    showNextSteps(tenantInfo);

  } catch (error) {
    console.error(chalk.red('❌ Failed to add tenant:'), error);
    process.exit(1);
  }
}

async function loadTenantConfig(): Promise<any> {
  const configPath = path.join(process.cwd(), 'config', 'tenant.ts');
  
  try {
    // For TypeScript files, we need to compile or use ts-node
    // For simplicity, we'll read and parse the file manually
    const configContent = await fs.readFile(configPath, 'utf-8');
    
    // Extract configuration values using regex (basic parsing)
    const driverMatch = configContent.match(/driver:\s*TenancyDriver\.([A-Z_]+)/);
    const driver = driverMatch ? driverMatch[1].toLowerCase() : 'postgresql';
    
    return { driver };
  } catch (error) {
    throw new Error(`Failed to load tenant configuration: ${error}`);
  }
}

async function getTenantInformation(
  options: AddTenantOptions,
  driver: TenancyDriver
): Promise<AddTenantAnswers> {
  if (options.interactive === false) {
    // Non-interactive mode
    if (!options.id || !options.name || !options.host || !options.username || !options.database) {
      throw new Error('In non-interactive mode, id, name, host, username, and database are required');
    }
    
    return {
      id: options.id,
      name: options.name,
      host: options.host,
      port: parseInt(options.port || getDefaultPort(driver).toString()),
      username: options.username,
      password: options.password || '',
      database: options.database,
      schema: options.schema,
      isActive: true,
    };
  }

  const questions = [
    {
      type: 'input',
      name: 'id',
      message: 'Tenant ID (unique identifier):',
      default: options.id,
      validate: (input: string) => {
        if (!input || input.length === 0) {
          return 'Tenant ID is required';
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
          return 'Tenant ID can only contain letters, numbers, hyphens, and underscores';
        }
        if (input.length > 100) {
          return 'Tenant ID must be 100 characters or less';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'name',
      message: 'Tenant name (human-readable):',
      default: options.name,
      validate: (input: string) => input.length > 0 || 'Tenant name is required',
    },
    {
      type: 'input',
      name: 'host',
      message: 'Database host:',
      default: options.host || 'localhost',
      validate: (input: string) => input.length > 0 || 'Database host is required',
    },
    {
      type: 'number',
      name: 'port',
      message: 'Database port:',
      default: options.port ? parseInt(options.port) : getDefaultPort(driver),
      validate: (input: number) => {
        if (input <= 0 || input > 65535) {
          return 'Port must be between 1 and 65535';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'username',
      message: 'Database username:',
      default: options.username,
      validate: (input: string) => input.length > 0 || 'Database username is required',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Database password:',
      mask: '*',
      default: options.password,
    },
    {
      type: 'input',
      name: 'database',
      message: 'Database name:',
      default: options.database,
      validate: (input: string) => input.length > 0 || 'Database name is required',
    },
    {
      type: 'input',
      name: 'schema',
      message: 'Database schema (optional, for PostgreSQL):',
      default: options.schema,
      when: () => driver === TenancyDriver.POSTGRESQL,
    },
    {
      type: 'confirm',
      name: 'isActive',
      message: 'Is this tenant active?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'addMetadata',
      message: 'Do you want to add custom metadata?',
      default: false,
    },
    {
      type: 'input',
      name: 'metadataJson',
      message: 'Enter metadata as JSON:',
      when: (answers: any) => answers.addMetadata,
      validate: (input: string) => {
        if (!input) return true;
        try {
          JSON.parse(input);
          return true;
        } catch {
          return 'Invalid JSON format';
        }
      },
    },
  ];

  const answers = await inquirer.prompt(questions);
  
  // Parse metadata if provided
  if (answers.metadataJson) {
    try {
      answers.metadata = JSON.parse(answers.metadataJson);
    } catch {
      // Ignore invalid JSON
    }
  }
  
  delete answers.addMetadata;
  delete answers.metadataJson;
  
  return answers;
}

function getDefaultPort(driver: TenancyDriver): number {
  switch (driver) {
    case TenancyDriver.MYSQL:
      return 3306;
    case TenancyDriver.POSTGRESQL:
      return 5432;
    case TenancyDriver.MONGODB:
      return 27017;
    default:
      return 5432;
  }
}

function showTenantInfo(tenant: AddTenantAnswers): void {
  console.log(chalk.blue('📋 Tenant Information:'));
  console.log(`  ID: ${chalk.cyan(tenant.id)}`);
  console.log(`  Name: ${chalk.cyan(tenant.name)}`);
  console.log(`  Host: ${chalk.cyan(tenant.host)}:${chalk.cyan(tenant.port)}`);
  console.log(`  Database: ${chalk.cyan(tenant.database)}`);
  if (tenant.schema) {
    console.log(`  Schema: ${chalk.cyan(tenant.schema)}`);
  }
  console.log(`  Status: ${tenant.isActive ? chalk.green('Active') : chalk.red('Inactive')}`);
  
  if (tenant.metadata && Object.keys(tenant.metadata).length > 0) {
    console.log(`  Metadata: ${chalk.cyan(JSON.stringify(tenant.metadata, null, 2))}`);
  }
}

function showNextSteps(tenant: AddTenantAnswers): void {
  console.log(chalk.blue('\n🚀 Next Steps:'));
  
  console.log('1. Test the tenant connection:');
  console.log(chalk.cyan(`   curl -H "X-Tenant-ID: ${tenant.id}" http://localhost:3000/api/health`));
  
  console.log('\n2. Create database tables for this tenant (if needed)');
  
  console.log('\n3. Configure your application to handle this tenant');
  
  if (!tenant.isActive) {
    console.log(chalk.yellow('\n⚠️  This tenant is marked as inactive. Activate it when ready:'));
    console.log(chalk.cyan('   angelito-multitenant list-tenants'));
  }
  
  console.log('');
}