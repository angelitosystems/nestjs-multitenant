import { Module, MiddlewareConsumer } from '@nestjs/common';
import { TenancyModule } from '@angelitosystems/nestjs-multitenant-core';
import tenantConfig from './config/tenant';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // Initialize multitenancy
    TenancyModule.forRoot(tenantConfig),
    
    // Your application modules
    UserModule,
    ProductModule,
    DashboardModule,
  ],
})
export class AppModule {
  // The TenancyModule automatically configures the tenant detection middleware
  // No additional configuration needed!
}