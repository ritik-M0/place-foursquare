import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { ChatService } from './services/chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@Controller('chat')
@ApiTags('Chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @ApiOperation({
    summary: 'Send a chat message',
    description:
      'Process a natural language message through the AI agent system. This endpoint handles all types of location-based queries, weather requests, event searches, and general questions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message processed successfully',
    type: ChatResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid message format or validation errors',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error during message processing',
  })
  async processMessage(
    @Body() messageDto: ChatMessageDto,
  ): Promise<ChatResponseDto> {
    try {
      this.logger.log(
        `Received message: "${messageDto.message}" for session: ${messageDto.sessionId || 'new'}`,
      );

      const response = await this.chatService.processMessage(messageDto);

      this.logger.log(`Successfully processed message ${response.messageId}`);
      return response;
    } catch (error: any) {
      this.logger.error(
        `Failed to process message: ${error.message}`,
        error.stack,
      );

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to process chat message',
          message:
            'An error occurred while processing your message. Please try again.',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Get('session/:sessionId/history')
  // @ApiOperation({
  //   summary: 'Get conversation history',
  //   description: 'Retrieve the conversation history for a specific session.',
  // })
  // @ApiParam({
  //   name: 'sessionId',
  //   description: 'The session ID to retrieve history for',
  //   example: '550e8400-e29b-41d4-a716-446655440000',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Conversation history retrieved successfully',
  //   schema: {
  //     type: 'array',
  //     items: {
  //       type: 'object',
  //       properties: {
  //         id: { type: 'string' },
  //         sessionId: { type: 'string' },
  //         role: { type: 'string', enum: ['user', 'assistant'] },
  //         content: { type: 'string' },
  //         timestamp: { type: 'string', format: 'date-time' },
  //         metadata: { type: 'object' },
  //       },
  //     },
  //   },
  // })
  // async getConversationHistory(@Param('sessionId') sessionId: string) {
  //   try {
  //     this.logger.log(`Retrieving conversation history for session: ${sessionId}`);

  //     const history = await this.chatService.getConversationHistory(sessionId);

  //     this.logger.log(`Retrieved ${history.length} messages for session ${sessionId}`);
  //     return {
  //       sessionId,
  //       messageCount: history.length,
  //       messages: history,
  //     };

  //   } catch (error) {
  //     this.logger.error(`Failed to retrieve conversation history: ${error.message}`, error.stack);

  //     throw new HttpException(
  //       {
  //         status: HttpStatus.INTERNAL_SERVER_ERROR,
  //         error: 'Failed to retrieve conversation history',
  //         message: 'An error occurred while retrieving the conversation history.',
  //         timestamp: new Date().toISOString(),
  //       },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // @Delete('session/:sessionId')
  // @ApiOperation({
  //   summary: 'Clear conversation',
  //   description: 'Clear the conversation history for a specific session.',
  // })
  // @ApiParam({
  //   name: 'sessionId',
  //   description: 'The session ID to clear',
  //   example: '550e8400-e29b-41d4-a716-446655440000',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Conversation cleared successfully',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       sessionId: { type: 'string' },
  //       cleared: { type: 'boolean' },
  //       message: { type: 'string' },
  //     },
  //   },
  // })
  // async clearConversation(@Param('sessionId') sessionId: string) {
  //   try {
  //     this.logger.log(`Clearing conversation for session: ${sessionId}`);

  //     const cleared = await this.chatService.clearConversation(sessionId);

  //     this.logger.log(`Conversation cleared for session ${sessionId}: ${cleared}`);
  //     return {
  //       sessionId,
  //       cleared,
  //       message: cleared
  //         ? 'Conversation cleared successfully'
  //         : 'Session not found or already cleared',
  //     };

  //   } catch (error) {
  //     this.logger.error(`Failed to clear conversation: ${error.message}`, error.stack);

  //     throw new HttpException(
  //       {
  //         status: HttpStatus.INTERNAL_SERVER_ERROR,
  //         error: 'Failed to clear conversation',
  //         message: 'An error occurred while clearing the conversation.',
  //         timestamp: new Date().toISOString(),
  //       },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  @Get('health')
  @ApiOperation({
    summary: 'Get chat service health status',
    description:
      'Check the health status of the chat service and its dependencies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
  })
  async getHealthStatus() {
    try {
      const health = await this.chatService.getHealthStatus();

      return {
        ...health,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);

      return {
        status: 'unhealthy',
        mastraIntegration: false,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
