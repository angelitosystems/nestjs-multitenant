import chalk from 'chalk';
import { TenantInfo } from '../types/config.types';
import { DatabaseManager } from '../utils/database-manager';
import { ProjectValidator } from '../utils/project-validator';
import * as fs from 'fs-extra';
import * as path from 'path';

interface ListTenantsOptions {
  all?: boolean;
  json?: boolean;
}

export async function listTenantsCommand(options: ListTenantsOptions): Promise<void> {
  try {
    console.log(chalk.blue.bold('\n🏢 Tenant List\n'));

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
    
    // Get tenants from database
    const dbManager = new DatabaseManager(tenantConfig);
    const tenants = await dbManager.getAllTenants(options.all);
    
    if (tenants.length === 0) {
      console.log(chalk.yellow('No tenants found.'));
      console.log(chalk.blue('\nAdd a tenant with: angelito-multitenant add-tenant'));
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(tenants, null, 2));
      return;
    }

    // Display tenants in table format
    displayTenantsTable(tenants, options.all || false);
    
    // Show summary
    showSummary(tenants);

  } catch (error) {
    console.error(chalk.red('❌ Failed to list tenants:'), error);
    process.exit(1);
  }
}

async function loadTenantConfig(): Promise<any> {
  const configPath = path.join(process.cwd(), 'config', 'tenant.ts');
  
  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    
    // Extract configuration values using regex (basic parsing)
    const driverMatch = configContent.match(/driver:\s*TenancyDriver\.([A-Z_]+)/);
    const driver = driverMatch?.[1]?.toLowerCase() || 'postgresql';
    
    // Extract central DB config
    const hostMatch = configContent.match(/host:\s*.*?['"](.*?)['"]/);
    const portMatch = configContent.match(/port:\s*.*?(\d+)/);
    const usernameMatch = configContent.match(/username:\s*.*?['"](.*?)['"]/);
    const passwordMatch = configContent.match(/password:\s*.*?['"](.*?)['"]/);
    const databaseMatch = configContent.match(/database:\s*.*?['"](.*?)['"]/);
    
    return {
      driver,
      centralDb: {
        host: hostMatch ? hostMatch[1] : 'localhost',
        port: portMatch ? parseInt(portMatch[1]!) : 5432,
        username: usernameMatch ? usernameMatch[1] : 'root',
        password: passwordMatch ? passwordMatch[1] : '',
        database: databaseMatch ? databaseMatch[1] : 'central_tenants',
      },
    };
  } catch (error) {
    throw new Error(`Failed to load tenant configuration: ${error}`);
  }
}

function displayTenantsTable(tenants: TenantInfo[], showAll: boolean): void {
  console.log(chalk.blue('📋 Tenants:'));
  console.log('');
  
  // Table headers
  const headers = ['ID', 'Name', 'Host:Port', 'Database', 'Status', 'Created'];
  const columnWidths = [20, 25, 20, 15, 10, 12];
  
  // Print headers
  let headerRow = '';
  headers.forEach((header, index) => {
    headerRow += header.padEnd(columnWidths[index] || 0);
  });
  console.log(chalk.bold.blue(headerRow));
  console.log(chalk.blue('─'.repeat(headerRow.length)));
  
  // Print tenant rows
  tenants.forEach(tenant => {
    const row = [
      tenant.id.substring(0, 18),
      tenant.name.substring(0, 23),
      `${tenant.host}:${tenant.port}`.substring(0, 18),
      tenant.database.substring(0, 13),
      tenant.isActive ? 'Active' : 'Inactive',
      formatDate(tenant.createdAt),
    ];
    
    let rowString = '';
    row.forEach((cell, index) => {
      const paddedCell = cell.padEnd(columnWidths[index] || 0);
      
      if (index === 4) { // Status column
        rowString += tenant.isActive 
          ? chalk.green(paddedCell)
          : chalk.red(paddedCell);
      } else {
        rowString += paddedCell;
      }
    });
    
    console.log(rowString);
  });
  
  console.log('');
}

function showSummary(tenants: TenantInfo[]): void {
  const activeTenants = tenants.filter(t => t.isActive).length;
  const inactiveTenants = tenants.filter(t => !t.isActive).length;
  
  console.log(chalk.blue('📊 Summary:'));
  console.log(`  Total tenants: ${chalk.cyan(tenants.length)}`);
  console.log(`  Active: ${chalk.green(activeTenants)}`);
  
  if (inactiveTenants > 0) {
    console.log(`  Inactive: ${chalk.red(inactiveTenants)}`);
  }
  
  // Group by host
  const hostGroups = tenants.reduce((groups, tenant) => {
    const host = tenant.host;
    if (!groups[host]) {
      groups[host] = 0;
    }
    groups[host]++;
    return groups;
  }, {} as Record<string, number>);
  
  if (Object.keys(hostGroups).length > 1) {
    console.log('\n  Tenants by host:');
    Object.entries(hostGroups).forEach(([host, count]) => {
      console.log(`    ${host}: ${chalk.cyan(count)}`);
    });
  }
  
  console.log('');
  console.log(chalk.blue('💡 Commands:'));
  console.log('  Add tenant:    angelito-multitenant add-tenant');
  console.log('  Show all:      angelito-multitenant list-tenants --all');
  console.log('  JSON output:   angelito-multitenant list-tenants --json');
  console.log('');
}

function formatDate(date: Date): string {
  if (!date) return 'Unknown';
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months}mo ago`;
  }
}