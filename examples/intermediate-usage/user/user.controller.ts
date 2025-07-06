import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  HttpException,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  InjectTenantConnection,
  InjectTenantId,
  InjectTenantContext,
  TenantContext,
} from '@angelitosystems/nestjs-multitenant-core';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';

@Controller('users')
@UseGuards(ThrottlerGuard)
@UseInterceptors(CacheInterceptor)
export class UserController {
  constructor(
    @InjectTenantConnection() private connection: any,
    @InjectTenantId() private tenantId: string,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @InjectTenantContext() context: TenantContext,
  ): Promise<ApiResponse<UserResponseDto>> {
    try {
      console.log(`Creating user for tenant: ${this.tenantId}`);
      
      // Validate business rules
      await this.validateUserCreation(createUserDto);
      
      // Example: Create user in tenant database
      // const repository = this.connection.getRepository('User');
      // const user = repository.create({
      //   ...createUserDto,
      //   tenantId: this.tenantId,
      //   createdAt: new Date(),
      //   updatedAt: new Date(),
      // });
      // const savedUser = await repository.save(user);
      
      const mockUser: UserResponseDto = {
        id: `user-${Date.now()}`,
        email: createUserDto.email,
        name: createUserDto.name,
        isActive: true,
        tenantId: this.tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Log audit trail
      await this.auditService.log({
        action: 'USER_CREATED',
        entityId: mockUser.id,
        entityType: 'User',
        tenantId: this.tenantId,
        userId: 'system', // In real app, get from auth context
        metadata: { email: createUserDto.email },
      });
      
      // Send notification
      await this.notificationService.sendWelcomeEmail({
        email: createUserDto.email,
        name: createUserDto.name,
        tenantId: this.tenantId,
      });
      
      return {
        success: true,
        data: mockUser,
        message: 'User created successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Error creating user for tenant ${this.tenantId}:`, error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create user',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @CacheKey('users_list')
  @CacheTTL(300) // 5 minutes
  async findAll(
    @Query() query: UserQueryDto,
    @Query() pagination: PaginationDto,
  ): Promise<ApiResponse<UserResponseDto[]>> {
    try {
      console.log(`Finding users for tenant: ${this.tenantId}`, { query, pagination });
      
      // Example: Query users with filters and pagination
      // const repository = this.connection.getRepository('User');
      // const queryBuilder = repository.createQueryBuilder('user')
      //   .where('user.tenantId = :tenantId', { tenantId: this.tenantId });
      
      // if (query.search) {
      //   queryBuilder.andWhere(
      //     '(user.name ILIKE :search OR user.email ILIKE :search)',
      //     { search: `%${query.search}%` }
      //   );
      // }
      
      // if (query.isActive !== undefined) {
      //   queryBuilder.andWhere('user.isActive = :isActive', { isActive: query.isActive });
      // }
      
      // const [users, total] = await queryBuilder
      //   .orderBy('user.createdAt', 'DESC')
      //   .skip((pagination.page - 1) * pagination.limit)
      //   .take(pagination.limit)
      //   .getManyAndCount();
      
      const mockUsers: UserResponseDto[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          isActive: true,
          tenantId: this.tenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User Two',
          isActive: true,
          tenantId: this.tenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      return {
        success: true,
        data: mockUsers,
        message: 'Users retrieved successfully',
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: mockUsers.length,
          totalPages: Math.ceil(mockUsers.length / pagination.limit),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Error finding users for tenant ${this.tenantId}:`, error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve users',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @CacheKey('user_detail')
  @CacheTTL(600) // 10 minutes
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<UserResponseDto>> {
    try {
      console.log(`Finding user ${id} for tenant: ${this.tenantId}`);
      
      // Example: Find user by ID
      // const repository = this.connection.getRepository('User');
      // const user = await repository.findOne({
      //   where: { id, tenantId: this.tenantId }
      // });
      
      // if (!user) {
      //   throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      // }
      
      const mockUser: UserResponseDto = {
        id,
        email: 'user@example.com',
        name: 'User Name',
        isActive: true,
        tenantId: this.tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      return {
        success: true,
        data: mockUser,
        message: 'User retrieved successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Error finding user ${id} for tenant ${this.tenantId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve user',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @InjectTenantContext() context: TenantContext,
  ): Promise<ApiResponse<UserResponseDto>> {
    try {
      console.log(`Updating user ${id} for tenant: ${this.tenantId}`);
      
      // Example: Update user
      // const repository = this.connection.getRepository('User');
      // const user = await repository.findOne({
      //   where: { id, tenantId: this.tenantId }
      // });
      
      // if (!user) {
      //   throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      // }
      
      // Object.assign(user, updateUserDto, { updatedAt: new Date() });
      // const updatedUser = await repository.save(user);
      
      const mockUpdatedUser: UserResponseDto = {
        id,
        email: updateUserDto.email || 'user@example.com',
        name: updateUserDto.name || 'Updated User',
        isActive: updateUserDto.isActive ?? true,
        tenantId: this.tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Log audit trail
      await this.auditService.log({
        action: 'USER_UPDATED',
        entityId: id,
        entityType: 'User',
        tenantId: this.tenantId,
        userId: 'system',
        metadata: { changes: updateUserDto },
      });
      
      return {
        success: true,
        data: mockUpdatedUser,
        message: 'User updated successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Error updating user ${id} for tenant ${this.tenantId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update user',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<void>> {
    try {
      console.log(`Removing user ${id} for tenant: ${this.tenantId}`);
      
      // Example: Soft delete user
      // const repository = this.connection.getRepository('User');
      // const result = await repository.update(
      //   { id, tenantId: this.tenantId },
      //   { isActive: false, deletedAt: new Date() }
      // );
      
      // if (result.affected === 0) {
      //   throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      // }
      
      // Log audit trail
      await this.auditService.log({
        action: 'USER_DELETED',
        entityId: id,
        entityType: 'User',
        tenantId: this.tenantId,
        userId: 'system',
        metadata: {},
      });
      
      return {
        success: true,
        data: undefined,
        message: 'User deleted successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Error removing user ${id} for tenant ${this.tenantId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete user',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics/stats')
  @CacheKey('user_analytics')
  @CacheTTL(1800) // 30 minutes
  async getAnalytics(): Promise<ApiResponse<any>> {
    try {
      console.log(`Getting user analytics for tenant: ${this.tenantId}`);
      
      // Example: Get user analytics
      // const repository = this.connection.getRepository('User');
      // const totalUsers = await repository.count({ where: { tenantId: this.tenantId } });
      // const activeUsers = await repository.count({ 
      //   where: { tenantId: this.tenantId, isActive: true } 
      // });
      
      const analytics = {
        totalUsers: 150,
        activeUsers: 142,
        inactiveUsers: 8,
        newUsersThisMonth: 23,
        userGrowthRate: 15.3,
        averageSessionDuration: '24m 15s',
        topUsersByActivity: [
          { name: 'John Doe', email: 'john@example.com', activityScore: 95 },
          { name: 'Jane Smith', email: 'jane@example.com', activityScore: 87 },
        ],
      };
      
      return {
        success: true,
        data: analytics,
        message: 'User analytics retrieved successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Error getting user analytics for tenant ${this.tenantId}:`, error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve user analytics',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async validateUserCreation(createUserDto: CreateUserDto): Promise<void> {
    // Example: Check if email already exists
    // const repository = this.connection.getRepository('User');
    // const existingUser = await repository.findOne({
    //   where: { email: createUserDto.email, tenantId: this.tenantId }
    // });
    
    // if (existingUser) {
    //   throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    // }
    
    console.log('User validation passed for:', createUserDto.email);
  }
}