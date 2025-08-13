import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ChatDto {
  @ApiProperty({
    description: 'Message to send to the TomTom agent',
    example: 'Find restaurants near me',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Message cannot be empty' })
  message: string;

  @ApiProperty({
    description: 'Optional session ID for conversation context',
    example: 'session-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
