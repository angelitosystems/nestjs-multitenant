import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import { ProjectValidator } from '../utils/project-validator';
import { ConfigGenerator } from '../utils/config-generator';
import { TenancyDriver, TenancyStrategy, TenantIdentifierType } from '../types/config.types';

interface CreateOptions {
  template?: string;
  name?: string;
  directory?: string;
  interactive?: boolean;
}

interface CreateAnswers {
  projectName: string;
  template: 'basic' | 'intermediate' | 'advanced';
  driver: TenancyDriver;
  strategy: TenancyStrategy;
  centralHost: string;
  centralPort: number;
  centralUsername: string;
  centralPassword: string;
  centralDatabase: string;
  identifierType: TenantIdentifierType;
  identifierKey: string;
  installDependencies: boolean;
}

const TEMPLATES = {
  basic: {
    name: 'Basic Usage',
    description: 'Simple multitenancy setup with basic configuration',
    dependencies: [
      '@angelitosystems/nestjs-multitenant-core',
      '@nestjs/common',
      '@nestjs/core',
      '@nestjs/platform-express',
      'reflect-metadata',
      'rxjs'
    ],
    devDependencies: [
      '@nestjs/cli',
      '@nestjs/schematics',
      '@nestjs/testing',
      '@types/express',
      '@types/jest',
      '@types/node',
      '@types/supertest',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      'eslint',
      'eslint-config-prettier',
      'eslint-plugin-prettier',
      'jest',
      'prettier',
      'source-map-support',
      'supertest',
      'ts-jest',
      'ts-loader',
      'ts-node',
      'tsconfig-paths',
      'typescript'
    ]
  },
  intermediate: {
    name: 'Intermediate Usage',
    description: 'Advanced features with caching, validation, and DTOs',
    dependencies: [
      '@angelitosystems/nestjs-multitenant-core',
      '@nestjs/common',
      '@nestjs/core',
      '@nestjs/platform-express',
      '@nestjs/config',
      '@nestjs/cache-manager',
      '@nestjs/throttler',
      '@nestjs/swagger',
      '@nestjs/mapped-types',
      'class-validator',
      'class-transformer',
      'cache-manager',
      'reflect-metadata',
      'rxjs'
    ],
    devDependencies: [
      '@nestjs/cli',
      '@nestjs/schematics',
      '@nestjs/testing',
      '@types/express',
      '@types/jest',
      '@types/node',
      '@types/supertest',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      'eslint',
      'eslint-config-prettier',
      'eslint-plugin-prettier',
      'jest',
      'prettier',
      'source-map-support',
      'supertest',
      'ts-jest',
      'ts-loader',
      'ts-node',
      'tsconfig-paths',
      'typescript'
    ]
  },
  advanced: {
    name: 'Advanced Usage',
    description: 'Enterprise-ready with security, monitoring, and compliance',
    dependencies: [
      '@angelitosystems/nestjs-multitenant-core',
      '@nestjs/common',
      '@nestjs/core',
      '@nestjs/platform-express',
      '@nestjs/config',
      '@nestjs/cache-manager',
      '@nestjs/throttler',
      '@nestjs/swagger',
      '@nestjs/mapped-types',
      '@nestjs/jwt',
      '@nestjs/passport',
      '@nestjs/schedule',
      '@nestjs/bull',
      '@nestjs/terminus',
      '@nestjs/event-emitter',
      'class-validator',
      'class-transformer',
      'cache-manager',
      'cache-manager-redis-store',
      'passport',
      'passport-jwt',
      'passport-local',
      'bcrypt',
      'helmet',
      'compression',
      'express-rate-limit',
      'bull',
      'redis',
      'reflect-metadata',
      'rxjs'
    ],
    devDependencies: [
      '@nestjs/cli',
      '@nestjs/schematics',
      '@nestjs/testing',
      '@types/express',
      '@types/jest',
      '@types/node',
      '@types/supertest',
      '@types/bcrypt',
      '@types/passport-jwt',
      '@types/passport-local',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      'eslint',
      'eslint-config-prettier',
      'eslint-plugin-prettier',
      'jest',
      'prettier',
      'source-map-support',
      'supertest',
      'ts-jest',
      'ts-loader',
      'ts-node',
      'tsconfig-paths',
      'typescript'
    ]
  }
};

export async function createCommand(name?: string, options: CreateOptions = {}): Promise<void> {
  try {
    console.log(chalk.blue.bold('\n🚀 NestJS Multitenant Project Creator\n'));

    // If name is provided as positional argument, add it to options
    if (name) {
      options.name = name;
    }

    // Get project configuration from user
    const answers = await getProjectAnswers(options);

    // Create project directory
    const projectPath = path.join(process.cwd(), answers.projectName);
    
    if (await fs.pathExists(projectPath)) {
      try {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Directory '${answers.projectName}' already exists. Do you want to overwrite it?`,
            default: false,
          },
        ]);

        if (!overwrite) {
          console.log(chalk.yellow('Operation cancelled.'));
          return;
        }

        await fs.remove(projectPath);
      } catch (error: any) {
        // Handle user cancellation during overwrite confirmation
        if (error.name === 'ExitPromptError' || error.message?.includes('SIGINT') || error.message?.includes('User force closed')) {
          console.log(chalk.yellow('\n\n⚠️  Operation cancelled by user.'));
          return;
        }
        throw error; // Re-throw other errors
      }
    }

    console.log(chalk.cyan(`Creating project in ${projectPath}...`));
    await fs.ensureDir(projectPath);

    // Create NestJS project structure
    await createNestJSProject(projectPath, answers);

    // Copy template files
    await copyTemplateFiles(projectPath, answers.template);

    // Generate tenant configuration
    const configGenerator = new ConfigGenerator();
    process.chdir(projectPath);
    await configGenerator.generateConfig(answers);

    // Install dependencies
    if (answers.installDependencies) {
      await installProjectDependencies(projectPath, answers.template);
    }

    // Show success message
    showProjectCreatedMessage(answers);

  } catch (error: any) {
    // Handle user cancellation (Ctrl+C) gracefully
    if (error.name === 'ExitPromptError' || error.message?.includes('SIGINT') || error.message?.includes('User force closed')) {
      console.log(chalk.yellow('\n\n⚠️  Operation cancelled by user.'));
      console.log(chalk.gray('Project creation was interrupted.'));
      process.exit(0); // Exit with success code since user intentionally cancelled
    }
    
    console.error(chalk.red('❌ Project creation failed:'), error.message || error);
    process.exit(1);
  }
}

async function getProjectAnswers(options: CreateOptions = {}): Promise<CreateAnswers> {
  if (options.interactive === false) {
    return {
      projectName: options.name || 'my-multitenant-app',
      template: (options.template as any) || 'basic',
      driver: TenancyDriver.POSTGRESQL,
      strategy: TenancyStrategy.DATABASE_PER_TENANT,
      centralHost: 'localhost',
      centralPort: 5432,
      centralUsername: 'postgres',
      centralPassword: '',
      centralDatabase: 'central_tenants',
      identifierType: TenantIdentifierType.HEADER,
      identifierKey: 'X-Tenant-ID',
      installDependencies: true,
    };
  }

  const questions = [
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: options.name || 'my-multitenant-app',
      validate: (input: string) => {
        if (input.length === 0) return 'Project name is required';
        if (!/^[a-zA-Z0-9-_]+$/.test(input)) return 'Project name can only contain letters, numbers, hyphens, and underscores';
        return true;
      },
    },
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      choices: [
        {
          name: `${TEMPLATES.basic.name} - ${TEMPLATES.basic.description}`,
          value: 'basic',
        },
        {
          name: `${TEMPLATES.intermediate.name} - ${TEMPLATES.intermediate.description}`,
          value: 'intermediate',
        },
        {
          name: `${TEMPLATES.advanced.name} - ${TEMPLATES.advanced.description}`,
          value: 'advanced',
        },
      ],
      default: options.template || 'basic',
    },
    {
      type: 'list',
      name: 'driver',
      message: 'Database driver:',
      choices: [
        { name: 'PostgreSQL (Recommended)', value: TenancyDriver.POSTGRESQL },
        { name: 'MySQL', value: TenancyDriver.MYSQL },
        { name: 'MongoDB', value: TenancyDriver.MONGODB },
      ],
      default: TenancyDriver.POSTGRESQL,
    },
    {
      type: 'list',
      name: 'strategy',
      message: 'Tenancy strategy:',
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
      default: TenancyStrategy.DATABASE_PER_TENANT,
      when: (answers: any) => answers.driver !== TenancyDriver.MONGODB,
    },
    {
      type: 'input',
      name: 'centralHost',
      message: 'Central database host:',
      default: 'localhost',
    },
    {
      type: 'number',
      name: 'centralPort',
      message: 'Central database port:',
      default: (answers: any) => {
        switch (answers.driver) {
          case TenancyDriver.MYSQL: return 3306;
          case TenancyDriver.POSTGRESQL: return 5432;
          case TenancyDriver.MONGODB: return 27017;
          default: return 5432;
        }
      },
    },
    {
      type: 'input',
      name: 'centralUsername',
      message: 'Central database username:',
      default: 'postgres',
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
    },
    {
      type: 'list',
      name: 'identifierType',
      message: 'Tenant identification method:',
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
          case TenantIdentifierType.HEADER: return 'Header name:';
          case TenantIdentifierType.QUERY_PARAM: return 'Query parameter name:';
          case TenantIdentifierType.SUBDOMAIN: return 'Subdomain pattern:';
          default: return 'Identifier key:';
        }
      },
      default: (answers: any) => {
        switch (answers.identifierType) {
          case TenantIdentifierType.HEADER: return 'X-Tenant-ID';
          case TenantIdentifierType.QUERY_PARAM: return 'tenant';
          case TenantIdentifierType.SUBDOMAIN: return '{tenant}.example.com';
          default: return 'X-Tenant-ID';
        }
      },
    },
    {
      type: 'confirm',
      name: 'installDependencies',
      message: 'Install dependencies?',
      default: true,
    },
  ];

  try {
    return await inquirer.prompt(questions as any) as CreateAnswers;
  } catch (error: any) {
    // Re-throw the error to be handled by the main createCommand function
    throw error;
  }
}

async function createNestJSProject(projectPath: string, answers: CreateAnswers): Promise<void> {
  console.log(chalk.cyan('Creating NestJS project structure...'));

  // Create basic NestJS structure
  const directories = [
    'src',
    'src/common',
    'src/common/dto',
    'src/common/interfaces',
    'src/config',
    'test',
  ];

  for (const dir of directories) {
    await fs.ensureDir(path.join(projectPath, dir));
  }

  // Create package.json
  const packageJson = {
    name: answers.projectName,
    version: '0.0.1',
    description: 'NestJS Multitenant Application',
    author: '',
    private: true,
    license: 'UNLICENSED',
    scripts: {
      build: 'nest build',
      format: 'prettier --write "src/**/*.ts" "test/**/*.ts"',
      start: 'nest start',
      'start:dev': 'nest start --watch',
      'start:debug': 'nest start --debug --watch',
      'start:prod': 'node dist/main',
      lint: 'eslint "{src,apps,libs,test}/**/*.ts" --fix',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:cov': 'jest --coverage',
      'test:debug': 'node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand',
      'test:e2e': 'jest --config ./test/jest-e2e.json',
    },
    dependencies: {},
    devDependencies: {},
    jest: {
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: 'src',
      testRegex: '.*\\.spec\\.ts$',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      collectCoverageFrom: ['**/*.(t|j)s'],
      coverageDirectory: '../coverage',
      testEnvironment: 'node',
    },
  };

  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

  // Create basic configuration files
  await createConfigFiles(projectPath);
}

async function createConfigFiles(projectPath: string): Promise<void> {
  // tsconfig.json
  const tsConfig = {
    compilerOptions: {
      module: 'commonjs',
      declaration: true,
      removeComments: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      allowSyntheticDefaultImports: true,
      target: 'ES2021',
      sourceMap: true,
      outDir: './dist',
      baseUrl: './',
      incremental: true,
      skipLibCheck: true,
      strictNullChecks: false,
      noImplicitAny: false,
      strictBindCallApply: false,
      forceConsistentCasingInFileNames: false,
      noFallthroughCasesInSwitch: false,
    },
  };

  await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });

  // tsconfig.build.json
  const tsBuildConfig = {
    extends: './tsconfig.json',
    exclude: ['node_modules', 'test', 'dist', '**/*spec.ts'],
  };

  await fs.writeJson(path.join(projectPath, 'tsconfig.build.json'), tsBuildConfig, { spaces: 2 });

  // nest-cli.json
  const nestCliConfig = {
    $schema: 'https://json.schemastore.org/nest-cli',
    collection: '@nestjs/schematics',
    sourceRoot: 'src',
    compilerOptions: {
      deleteOutDir: true,
    },
  };

  await fs.writeJson(path.join(projectPath, 'nest-cli.json'), nestCliConfig, { spaces: 2 });

  // .eslintrc.js
  const eslintConfig = `module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    '@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};`;

  await fs.writeFile(path.join(projectPath, '.eslintrc.js'), eslintConfig);

  // .prettierrc
  const prettierConfig = {
    singleQuote: true,
    trailingComma: 'all',
  };

  await fs.writeJson(path.join(projectPath, '.prettierrc'), prettierConfig, { spaces: 2 });

  // .gitignore
  const gitignore = `# compiled output
/dist
/node_modules

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store

# Tests
/coverage
/.nyc_output

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Dependency directories
node_modules/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);

  // README.md
  const readme = `# NestJS Multitenant Application

A NestJS application with multitenancy support.

## Installation

\`\`\`bash
npm install
\`\`\`

## Running the app

\`\`\`bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
\`\`\`

## Test

\`\`\`bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
\`\`\`

## Multitenancy

This application uses [@angelitosystems/nestjs-multitenant-core](https://github.com/angelitosystems/nestjs-multitenant) for multitenancy support.

### Adding Tenants

\`\`\`bash
angelito-multitenant add-tenant
\`\`\`

### Listing Tenants

\`\`\`bash
angelito-multitenant list-tenants
\`\`\`

## License

UNLICENSED`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readme);
}

async function copyTemplateFiles(projectPath: string, template: string): Promise<void> {
  console.log(chalk.cyan(`Copying ${template} template files...`));

  const templatePath = path.join(__dirname, '..', '..', '..', '..', 'examples', `${template}-usage`);
  
  if (!(await fs.pathExists(templatePath))) {
    console.log(chalk.yellow(`Template files not found at ${templatePath}, creating basic structure...`));
    await createBasicStructure(projectPath);
    return;
  }

  // Copy template files
  await fs.copy(templatePath, projectPath, {
    overwrite: true,
    filter: (src) => {
      // Skip node_modules and other unwanted files
      return !src.includes('node_modules') && !src.includes('.git');
    },
  });
}

async function createBasicStructure(projectPath: string): Promise<void> {
  // Create main.ts
  const mainTs = `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();`;

  await fs.writeFile(path.join(projectPath, 'src', 'main.ts'), mainTs);

  // Create app.module.ts
  const appModuleTs = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenancyModule } from '@angelitosystems/nestjs-multitenant-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import tenantConfig from './config/tenant';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [tenantConfig],
    }),
    TenancyModule.forRootAsync({
      useFactory: () => tenantConfig(),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}`;

  await fs.writeFile(path.join(projectPath, 'src', 'app.module.ts'), appModuleTs);

  // Create app.controller.ts
  const appControllerTs = `import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}`;

  await fs.writeFile(path.join(projectPath, 'src', 'app.controller.ts'), appControllerTs);

  // Create app.service.ts
  const appServiceTs = `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World! This is a NestJS Multitenant Application.';
  }
}`;

  await fs.writeFile(path.join(projectPath, 'src', 'app.service.ts'), appServiceTs);
}

async function installProjectDependencies(projectPath: string, template: string): Promise<void> {
  console.log(chalk.cyan('Installing dependencies...'));

  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);

  // Add template-specific dependencies
  const templateConfig = TEMPLATES[template as keyof typeof TEMPLATES];
  
  // Get latest versions (in a real implementation, you'd fetch from npm registry)
  const latestVersions: Record<string, string> = {
    '@angelitosystems/nestjs-multitenant-core': '^1.0.0',
    '@nestjs/common': '^10.0.0',
    '@nestjs/core': '^10.0.0',
    '@nestjs/platform-express': '^10.0.0',
    '@nestjs/config': '^3.0.0',
    '@nestjs/cache-manager': '^2.0.0',
    '@nestjs/throttler': '^5.0.0',
    '@nestjs/swagger': '^7.0.0',
    '@nestjs/mapped-types': '^2.0.0',
    '@nestjs/jwt': '^10.0.0',
    '@nestjs/passport': '^10.0.0',
    '@nestjs/schedule': '^4.0.0',
    '@nestjs/bull': '^10.0.0',
    '@nestjs/terminus': '^10.0.0',
    '@nestjs/event-emitter': '^2.0.0',
    'class-validator': '^0.14.0',
    'class-transformer': '^0.5.0',
    'cache-manager': '^5.0.0',
    'cache-manager-redis-store': '^3.0.0',
    'passport': '^0.6.0',
    'passport-jwt': '^4.0.0',
    'passport-local': '^1.0.0',
    'bcrypt': '^5.0.0',
    'helmet': '^7.0.0',
    'compression': '^1.7.0',
    'express-rate-limit': '^6.0.0',
    'bull': '^4.0.0',
    'redis': '^4.0.0',
    'reflect-metadata': '^0.1.13',
    'rxjs': '^7.8.0',
  };

  // Add dependencies
  for (const dep of templateConfig.dependencies) {
    packageJson.dependencies[dep] = latestVersions[dep] || 'latest';
  }

  // Add dev dependencies
  for (const dep of templateConfig.devDependencies) {
    packageJson.devDependencies[dep] = latestVersions[dep] || 'latest';
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  // Install dependencies
  try {
    const packageManager = await detectPackageManager(projectPath);
    console.log(chalk.cyan(`Installing with ${packageManager}...`));
    
    execSync(`${packageManager} install`, {
      cwd: projectPath,
      stdio: 'inherit',
    });
    
    console.log(chalk.green('✅ Dependencies installed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to install dependencies:'), error);
    console.log(chalk.yellow('You can install them manually by running:'));
    console.log(chalk.cyan('  cd ' + path.basename(projectPath)));
    console.log(chalk.cyan('  npm install'));
  }
}

async function detectPackageManager(projectPath: string): Promise<string> {
  if (await fs.pathExists(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (await fs.pathExists(path.join(projectPath, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function showProjectCreatedMessage(answers: CreateAnswers): void {
  console.log(chalk.green.bold('\n🎉 Project created successfully!\n'));
  
  console.log(chalk.blue('Next steps:'));
  console.log(chalk.cyan(`  cd ${answers.projectName}`));
  
  if (!answers.installDependencies) {
    console.log(chalk.cyan('  npm install'));
  }
  
  console.log(chalk.cyan('  npm run start:dev'));
  
  console.log(chalk.blue('\nMultitenancy commands:'));
  console.log(chalk.cyan('  angelito-multitenant add-tenant    # Add a new tenant'));
  console.log(chalk.cyan('  angelito-multitenant list-tenants  # List all tenants'));
  console.log(chalk.cyan('  angelito-multitenant validate      # Validate configuration'));
  
  console.log(chalk.blue('\nTemplate used:'), chalk.yellow(TEMPLATES[answers.template].name));
  console.log(chalk.blue('Database:'), chalk.yellow(`${answers.driver} (${answers.strategy})`));
  console.log(chalk.blue('Tenant identification:'), chalk.yellow(`${answers.identifierType} (${answers.identifierKey})`));
  
  console.log(chalk.green('\nHappy coding! 🚀\n'));
}