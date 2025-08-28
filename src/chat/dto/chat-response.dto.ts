import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({
    description: 'Unique identifier for this response',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  messageId: string;

  @ApiProperty({
    description: 'Session ID for conversation continuity',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  sessionId: string;

  @ApiProperty({
    description: 'AI-generated response text',
    example:
      'I found 5 coffee shops near Times Square. Here are the top recommendations...',
  })
  text: string;

  @ApiPropertyOptional({
    description: 'GeoJSON data for map visualization',
  })
  mapData?: any; // Will be GeoJSON FeatureCollection

  @ApiPropertyOptional({
    description: 'Additional attachments like photos or links',
  })
  attachments?: any[];

  @ApiProperty({
    description: 'Metadata about the query processing',
  })
  metadata: {
    queryType: string;
    confidence: number;
    processingTime: number;
    dataSource: string[];
    [key: string]: any; // Allow additional metadata properties
  };

  @ApiPropertyOptional({
    description: 'Suggested follow-up actions or queries',
    type: 'array',
    items: { type: 'object' },
  })
  suggestedActions?: Array<{
    type: string;
    label: string;
    action: string;
  }>;
}
