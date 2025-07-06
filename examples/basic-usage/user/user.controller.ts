import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { InjectTenantConnection, InjectTenantId } from '@angelitosystems/nestjs-multitenant-core';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(
    @InjectTenantConnection() private connection: any,
    @InjectTenantId() private tenantId: string,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    console.log(`Creating user for tenant: ${this.tenantId}`);
    
    // Example: Using the connection to create a new user
    // const repository = this.connection.getRepository('User');
    // const user = repository.create(createUserDto);
    // return repository.save(user);
    
    return {
      message: `User created for tenant ${this.tenantId}`,
      tenantId: this.tenantId,
      userData: createUserDto,
    };
  }

  @Get()
  async findAll() {
    // Use the tenant-specific database connection
    // This connection is automatically configured for the current tenant
    console.log(`Finding all users for tenant: ${this.tenantId}`);
    
    // Example: Using the connection to query users
    // const repository = this.connection.getRepository('User');
    // return repository.find();
    
    return {
      message: `Users for tenant ${this.tenantId}`,
      tenantId: this.tenantId,
      users: [], // Your actual user data would go here
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log(`Finding user ${id} for tenant: ${this.tenantId}`);
    
    // Example: Using the connection to find a specific user
    // const repository = this.connection.getRepository('User');
    // return repository.findOne({ where: { id } });
    
    return {
      message: `User ${id} for tenant ${this.tenantId}`,
      tenantId: this.tenantId,
      userId: id,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    console.log(`Updating user ${id} for tenant: ${this.tenantId}`);
    
    // Example: Using the connection to update a user
    // const repository = this.connection.getRepository('User');
    // return repository.update({ id }, updateUserDto);
    
    return {
      message: `User ${id} updated for tenant ${this.tenantId}`,
      tenantId: this.tenantId,
      userId: id,
      updateData: updateUserDto,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    console.log(`Removing user ${id} for tenant: ${this.tenantId}`);
    
    // Example: Using the connection to delete a user
    // const repository = this.connection.getRepository('User');
    // return repository.delete({ id });
    
    return {
      message: `User ${id} removed for tenant ${this.tenantId}`,
      tenantId: this.tenantId,
      userId: id,
    };
  }

  @Get('stats/count')
  async getUserCount() {
    const repository = this.connection.getRepository(User);
    const count = await repository.count();
    
    return { count };
  }

  @Get('search/:term')
  async search(@Param('term') term: string) {
    const repository = this.connection.getRepository(User);
    
    return repository
      .createQueryBuilder('user')
      .where('user.name ILIKE :term OR user.email ILIKE :term', {
        term: `%${term}%`,
      })
      .getMany();
  }
}