import chalk from 'chalk';
import { ProjectValidator } from '../utils/project-validator';
import { DatabaseManager } from '../utils/database-manager';
import * as fs from 'fs-extra';
import * as path from 'path';

export async function validateProjectCommand(): Promise<void> {
  try {
    console.log(chalk.blue.bold('\n🔍 Project Validation\n'));

    const validator = new ProjectValidator();
    let hasErrors = false;
    let hasWarnings = false;

    // 1. Validate NestJS project structure
    console.log(chalk.blue('📁 Checking project structure...'));
    const projectStructure = await validator.analyzeProjectStructure();
    
    if (projectStructure.isNestJS) {
      console.log(chalk.green('  ✅ Valid NestJS project detected'));
      
      if (projectStructure.nestVersion) {
        console.log(chalk.gray(`     NestJS version: ${projectStructure.nestVersion}`));
      }
      
      console.log(chalk.gray(`     Package manager: ${projectStructure.packageManager}`));
    } else {
      console.log(chalk.red('  ❌ Not a valid NestJS project'));
      hasErrors = true;
      
      if (!projectStructure.hasPackageJson) {
        console.log(chalk.red('     • package.json not found'));
      }
      if (!projectStructure.hasAppModule) {
        console.log(chalk.red('     • app.module.ts not found'));
      }
      if (!projectStructure.nestVersion) {
        console.log(chalk.red('     • NestJS dependencies not found'));
      }
    }

    // 2. Check dependencies
    console.log(chalk.blue('\n📦 Checking dependencies...'));
    const dependencies = await validator.checkDependencies();
    
    if (dependencies.coreInstalled) {
      console.log(chalk.green('  ✅ @angelitosystems/nestjs-multitenant-core is installed'));
      if (dependencies.coreVersion) {
        console.log(chalk.gray(`     Version: ${dependencies.coreVersion}`));
      }
    } else {
      console.log(chalk.yellow('  ⚠️  @angelitosystems/nestjs-multitenant-core is not installed'));
      console.log(chalk.gray('     Run: npm install @angelitosystems/nestjs-multitenant-core'));
      hasWarnings = true;
    }
    
    if (dependencies.missingDependencies.length > 0) {
      console.log(chalk.red('  ❌ Missing required dependencies:'));
      dependencies.missingDependencies.forEach(dep => {
        console.log(chalk.red(`     • ${dep}`));
      });
      hasErrors = true;
    } else {
      console.log(chalk.green('  ✅ All required dependencies are installed'));
    }

    // 3. Validate tenant configuration
    console.log(chalk.blue('\n⚙️  Checking tenant configuration...'));
    const configValidation = await validator.validateTenantConfig();
    
    if (configValidation.exists) {
      if (configValidation.isValid) {
        console.log(chalk.green('  ✅ Tenant configuration is valid'));
        
        // Load and display config details
        await displayConfigDetails();
      } else {
        console.log(chalk.red('  ❌ Tenant configuration has errors:'));
        configValidation.errors.forEach(error => {
          console.log(chalk.red(`     • ${error}`));
        });
        hasErrors = true;
      }
    } else {
      console.log(chalk.yellow('  ⚠️  Tenant configuration not found'));
      console.log(chalk.gray('     Run: angelito-multitenant init'));
      hasWarnings = true;
    }

    // 4. Test central database connection (if config exists)
    if (configValidation.exists && configValidation.isValid) {
      console.log(chalk.blue('\n🗄️  Testing central database connection...'));
      
      try {
        const tenantConfig = await loadTenantConfig();
        const dbManager = new DatabaseManager(tenantConfig);
        const connectionTest = await dbManager.testCentralConnection();
        
        if (connectionTest.success) {
          console.log(chalk.green('  ✅ Central database connection successful'));
          
          // Check if tenants table exists and get tenant count
          const tenantCount = await dbManager.getTenantCount();
          console.log(chalk.gray(`     Tenants in database: ${tenantCount}`));
        } else {
          console.log(chalk.red('  ❌ Central database connection failed:'));
          console.log(chalk.red(`     ${connectionTest.error}`));
          hasErrors = true;
        }
      } catch (error) {
        console.log(chalk.red('  ❌ Failed to test database connection:'));
        console.log(chalk.red(`     ${error}`));
        hasErrors = true;
      }
    }

    // 5. Check environment variables
    console.log(chalk.blue('\n🌍 Checking environment configuration...'));
    await checkEnvironmentVariables();

    // 6. Validate project files
    console.log(chalk.blue('\n📄 Checking project files...'));
    await validateProjectFiles();

    // Summary
    console.log(chalk.blue('\n📋 Validation Summary:'));
    
    if (!hasErrors && !hasWarnings) {
      console.log(chalk.green.bold('  🎉 All checks passed! Your project is ready for multitenancy.'));
    } else if (!hasErrors && hasWarnings) {
      console.log(chalk.yellow.bold('  ⚠️  Project is mostly ready, but has some warnings.'));
      console.log(chalk.yellow('     Address the warnings above for optimal setup.'));
    } else {
      console.log(chalk.red.bold('  ❌ Project has errors that need to be fixed.'));
      console.log(chalk.red('     Please address the errors above before proceeding.'));
    }

    console.log('');
    showNextSteps(hasErrors, hasWarnings);

  } catch (error) {
    console.error(chalk.red('❌ Validation failed:'), error);
    process.exit(1);
  }
}

async function loadTenantConfig(): Promise<any> {
  const configPath = path.join(process.cwd(), 'config', 'tenant.ts');
  
  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    
    // Extract configuration values using regex (basic parsing)
    const driverMatch = configContent.match(/driver:\s*TenancyDriver\.([A-Z_]+)/);
    const strategyMatch = configContent.match(/strategy:\s*TenancyStrategy\.([A-Z_]+)/);
    const hostMatch = configContent.match(/host:\s*.*?['"](.*?)['"]/);
    const portMatch = configContent.match(/port:\s*.*?(\d+)/);
    const usernameMatch = configContent.match(/username:\s*.*?['"](.*?)['"]/);
    const passwordMatch = configContent.match(/password:\s*.*?['"](.*?)['"]/);
    const databaseMatch = configContent.match(/database:\s*.*?['"](.*?)['"]/);
    
    return {
      driver: driverMatch ? driverMatch[1].toLowerCase() : 'postgresql',
      strategy: strategyMatch ? strategyMatch[1].toLowerCase() : 'database_per_tenant',
      centralDb: {
        host: hostMatch ? hostMatch[1] : 'localhost',
        port: portMatch ? parseInt(portMatch[1]) : 5432,
        username: usernameMatch ? usernameMatch[1] : 'root',
        password: passwordMatch ? passwordMatch[1] : '',
        database: databaseMatch ? databaseMatch[1] : 'central_tenants',
      },
    };
  } catch (error) {
    throw new Error(`Failed to load tenant configuration: ${error}`);
  }
}

async function displayConfigDetails(): Promise<void> {
  try {
    const config = await loadTenantConfig();
    console.log(chalk.gray(`     Driver: ${config.driver}`));
    console.log(chalk.gray(`     Strategy: ${config.strategy}`));
    console.log(chalk.gray(`     Central DB: ${config.centralDb.host}:${config.centralDb.port}/${config.centralDb.database}`));
  } catch (error) {
    // Ignore errors in displaying details
  }
}

async function checkEnvironmentVariables(): Promise<void> {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  const hasEnv = await fs.pathExists(envPath);
  const hasEnvExample = await fs.pathExists(envExamplePath);
  
  if (hasEnv) {
    console.log(chalk.green('  ✅ .env file found'));
  } else {
    console.log(chalk.yellow('  ⚠️  .env file not found'));
    console.log(chalk.gray('     Consider creating one for environment-specific configuration'));
  }
  
  if (hasEnvExample) {
    console.log(chalk.green('  ✅ .env.example file found'));
  } else {
    console.log(chalk.yellow('  ⚠️  .env.example file not found'));
    console.log(chalk.gray('     This file helps document required environment variables'));
  }
  
  // Check for common environment variables
  const commonEnvVars = [
    'CENTRAL_DB_HOST',
    'CENTRAL_DB_PORT',
    'CENTRAL_DB_USERNAME',
    'CENTRAL_DB_PASSWORD',
    'CENTRAL_DB_DATABASE',
  ];
  
  if (hasEnv) {
    try {
      const envContent = await fs.readFile(envPath, 'utf-8');
      const missingVars = commonEnvVars.filter(varName => !envContent.includes(varName));
      
      if (missingVars.length === 0) {
        console.log(chalk.green('  ✅ All recommended environment variables are defined'));
      } else {
        console.log(chalk.yellow('  ⚠️  Some recommended environment variables are missing:'));
        missingVars.forEach(varName => {
          console.log(chalk.yellow(`     • ${varName}`));
        });
      }
    } catch (error) {
      console.log(chalk.yellow('  ⚠️  Could not read .env file'));
    }
  }
}

async function validateProjectFiles(): Promise<void> {
  const importantFiles = [
    { path: 'src/app.module.ts', name: 'App Module', required: true },
    { path: 'src/main.ts', name: 'Main file', required: true },
    { path: 'tsconfig.json', name: 'TypeScript config', required: false },
    { path: 'nest-cli.json', name: 'NestJS CLI config', required: false },
  ];
  
  for (const file of importantFiles) {
    const exists = await fs.pathExists(path.join(process.cwd(), file.path));
    
    if (exists) {
      console.log(chalk.green(`  ✅ ${file.name} found`));
    } else if (file.required) {
      console.log(chalk.red(`  ❌ ${file.name} not found (${file.path})`));
    } else {
      console.log(chalk.yellow(`  ⚠️  ${file.name} not found (${file.path})`));
    }
  }
}

function showNextSteps(hasErrors: boolean, hasWarnings: boolean): void {
  console.log(chalk.blue('🚀 Next Steps:'));
  
  if (hasErrors) {
    console.log('1. Fix the errors listed above');
    console.log('2. Run validation again: angelito-multitenant validate');
  } else if (hasWarnings) {
    console.log('1. Address warnings if needed');
    console.log('2. Add tenants: angelito-multitenant add-tenant');
    console.log('3. Test your application with tenant headers');
  } else {
    console.log('1. Add tenants: angelito-multitenant add-tenant');
    console.log('2. Import TenancyModule in your AppModule');
    console.log('3. Use @InjectTenantConnection() in your controllers');
    console.log('4. Test with tenant headers: X-Tenant-ID: your-tenant-id');
  }
  
  console.log('');
  console.log(chalk.blue('📚 Documentation:'));
  console.log('  • Configuration: config/README.md');
  console.log('  • Examples: https://github.com/angelitosystems/nestjs-multitenant/examples');
  console.log('');
}