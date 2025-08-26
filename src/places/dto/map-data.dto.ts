import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { z } from 'zod';

// Zod schemas for GeoJSON and map data
export const GeoJSONPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

export const GeoJSONFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: GeoJSONPointSchema,
  properties: z.record(z.any()),
});

export const GeoJSONFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(GeoJSONFeatureSchema),
});

export const MapDataQuerySchema = z.object({
  query: z.string().describe('Query for geospatial data'),
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }).optional().describe('Geographic bounds for the search'),
  center: z.object({
    lat: z.number(),
    lon: z.number(),
  }).optional().describe('Center point for the search'),
  radius: z.number().optional().describe('Search radius in meters'),
  maxResults: z.number().min(1).max(100).optional().describe('Maximum number of results'),
});

export const MapDataResponseSchema = z.object({
  geojson: GeoJSONFeatureCollectionSchema,
  metadata: z.object({
    totalFeatures: z.number(),
    bounds: z.object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    }),
    sources: z.array(z.string()),
    generatedAt: z.string(),
  }),
});

// DTO Classes
export class BoundsDto {
  @ApiProperty({ description: 'Northern boundary latitude' })
  @IsNumber()
  north: number;

  @ApiProperty({ description: 'Southern boundary latitude' })
  @IsNumber()
  south: number;

  @ApiProperty({ description: 'Eastern boundary longitude' })
  @IsNumber()
  east: number;

  @ApiProperty({ description: 'Western boundary longitude' })
  @IsNumber()
  west: number;
}

export class CenterDto {
  @ApiProperty({ description: 'Latitude of center point' })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude of center point' })
  @IsNumber()
  lon: number;
}

export class MapDataQueryDto {
  @ApiProperty({
    description: 'Natural language query for geospatial data',
    example: 'Show me all coffee shops in downtown Seattle',
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Geographic bounds for the search',
    type: BoundsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BoundsDto)
  bounds?: BoundsDto;

  @ApiPropertyOptional({
    description: 'Center point for the search',
    type: CenterDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CenterDto)
  center?: CenterDto;

  @ApiPropertyOptional({
    description: 'Search radius in meters',
    minimum: 100,
    maximum: 50000,
    default: 5000,
  })
  @IsOptional()
  @IsNumber()
  radius?: number = 5000;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  maxResults?: number = 50;

  @ApiPropertyOptional({
    description: 'Session ID for conversation context',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class GeoJSONPoint {
  @ApiProperty({ enum: ['Point'] })
  type: 'Point';

  @ApiProperty({
    description: 'Coordinates as [longitude, latitude]',
    example: [-122.4194, 37.7749],
  })
  @IsArray()
  coordinates: [number, number];
}

export class GeoJSONFeature {
  @ApiProperty({ enum: ['Feature'] })
  type: 'Feature';

  @ApiProperty({ type: GeoJSONPoint })
  geometry: GeoJSONPoint;

  @ApiProperty({
    description: 'Feature properties',
    example: {
      name: 'Blue Bottle Coffee',
      category: 'cafe',
      rating: 4.5,
      address: '66 Mint St, San Francisco, CA',
    },
  })
  properties: Record<string, any>;
}

export class GeoJSONFeatureCollection {
  @ApiProperty({ enum: ['FeatureCollection'] })
  type: 'FeatureCollection';

  @ApiProperty({
    description: 'Array of GeoJSON features',
    type: [GeoJSONFeature],
  })
  features: GeoJSONFeature[];
}

export class MapDataMetadata {
  @ApiProperty({ description: 'Total number of features in the collection' })
  totalFeatures: number;

  @ApiProperty({ description: 'Geographic bounds of the data', type: BoundsDto })
  bounds: BoundsDto;

  @ApiProperty({
    description: 'Data sources used',
    example: ['TomTom Places API', 'Google Places API'],
  })
  sources: string[];

  @ApiProperty({
    description: 'Timestamp when the data was generated',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: string;
}

export class MapDataResponseDto {
  @ApiProperty({
    description: 'GeoJSON FeatureCollection containing the map data',
    type: GeoJSONFeatureCollection,
  })
  geojson: GeoJSONFeatureCollection;

  @ApiProperty({
    description: 'Metadata about the map data',
    type: MapDataMetadata,
  })
  metadata: MapDataMetadata;
}

export class MapDataStreamingResponseDto {
  @ApiProperty({
    description: 'Type of streaming update',
    enum: ['progress', 'feature', 'metadata', 'complete'],
  })
  type: 'progress' | 'feature' | 'metadata' | 'complete';

  @ApiProperty({
    description: 'Content of the streaming update',
  })
  content: any;

  @ApiPropertyOptional({
    description: 'Current progress percentage',
    minimum: 0,
    maximum: 100,
  })
  progress?: number;
}
