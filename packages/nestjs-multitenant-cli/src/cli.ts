#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.command';
import { createCommand } from './commands/create.command';
import { addTenantCommand } from './commands/add-tenant.command';
import { listTenantsCommand } from './commands/list-tenants.command';
import { validateProjectCommand } from './commands/validate-project.command';

const program = new Command();

program
  .name('angelito-multitenant')
  .description('CLI tool for NestJS multitenancy configuration')
  .version('1.0.0');

// Create command - create new project with template
program
  .command('create [name]')
  .description('Create a new NestJS multitenant project')
  .option('-t, --template <template>', 'Template to use (basic, intermediate, advanced)')
  .option('-d, --directory <directory>', 'Directory to create project in')
  .option('--no-interactive', 'Skip interactive prompts')
  .action(createCommand);

// Init command - configure existing project
program
  .command('init')
  .description('Initialize multitenancy configuration in an existing NestJS project')
  .option('-f, --force', 'Overwrite existing configuration')
  .option('-d, --driver <driver>', 'Database driver (mysql, postgresql, mongodb)')
  .option('-s, --strategy <strategy>', 'Tenancy strategy (database_per_tenant, schema_per_tenant, shared_database)')
  .option('--no-interactive', 'Skip interactive prompts')
  .action(initCommand);

// Add tenant command
program
  .command('add-tenant')
  .description('Add a new tenant to the central database')
  .option('-i, --id <id>', 'Tenant ID')
  .option('-n, --name <name>', 'Tenant name')
  .option('-h, --host <host>', 'Database host')
  .option('-p, --port <port>', 'Database port')
  .option('-u, --username <username>', 'Database username')
  .option('-w, --password <password>', 'Database password')
  .option('-d, --database <database>', 'Database name')
  .option('-s, --schema <schema>', 'Database schema (for PostgreSQL)')
  .option('--no-interactive', 'Skip interactive prompts')
  .action(addTenantCommand);

// List tenants command
program
  .command('list-tenants')
  .description('List all tenants from the central database')
  .option('-a, --all', 'Show all tenants including inactive ones')
  .option('--json', 'Output in JSON format')
  .action(listTenantsCommand);

// Validate project command
program
  .command('validate')
  .description('Validate NestJS project and multitenancy configuration')
  .action(validateProjectCommand);

// Help command
program
  .command('help')
  .description('Display help information')
  .action(() => {
    console.log(chalk.blue.bold('\n🏢 NestJS Multitenant CLI\n'));
    console.log(chalk.yellow('Available commands:'));
    console.log('  create         Create a new NestJS multitenant project');
    console.log('  init           Configure multitenancy in existing project');
    console.log('  add-tenant     Add a new tenant');
    console.log('  list-tenants   List all tenants');
    console.log('  validate       Validate project configuration');
    console.log('  help           Show this help message');
    console.log('\n' + chalk.yellow('Templates available:'));
    console.log('  basic          Simple multitenancy setup');
    console.log('  intermediate   Advanced features with caching and validation');
    console.log('  advanced       Enterprise-ready with security and monitoring');
    console.log('\nFor more information on a specific command, use:');
    console.log(chalk.cyan('  angelito-multitenant <command> --help'));
    console.log('\n' + chalk.yellow('Examples:'));
    console.log(chalk.cyan('  angelito-multitenant create my-app --template basic'));
    console.log(chalk.cyan('  angelito-multitenant init'));
    console.log('');
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s'), program.args.join(' '));
  console.log(chalk.yellow('See --help for a list of available commands.'));
  process.exit(1);
});

// Parse arguments
if (process.argv.length === 2) {
  // No arguments provided, show help
  program.outputHelp();
} else {
  program.parse(process.argv);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});