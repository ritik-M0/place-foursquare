import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export enum ResponsePreference {
  AUTO = 'auto',
  TEXT = 'text',
  GEOJSON = 'geojson',
  STREAMING = 'streaming',
  ANALYSIS = 'analysis',
}

export enum ResponseType {
  TEXT = 'text',
  GEOJSON = 'geojson',
  ANALYSIS = 'analysis',
  STREAMING = 'streaming',
}

export class UnifiedChatDto {
  @ApiProperty({
    description: 'The user message/query',
    example: 'Show me coffee shops in SoHo on a map',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Session ID for conversation context',
    example: 'user-123',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Response format preference',
    enum: ResponsePreference,
    default: ResponsePreference.AUTO,
    example: ResponsePreference.AUTO,
  })
  @IsOptional()
  @IsEnum(ResponsePreference)
  responsePreference?: ResponsePreference = ResponsePreference.AUTO;

  @ApiPropertyOptional({
    description: 'Additional context for the query',
    example: { userLocation: { lat: 40.7589, lon: -73.9851 } },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class UnifiedChatResponseDto {
  @ApiProperty({
    description: 'Type of response returned',
    enum: ResponseType,
    example: ResponseType.GEOJSON,
  })
  type: ResponseType;

  @ApiProperty({
    description: 'The response data - format depends on type',
    example: { type: 'FeatureCollection', features: [] },
  })
  data: any;

  @ApiProperty({
    description: 'Execution metadata',
    example: {
      executionTime: 2340,
      agentsUsed: ['orchestratorAgent', 'mapDataAgent'],
      toolsUsed: ['tomtomFuzzySearchTool', 'formatMapDataTool'],
      confidence: 0.95,
    },
  })
  metadata: {
    executionTime: number;
    agentsUsed: string[];
    toolsUsed: string[];
    confidence: number;
    intent?: string;
    detectedEntities?: string[];
  };

  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-08-26T13:52:42.000Z',
  })
  timestamp: string;
}

// Zod schemas for validation

// Unified Chat Input Validation, Used in processUnifiedChat service
export const UnifiedChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().optional(),
  responsePreference: z
    .nativeEnum(ResponsePreference)
    .optional()
    .default(ResponsePreference.AUTO),
  context: z.record(z.any()).optional(),
});

// Unified Chat Output Validation
export const UnifiedChatResponseSchema = z.object({
  type: z.nativeEnum(ResponseType),
  data: z.any(),
  metadata: z.object({
    executionTime: z.number(),
    agentsUsed: z.array(z.string()),
    toolsUsed: z.array(z.string()),
    confidence: z.number(),
    intent: z.string().optional(),
    detectedEntities: z.array(z.string()).optional(),
  }),
  success: z.boolean(),
  timestamp: z.string(),
});
