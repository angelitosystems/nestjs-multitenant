// Export main CLI functionality
export { initCommand } from './commands/init.command';
export { addTenantCommand } from './commands/add-tenant.command';
export { listTenantsCommand } from './commands/list-tenants.command';
export { validateProjectCommand } from './commands/validate-project.command';

// Export utilities
export { ProjectValidator } from './utils/project-validator';
export { ConfigGenerator } from './utils/config-generator';
export { DatabaseManager } from './utils/database-manager';

// Export types
export {
  TenancyDriver,
  TenancyStrategy,
  TenantIdentifierType,
  TenantConfigTemplate,
  TenantInfo,
  ProjectStructure,
} from './types/config.types';