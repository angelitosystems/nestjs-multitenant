import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserPreferencesDto } from './create-user.dto';

export class UserResponseDto {
  @ApiProperty({ description: 'User unique identifier' })
  id: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User full name' })
  name: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'User biography' })
  bio?: string;

  @ApiProperty({ description: 'User active status' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'User role' })
  role?: string;

  @ApiPropertyOptional({ description: 'User department' })
  department?: string;

  @ApiPropertyOptional({ description: 'User job title' })
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'User preferences' })
  preferences?: UserPreferencesDto;

  @ApiPropertyOptional({ description: 'User metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'User date of birth' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'User address' })
  address?: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  lastLoginAt?: Date;

  @ApiPropertyOptional({ description: 'Account verification status' })
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Account suspension status' })
  isSuspended?: boolean;

  @ApiPropertyOptional({ description: 'Suspension reason' })
  suspensionReason?: string;
}