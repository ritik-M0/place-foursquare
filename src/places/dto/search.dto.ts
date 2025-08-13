import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
  IsDecimal,
  Min,
  Max,
} from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query for places',
    example: 'restaurants',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: '40.7128',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  lat?: string;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: '-74.0060',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  lon?: string;

  @ApiProperty({
    description: 'Maximum number of results to return',
    example: '10',
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiProperty({
    description: 'Search radius in meters',
    example: '1000',
    required: false,
    minimum: 1,
    maximum: 50000,
  })
  @IsOptional()
  @IsNumberString()
  radius?: string;
}

export class SearchPoiDto {
  @ApiProperty({
    description: 'Search query for places',
    example: 'coffee shops',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({
    description: 'Maximum number of results',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
    required: false,
  })
  @IsOptional()
  @IsDecimal()
  lat?: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.006,
    required: false,
  })
  @IsOptional()
  @IsDecimal()
  lon?: number;

  @ApiProperty({
    description: 'Search radius in meters',
    example: 1000,
    required: false,
    minimum: 1,
    maximum: 50000,
  })
  @IsOptional()
  @Min(1)
  @Max(50000)
  radius?: number;
}
