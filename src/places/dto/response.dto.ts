import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message or data',
    example: 'Operation completed successfully',
  })
  response: string;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-08-13T10:30:00.000Z',
  })
  timestamp: string;
}

export class ChatResponseDto extends ApiResponseDto {
  @ApiProperty({
    description: 'Agent response to the message',
    example: 'I found 5 restaurants near your location...',
  })
  declare response: string;
}

export class SearchResponseDto extends ApiResponseDto {
  @ApiProperty({
    description: 'Original search query',
    example: 'restaurants',
  })
  originalQuery: string;

  @ApiProperty({
    description: 'Natural language message sent to agent',
    example: 'Search for "restaurants" near coordinates 40.7128, -74.0060',
  })
  searchMessage: string;
}

export class HealthResponseDto {
  @ApiProperty({
    description: 'Health status of the service',
    example: 'healthy',
  })
  status: string;

  @ApiProperty({
    description: 'Timestamp of the health check',
    example: '2024-08-13T10:30:00.000Z',
  })
  timestamp: string;
}

export class ExampleCategory {
  @ApiProperty({
    description: 'Category name',
    example: 'Search',
  })
  category: string;

  @ApiProperty({
    description: 'List of example queries',
    example: [
      'Find restaurants near me',
      'Search for coffee shops in New York',
    ],
    type: [String],
  })
  examples: string[];
}

export class ExamplesResponseDto {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'List of example categories',
    type: [ExampleCategory],
  })
  examples: ExampleCategory[];

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-08-13T10:30:00.000Z',
  })
  timestamp: string;
}
