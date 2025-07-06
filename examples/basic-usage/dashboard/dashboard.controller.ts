import { Controller, Get } from '@nestjs/common';
import {
  InjectTenantContext,
  InjectTenantInfo,
  TenantContext,
  TenantConnectionInfo,
} from '@angelitosystems/nestjs-multitenant-core';

@Controller('dashboard')
export class DashboardController {
  @Get('stats')
  async getStats(@InjectTenantContext() context: TenantContext) {
    const { tenantInfo, connection } = context;
    
    console.log(`Getting stats for tenant: ${tenantInfo.id}`);
    
    // Example: Get statistics from tenant database
    // const userCount = await connection.getRepository('User').count();
    // const productCount = await connection.getRepository('Product').count();
    
    return {
      tenant: {
        id: tenantInfo.id,
        name: tenantInfo.name,
        host: tenantInfo.host,
        database: tenantInfo.database,
      },
      statistics: {
        users: 0, // Your actual user count would go here
        products: 0, // Your actual product count would go here
        lastUpdated: new Date(),
      },
      message: 'Statistics retrieved successfully',
    };
  }

  @Get('tenant-info')
  async getTenantInfo(@InjectTenantInfo() tenantInfo: TenantConnectionInfo) {
    // Return safe tenant information (without sensitive data)
    return {
      id: tenantInfo.id,
      name: tenantInfo.name,
      isActive: tenantInfo.isActive,
      createdAt: tenantInfo.createdAt,
      metadata: tenantInfo.metadata,
      // Note: We don't return database credentials for security
    };
  }

  @Get('health')
  async getHealth(@InjectTenantContext() context: TenantContext) {
    const { tenantInfo, connection } = context;
    
    console.log(`Health check for tenant: ${tenantInfo.id}`);
    
    try {
      // Example: Test database connection
      // await connection.query('SELECT 1');
      
      return {
        status: 'healthy',
        tenant: tenantInfo.id,
        database: {
          status: 'connected',
          host: tenantInfo.host,
          database: tenantInfo.database,
        },
        timestamp: new Date(),
        message: 'Tenant connection is healthy',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        tenant: tenantInfo.id,
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };
    }
  }

  @Get('analytics')
  async getAnalytics(@InjectTenantContext() context: TenantContext) {
    const { tenantInfo, connection } = context;
    
    console.log(`Getting analytics for tenant: ${tenantInfo.id}`);
    
    // Example: Analytics queries
    // const userGrowth = await connection
    //   .getRepository('User')
    //   .createQueryBuilder('user')
    //   .select('DATE(user.createdAt)', 'date')
    //   .addSelect('COUNT(*)', 'count')
    //   .where('user.createdAt >= :date', { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
    //   .groupBy('DATE(user.createdAt)')
    //   .orderBy('date', 'ASC')
    //   .getRawMany();
    
    return {
      tenant: tenantInfo.id,
      analytics: {
        userGrowth: [], // Your actual user growth data would go here
        activeUsers: 0, // Your actual active user count would go here
        generatedAt: new Date(),
      },
      message: 'Analytics data retrieved successfully',
    };
  }
}