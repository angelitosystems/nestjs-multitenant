import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectStructure } from '../types/config.types';

export class ProjectValidator {
  private readonly projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async validateNestJSProject(): Promise<boolean> {
    const structure = await this.analyzeProjectStructure();
    return structure.isNestJS;
  }

  async hasMultitenantCore(): Promise<boolean> {
    const dependencies = await this.checkDependencies();
    return dependencies.coreInstalled;
  }

  async analyzeProjectStructure(): Promise<ProjectStructure> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const nestCliPath = path.join(this.projectRoot, 'nest-cli.json');
    const appModulePath = this.findAppModule();

    const hasPackageJson = await fs.pathExists(packageJsonPath);
    const hasNestCLI = await fs.pathExists(nestCliPath);
    const hasAppModule = appModulePath !== null;

    let nestVersion: string | undefined;
    let packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm';

    if (hasPackageJson) {
      try {
        const packageJson = await fs.readJson(packageJsonPath);
        
        // Check for NestJS dependencies
        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        nestVersion = dependencies['@nestjs/core'] || dependencies['@nestjs/common'];
        
        // Detect package manager
        packageManager = await this.detectPackageManager();
      } catch (error) {
        // Ignore JSON parsing errors
      }
    }

    const isNestJS = hasPackageJson && (hasNestCLI || hasAppModule || !!nestVersion);

    return {
      isNestJS,
      hasPackageJson,
      hasNestCLI,
      hasAppModule,
      packageManager,
      nestVersion,
    };
  }

  private async detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
    const yarnLockExists = await fs.pathExists(path.join(this.projectRoot, 'yarn.lock'));
    const pnpmLockExists = await fs.pathExists(path.join(this.projectRoot, 'pnpm-lock.yaml'));
    
    if (pnpmLockExists) return 'pnpm';
    if (yarnLockExists) return 'yarn';
    return 'npm';
  }

  private findAppModule(): string | null {
    const possiblePaths = [
      'src/app.module.ts',
      'src/app.module.js',
      'app.module.ts',
      'app.module.js',
    ];

    for (const relativePath of possiblePaths) {
      const fullPath = path.join(this.projectRoot, relativePath);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    return null;
  }

  async validateConfigDirectory(): Promise<boolean> {
    const configDir = path.join(this.projectRoot, 'config');
    return await fs.pathExists(configDir);
  }

  async validateTenantConfig(): Promise<{
    exists: boolean;
    isValid: boolean;
    errors: string[];
  }> {
    const configPath = path.join(this.projectRoot, 'config', 'tenant.ts');
    const exists = await fs.pathExists(configPath);
    
    if (!exists) {
      return {
        exists: false,
        isValid: false,
        errors: ['Tenant configuration file does not exist'],
      };
    }

    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const errors = this.validateConfigContent(configContent);
      
      return {
        exists: true,
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        exists: true,
        isValid: false,
        errors: [`Failed to read config file: ${error}`],
      };
    }
  }

  private validateConfigContent(content: string): string[] {
    const errors: string[] = [];

    // Check for required imports
    if (!content.includes('TenancyStrategy') || !content.includes('TenancyDriver')) {
      errors.push('Missing required imports from @angelitosystems/nestjs-multitenant-core');
    }

    // Check for export default
    if (!content.includes('export default')) {
      errors.push('Configuration must have a default export');
    }

    // Check for required properties
    const requiredProperties = ['driver', 'strategy', 'centralDb', 'tenantIdentifier'];
    for (const prop of requiredProperties) {
      if (!content.includes(prop)) {
        errors.push(`Missing required property: ${prop}`);
      }
    }

    return errors;
  }

  async checkDependencies(): Promise<{
    coreInstalled: boolean;
    coreVersion?: string;
    missingDependencies: string[];
  }> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!await fs.pathExists(packageJsonPath)) {
      return {
        coreInstalled: false,
        missingDependencies: ['package.json not found'],
      };
    }

    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const coreInstalled = !!dependencies['@angelitosystems/nestjs-multitenant-core'];
      const coreVersion = dependencies['@angelitosystems/nestjs-multitenant-core'];

      const requiredDependencies = [
        '@nestjs/common',
        '@nestjs/core',
        'reflect-metadata',
        'rxjs',
      ];

      const missingDependencies = requiredDependencies.filter(
        dep => !dependencies[dep]
      );

      return {
        coreInstalled,
        coreVersion,
        missingDependencies,
      };
    } catch (error) {
      return {
        coreInstalled: false,
        missingDependencies: [`Failed to read package.json: ${error}`],
      };
    }
  }

  async getProjectInfo(): Promise<{
    name: string;
    version: string;
    description?: string;
  }> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    try {
      const packageJson = await fs.readJson(packageJsonPath);
      return {
        name: packageJson.name || 'Unknown',
        version: packageJson.version || '0.0.0',
        description: packageJson.description,
      };
    } catch (error) {
      return {
        name: 'Unknown',
        version: '0.0.0',
      };
    }
  }
}