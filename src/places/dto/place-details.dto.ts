import { ApiProperty } from '@nestjs/swagger';

export class PlaceDetailsDto {
  @ApiProperty({
    description: 'Entity ID of the place',
    example: 'entity-id-123',
  })
  entityId: string;

  @ApiProperty({
    description: 'Language for the response',
    example: 'en-US',
    required: false,
  })
  language?: string;

  @ApiProperty({
    description: 'Include opening hours information',
    example: true,
    required: false,
  })
  openingHours?: boolean;

  @ApiProperty({
    description: 'Include time zone information',
    example: true,
    required: false,
  })
  timeZone?: boolean;

  @ApiProperty({
    description: 'Include mapcode information',
    example: false,
    required: false,
  })
  mapcodes?: boolean;

  @ApiProperty({
    description: 'Include related points of interest',
    example: true,
    required: false,
  })
  relatedPois?: boolean;

  @ApiProperty({
    description: 'View type for the response',
    example: 'Unified',
    enum: ['Unified', 'US'],
    required: false,
  })
  view?: 'Unified' | 'US';
}
