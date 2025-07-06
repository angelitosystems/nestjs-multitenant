import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPreferencesDto {
  @ApiPropertyOptional({ description: 'User language preference' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'User timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Email notifications enabled' })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'SMS notifications enabled' })
  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;
}

export class CreateUserDto {
  @ApiProperty({ 
    description: 'User email address',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase())
  email: string;

  @ApiProperty({ 
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ 
    description: 'User phone number',
    example: '+1234567890'
  })
  @IsOptional()
  @IsPhoneNumber(null, { message: 'Please provide a valid phone number' })
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'User biography or description',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;

  @ApiPropertyOptional({ 
    description: 'User active status',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'User role within the tenant',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  @Matches(/^(admin|user|manager|viewer)$/, {
    message: 'Role must be one of: admin, user, manager, viewer'
  })
  role?: string;

  @ApiPropertyOptional({ 
    description: 'User department',
    example: 'Engineering'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Department cannot exceed 100 characters' })
  department?: string;

  @ApiPropertyOptional({ 
    description: 'User job title',
    example: 'Software Engineer'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Job title cannot exceed 100 characters' })
  jobTitle?: string;

  @ApiPropertyOptional({ 
    description: 'User preferences',
    type: UserPreferencesDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: UserPreferencesDto;

  @ApiPropertyOptional({ 
    description: 'Additional user metadata',
    example: { customField1: 'value1', customField2: 'value2' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg'
  })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'Avatar must be a valid URL' })
  avatarUrl?: string;

  @ApiPropertyOptional({ 
    description: 'User date of birth',
    example: '1990-01-01'
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { 
    message: 'Date of birth must be in YYYY-MM-DD format' 
  })
  dateOfBirth?: string;

  @ApiPropertyOptional({ 
    description: 'User address',
    example: '123 Main St, City, Country'
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Address cannot exceed 200 characters' })
  address?: string;
}