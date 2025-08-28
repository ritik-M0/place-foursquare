import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

// Zod schemas for structured output
export const OrchestratorQuerySchema = z.object({
  query: z.string().describe('The user query to process'),
  maxSteps: z.number().min(1).max(20).optional().describe('Maximum number of execution steps'),
  includeRawData: z.boolean().optional().describe('Whether to include raw tool outputs'),
});

export const OrchestratorResponseSchema = z.object({
  summary: z.string().describe('Human-readable summary of findings'),
  rawData: z.any().optional().describe('Raw data from tool executions'),
  executionPlan: z.array(z.string()).describe('Steps taken to fulfill the query'),
  confidence: z.number().min(0).max(1).describe('Confidence score for the response'),
  sources: z.array(z.string()).describe('Data sources used'),
  // Support for structured agent response format
  data: z.object({
    summary: z.object({
      queryType: z.string().optional(),
      extractedEntities: z.any().optional(),
      analysis: z.object({
        text: z.string(),
        confidence: z.number(),
      }).optional(),
    }).optional(),
    mapData: z.object({
      type: z.literal('FeatureCollection'),
      features: z.array(z.any()),
      bounds: z.any().optional(),
      center: z.any().optional(),
    }).optional(),
  }).optional(),
  metadata: z.any().optional(),
});

export const OrchestratorStreamingResponseSchema = z.object({
  type: z.enum(['progress', 'data', 'summary', 'complete']).describe('Type of streaming update'),
  content: z.any().describe('Content of the streaming update'),
  step: z.number().optional().describe('Current step number'),
  totalSteps: z.number().optional().describe('Total number of steps'),
});

// DTO Classes for API validation
export class OrchestratorQueryDto {
  @ApiProperty({
    description: 'Natural language query for location intelligence',
    example: 'Find popular restaurants in Manhattan and tell me about foot traffic',
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Maximum number of execution steps',
    minimum: 1,
    maximum: 20,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxSteps?: number = 10;

  @ApiPropertyOptional({
    description: 'Include raw data from tool executions in response',
    default: false,
  })
  @IsOptional()
  includeRawData?: boolean = false;

  @ApiPropertyOptional({
    description: 'Session ID for conversation context',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class OrchestratorResponseDto {
  @ApiProperty({
    description: 'Human-readable summary of findings',
    example: 'Found 15 popular restaurants in Manhattan. Most have high foot traffic during lunch hours...',
  })
  summary: string;

  @ApiPropertyOptional({
    description: 'Raw data from tool executions',
  })
  rawData?: any;

  @ApiProperty({
    description: 'Execution plan steps taken',
    example: ['Search for restaurants in Manhattan', 'Get foot traffic data', 'Analyze patterns'],
  })
  executionPlan: string[];

  @ApiProperty({
    description: 'Confidence score for the response',
    minimum: 0,
    maximum: 1,
    example: 0.85,
  })
  confidence: number;

  @ApiProperty({
    description: 'Data sources used in the response',
    example: ['TomTom Places API', 'BestTime.app', 'Google Places'],
  })
  sources: string[];

  @ApiPropertyOptional({
    description: 'Structured agent response data',
  })
  data?: {
    summary?: {
      queryType?: string;
      extractedEntities?: any;
      analysis?: {
        text: string;
        confidence: number;
      };
    };
    mapData?: {
      type: 'FeatureCollection';
      features: any[];
      bounds?: any;
      center?: any;
    };
  };

  @ApiPropertyOptional({
    description: 'Response metadata',
  })
  metadata?: any;
}

export class OrchestratorStreamingResponseDto {
  @ApiProperty({
    description: 'Type of streaming update',
    enum: ['progress', 'data', 'summary', 'complete'],
  })
  type: 'progress' | 'data' | 'summary' | 'complete';

  @ApiProperty({
    description: 'Content of the streaming update',
  })
  content: any;

  @ApiPropertyOptional({
    description: 'Current step number',
  })
  step?: number;

  @ApiPropertyOptional({
    description: 'Total number of steps',
  })
  totalSteps?: number;
}
