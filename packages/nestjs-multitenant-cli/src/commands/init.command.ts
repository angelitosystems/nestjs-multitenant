import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectValidator } from '../utils/project-validator';
import { ConfigGenerator } from '../utils/config-generator';
import { TenancyDriver, TenancyStrategy, TenantIdentifierType } from '../types/config.types';

interface InitOptions {
  force?: boolean;
  driver?: string;
  strategy?: string;
  interactive?: boolean;
}

interface InitAnswers {
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
  installDependencies: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  try {
    console.log(chalk.blue.bold('\n🏢 NestJS Multitenant Initialization\n'));

    // Validate that we're in a NestJS project
    const projectValidator = new ProjectValidator();
    const isValidProject = await projectValidator.validateNestJSProject();

    if (!isValidProject) {
      console.log(chalk.yellow('❌ This doesn\'t appear to be a NestJS project.'));
      console.log(chalk.blue('\nWould you like to create a new NestJS multitenant project instead?'));
      
      const { createNew } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createNew',
          message: 'Create a new NestJS multitenant project?',
          default: true,
        },
      ]);

      if (createNew) {
        console.log(chalk.cyan('\nUse the create command to generate a new project:'));
        console.log(chalk.cyan('  angelito-multitenant create'));
        console.log(chalk.cyan('\nOr specify a template directly:'));
        console.log(chalk.cyan('  angelito-multitenant create --template basic'));
        console.log(chalk.cyan('  angelito-multitenant create --template intermediate'));
        console.log(chalk.cyan('  angelito-multitenant create --template advanced'));
        return;
      } else {
        console.log(chalk.yellow('Please run this command in the root of a NestJS project.'));
        process.exit(1);
      }
    }

    console.log(chalk.green('✅ NestJS project detected'));
    
    // Check if multitenant core is already installed
    const hasMultitenantCore = await projectValidator.hasMultitenantCore();
    if (hasMultitenantCore) {
      console.log(chalk.green('✅ Multitenant core package detected'));
    } else {
      console.log(chalk.yellow('⚠️  Multitenant core package not found'));
      
      const { installCore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'installCore',
          message: 'Install @angelitosystems/nestjs-multitenant-core package?',
          default: true,
        },
      ]);

      if (installCore) {
        await installMultitenantCore();
      } else {
        console.log(chalk.yellow('Please install @angelitosystems/nestjs-multitenant-core manually:'));
        console.log(chalk.cyan('  npm install @angelitosystems/nestjs-multitenant-core'));
      }
    }

    // Check if configuration already exists
    const configPath = path.join(process.cwd(), 'config', 'tenant.ts');
    const configExists = await fs.pathExists(configPath);

    if (configExists && !options.force) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Tenant configuration already exists. Do you want to overwrite it?',
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    // Get configuration from user
    const answers = await getConfigurationAnswers(options);

    // Generate configuration
    const configGenerator = new ConfigGenerator();
    await configGenerator.generateConfig(answers);

    // Install dependencies if requested
    if (answers.installDependencies) {
      await installDependencies();
    }

    // Show success message and next steps
    showSuccessMessage(answers);

  } catch (error) {
    console.error(chalk.red('❌ Initialization failed:'), error);
    process.exit(1);
  }
}

async function getConfigurationAnswers(options: InitOptions): Promise<InitAnswers> {
  if (options.interactive === false) {
    // Non-interactive mode - use provided options or defaults
    return {
      driver: (options.driver as TenancyDriver) || TenancyDriver.POSTGRESQL,
      strategy: (options.strategy as TenancyStrategy) || TenancyStrategy.DATABASE_PER_TENANT,
      centralHost: 'localhost',
      centralPort: 5432,
      centralUsername: 'root',
      centralPassword: '',
      centralDatabase: 'central_tenants',
      identifierType: TenantIdentifierType.HEADER,
      identifierKey: 'X-Tenant-ID',
      installDependencies: true,
    };
  }

  const questions = [
    {
      type: 'list',
      name: 'driver',
      message: 'Which database driver do you want to use?',
      choices: [
        { name: 'PostgreSQL', value: TenancyDriver.POSTGRESQL },
        { name: 'MySQL', value: TenancyDriver.MYSQL },
        { name: 'MongoDB', value: TenancyDriver.MONGODB },
      ],
      default: options.driver || TenancyDriver.POSTGRESQL,
    },
    {
      type: 'list',
      name: 'strategy',
      message: 'Which tenancy strategy do you want to use?',
      choices: [
        {
          name: 'Database per tenant (Recommended)',
          value: TenancyStrategy.DATABASE_PER_TENANT,
        },
        {
          name: 'Schema per tenant (PostgreSQL only)',
          value: TenancyStrategy.SCHEMA_PER_TENANT,
        },
        {
          name: 'Shared database with tenant column',
          value: TenancyStrategy.SHARED_DATABASE,
        },
      ],
      default: options.strategy || TenancyStrategy.DATABASE_PER_TENANT,
      when: (answers: any) => answers.driver !== TenancyDriver.MONGODB,
    },
    {
      type: 'input',
      name: 'centralHost',
      message: 'Central database host:',
      default: 'localhost',
      validate: (input: string) => input.length > 0 || 'Host is required',
    },
    {
      type: 'number',
      name: 'centralPort',
      message: 'Central database port:',
      default: (answers: any) => {
        switch (answers.driver) {
          case TenancyDriver.MYSQL:
            return 3306;
          case TenancyDriver.POSTGRESQL:
            return 5432;
          case TenancyDriver.MONGODB:
            return 27017;
          default:
            return 5432;
        }
      },
      validate: (input: number) => input > 0 && input <= 65535 || 'Port must be between 1 and 65535',
    },
    {
      type: 'input',
      name: 'centralUsername',
      message: 'Central database username:',
      default: 'root',
      validate: (input: string) => input.length > 0 || 'Username is required',
    },
    {
      type: 'password',
      name: 'centralPassword',
      message: 'Central database password:',
      mask: '*',
    },
    {
      type: 'input',
      name: 'centralDatabase',
      message: 'Central database name:',
      default: 'central_tenants',
      validate: (input: string) => input.length > 0 || 'Database name is required',
    },
    {
      type: 'list',
      name: 'identifierType',
      message: 'How do you want to identify tenants?',
      choices: [
        { name: 'HTTP Header (Recommended)', value: TenantIdentifierType.HEADER },
        { name: 'Subdomain', value: TenantIdentifierType.SUBDOMAIN },
        { name: 'Query Parameter', value: TenantIdentifierType.QUERY_PARAM },
      ],
      default: TenantIdentifierType.HEADER,
    },
    {
      type: 'input',
      name: 'identifierKey',
      message: (answers: any) => {
        switch (answers.identifierType) {
          case TenantIdentifierType.HEADER:
            return 'Header name:';
          case TenantIdentifierType.QUERY_PARAM:
            return 'Query parameter name:';
          case TenantIdentifierType.SUBDOMAIN:
            return 'Subdomain pattern (regex):';
          default:
            return 'Identifier key:';
        }
      },
      default: (answers: any) => {
        switch (answers.identifierType) {
          case TenantIdentifierType.HEADER:
            return 'X-Tenant-ID';
          case TenantIdentifierType.QUERY_PARAM:
            return 'tenant';
          case TenantIdentifierType.SUBDOMAIN:
            return '^([a-zA-Z0-9-]+)\\.';
          default:
            return 'X-Tenant-ID';
        }
      },
      validate: (input: string) => input.length > 0 || 'Identifier key is required',
    },
    {
      type: 'confirm',
      name: 'installDependencies',
      message: 'Do you want to install the required dependencies?',
      default: true,
    },
  ];

  return await inquirer.prompt(questions as any) as InitAnswers;
}

async function installDependencies(): Promise<void> {
  console.log(chalk.blue('\n📦 Installing dependencies...'));
  
  const { execSync } = require('child_process');
  
  try {
    // Check if npm or yarn is available
    const packageManager = await detectPackageManager();
    
    const command = `${packageManager} ${packageManager === 'npm' ? 'install' : 'add'} @angelitosystems/nestjs-multitenant-core`;
    
    console.log(chalk.gray(`Running: ${command}`));
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    
    console.log(chalk.green('✅ Dependencies installed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to install dependencies:'), error);
    console.log(chalk.yellow('Please install manually: npm install @angelitosystems/nestjs-multitenant-core'));
  }
}

async function installMultitenantCore(): Promise<void> {
  console.log(chalk.cyan('Installing @angelitosystems/nestjs-multitenant-core...'));

  try {
    const packageManager = await detectPackageManager();
    console.log(chalk.cyan(`Using ${packageManager}...`));
    
    const { execSync } = require('child_process');
    execSync(`${packageManager} install @angelitosystems/nestjs-multitenant-core`, {
      stdio: 'inherit',
    });
    
    console.log(chalk.green('✅ Multitenant core package installed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to install multitenant core package:'), error);
    console.log(chalk.yellow('Please install manually:'));
    console.log(chalk.cyan('  npm install @angelitosystems/nestjs-multitenant-core'));
    throw error;
  }
}

async function detectPackageManager(): Promise<string> {
  const yarnLockExists = await fs.pathExists(path.join(process.cwd(), 'yarn.lock'));
  const pnpmLockExists = await fs.pathExists(path.join(process.cwd(), 'pnpm-lock.yaml'));
  
  if (pnpmLockExists) return 'pnpm';
  if (yarnLockExists) return 'yarn';
  return 'npm';
}

function showSuccessMessage(answers: InitAnswers): void {
  console.log(chalk.green.bold('\n🎉 Multitenancy configuration created successfully!\n'));
  
  console.log(chalk.blue('📁 Files created:'));
  console.log('  • config/tenant.ts');
  
  console.log(chalk.blue('\n🚀 Next steps:'));
  console.log('1. Import TenancyModule in your AppModule:');
  console.log(chalk.cyan(`
   import { TenancyModule } from '@angelitosystems/nestjs-multitenant-core';
   import tenantConfig from './config/tenant';

   @Module({
     imports: [TenancyModule.forRoot(tenantConfig)],
   })
   export class AppModule {}`));
  
  console.log('\n2. Use the decorators in your controllers:');
  console.log(chalk.cyan(`
   @Controller('users')
   export class UserController {
     constructor(@InjectTenantConnection() private conn: DataSource) {}

     @Get()
     async findAll() {
       return this.conn.getRepository(User).find();
     }
   }`));
  
  console.log('\n3. Add tenants to your central database:');
  console.log(chalk.cyan('   angelito-multitenant add-tenant'));
  
  console.log(chalk.yellow('\n💡 Don\'t forget to create your central database and configure the connection!'));
  console.log('');
}