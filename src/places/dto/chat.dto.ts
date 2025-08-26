// Swagger decorator for API documentation
import { ApiProperty } from '@nestjs/swagger';
// Class-validator decorators for input validation
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * ChatDto - Data Transfer Object for legacy chat endpoints
 * 
 * This DTO defines the structure for requests to the original chat endpoints:
 * - POST /api/places/chat (non-streaming)
 * - POST /api/places/chat/stream (streaming with SSE)
 * 
 * Validation Rules:
 * - message: Required, non-empty string with minimum length of 1
 * - sessionId: Optional string for maintaining conversation context
 * 
 * Used by:
 * - PlacesController.chatWithAgent()
 * - PlacesController.chatWithAgentStream()
 */
export class ChatDto {
  @ApiProperty({
    description: 'Natural language message to send to the location intelligence agent',
    example: 'Find restaurants near me',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Message cannot be empty' })
  message: string;

  @ApiProperty({
    description: 'Optional session ID for conversation context - helps maintain state across requests',
    example: 'session-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
