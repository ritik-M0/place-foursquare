import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MastraIntegrationService } from './mastra-integration.service';
// import { SessionService } from './session.service';
import { ResponseFormatterService } from './response-formatter.service';
import { ChatMessageDto } from '../dto/chat-message.dto';
import { ChatResponseDto } from '../dto/chat-response.dto';
// import { ChatMessage } from '../interfaces/chat.interfaces';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly mastraIntegration: MastraIntegrationService,
    // private readonly sessionService: SessionService,
    private readonly responseFormatter: ResponseFormatterService,
  ) {}

  /**
   * Process a chat message and return a response
   * This is the main entry point for chat interactions
   */
  async processMessage(messageDto: ChatMessageDto): Promise<ChatResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(`Processing message: "${messageDto.message}"`);

      // Generate a session ID if not provided (stateless approach for now)
      const sessionId = messageDto.sessionId || uuidv4();

      // Process the query through the Mastra agent system
      const agentResponse = await this.mastraIntegration.processQuery(
        messageDto.message,
        sessionId,
        messageDto.userLocation,
      );

      // Format the response for chat consumption
      const chatResponse = this.responseFormatter.formatResponse(
        agentResponse,
        sessionId,
        messageDto.message,
      );

      const totalTime = Date.now() - startTime;
      this.logger.log(
        `Message processed in ${totalTime}ms for session ${sessionId}`,
      );

      return chatResponse;
    } catch (error: any) {
      this.logger.error(
        `Error processing message: ${error.message}`,
        error.stack,
      );

      // Return error response
      return this.createErrorResponse(
        messageDto,
        error.message,
        Date.now() - startTime,
      );
    }
  }

  // /**
  //  * Get conversation history for a session
  //  */
  // async getConversationHistory(sessionId: string): Promise<ChatMessage[]> {
  //   try {
  //     const history = this.sessionService.getConversationHistory(sessionId);
  //     this.logger.log(`Retrieved ${history.length} messages for session ${sessionId}`);
  //     return history;
  //   } catch (error) {
  //     this.logger.error(`Error retrieving conversation history: ${error.message}`, error.stack);
  //     return [];
  //   }
  // }

  // /**
  //  * Clear conversation history for a session
  //  */
  // async clearConversation(sessionId: string): Promise<boolean> {
  //   try {
  //     const deleted = this.sessionService.deleteSession(sessionId);
  //     this.logger.log(`Cleared conversation for session ${sessionId}`);
  //     return deleted;
  //   } catch (error) {
  //     this.logger.error(`Error clearing conversation: ${error.message}`, error.stack);
  //     return false;
  //   }
  // }

  /**
   * Get chat service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    mastraIntegration: boolean;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const mastraHealthy = await this.mastraIntegration.healthCheck();

      return {
        status: mastraHealthy ? 'healthy' : 'unhealthy',
        mastraIntegration: mastraHealthy,
      };
    } catch (error: any) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return {
        status: 'unhealthy',
        mastraIntegration: false,
      };
    }
  }

  /**
   * Create an error response when processing fails
   */
  private createErrorResponse(
    messageDto: ChatMessageDto,
    errorMessage: string,
    processingTime: number,
  ): ChatResponseDto {
    const messageId = uuidv4();
    const sessionId = messageDto.sessionId || uuidv4();

    return {
      messageId,
      sessionId,
      text: `I apologize, but I encountered an error while processing your request: "${messageDto.message}". Please try again or rephrase your question.`,
      metadata: {
        queryType: 'error',
        confidence: 0,
        processingTime,
        dataSource: ['Chat Service Error Handler'],
      },
      suggestedActions: [
        {
          type: 'query',
          label: 'Try again',
          action: messageDto.message,
        },
        {
          type: 'query',
          label: 'Simplify question',
          action: 'Can you help me with something else?',
        },
      ],
    };
  }
}
