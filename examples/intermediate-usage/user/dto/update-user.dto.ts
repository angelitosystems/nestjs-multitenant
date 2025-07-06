import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const)
) {
  @ApiPropertyOptional({ 
    description: 'Last login timestamp',
    example: '2023-12-01T10:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  lastLoginAt?: string;

  @ApiPropertyOptional({ 
    description: 'Account verification status'
  })
  @IsOptional()
  isVerified?: boolean;

  @ApiPropertyOptional({ 
    description: 'Account suspension status'
  })
  @IsOptional()
  isSuspended?: boolean;

  @ApiPropertyOptional({ 
    description: 'Reason for suspension'
  })
  @IsOptional()
  suspensionReason?: string;
}