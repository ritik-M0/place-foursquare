import {
  IsString,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({
    description: "The user's message or query",
    example: 'Find me coffee shops near Times Square',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  message: string;

  @ApiPropertyOptional({
    description:
      'Session ID for conversation continuity. If not provided, a new session will be created.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID(4, { message: 'Session ID must be a valid UUID v4' })
  sessionId?: string;

  @ApiPropertyOptional({
    description: "User's current location for location-aware queries",
    example: { latitude: 40.758, longitude: -73.9855 },
  })
  @IsOptional()
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}
