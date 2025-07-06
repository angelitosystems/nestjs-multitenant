import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsDateString,
  Transform,
} from 'class-validator';

export enum UserSortBy {
  NAME = 'name',
  EMAIL = 'email',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_LOGIN = 'lastLoginAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class UserQueryDto {
  @ApiPropertyOptional({ 
    description: 'Search term for name or email',
    example: 'john'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by active status'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by verification status'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by suspension status'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isSuspended?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by role',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by department',
    example: 'Engineering'
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by creation date (from)',
    example: '2023-01-01'
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by creation date (to)',
    example: '2023-12-31'
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by last login date (from)',
    example: '2023-01-01'
  })
  @IsOptional()
  @IsDateString()
  lastLoginFrom?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by last login date (to)',
    example: '2023-12-31'
  })
  @IsOptional()
  @IsDateString()
  lastLoginTo?: string;

  @ApiPropertyOptional({ 
    description: 'Sort field',
    enum: UserSortBy,
    default: UserSortBy.CREATED_AT
  })
  @IsOptional()
  @IsEnum(UserSortBy)
  sortBy?: UserSortBy = UserSortBy.CREATED_AT;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ 
    description: 'Include inactive users in results'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  includeInactive?: boolean = false;
}