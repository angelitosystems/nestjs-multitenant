import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ 
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit: number = 10;

  @ApiPropertyOptional({ 
    description: 'Calculate and return total count (may impact performance)',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeTotalCount?: boolean = true;
}

export class PaginationMetaDto {
  @ApiPropertyOptional({ description: 'Current page number' })
  page: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  limit: number;

  @ApiPropertyOptional({ description: 'Total number of items' })
  total?: number;

  @ApiPropertyOptional({ description: 'Total number of pages' })
  totalPages?: number;

  @ApiPropertyOptional({ description: 'Whether there is a next page' })
  hasNext?: boolean;

  @ApiPropertyOptional({ description: 'Whether there is a previous page' })
  hasPrevious?: boolean;
}