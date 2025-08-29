import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

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
    description: 'Additional context for the query',
    example: { userLocation: { lat: 40.7589, lon: -73.9851 } },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class UnifiedChatResponseDto {
  @ApiProperty({
    description: 'The orchestrator agent response - can be text, structured data, or both',
    example: {
      type: 'analysis',
      data: {
        summary: { text: 'Found 5 coffee shops in SoHo' },
        mapData: { type: 'FeatureCollection', features: [] }
      }
    },
  })
  response: any;

  @ApiProperty({
    description: 'Simple execution metadata',
    example: {
      executionTime: 2340,
      agent: 'orchestratorAgent'
    },
  })
  metadata: {
    executionTime: number;
    agent: string;
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

// Simplified Chat Input Validation
export const UnifiedChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().optional(),
  context: z.record(z.any()).optional(),
});

// Simplified Chat Output Validation
export const UnifiedChatResponseSchema = z.object({
  response: z.any(), // Whatever the orchestrator agent returns
  metadata: z.object({
    executionTime: z.number(),
    agent: z.string(),
  }),
  success: z.boolean(),
  timestamp: z.string(),
});
