// NestJS dependency injection and logging
import { Injectable, Logger } from '@nestjs/common';

// Import Mastra framework instance for direct agent access
import { mastra } from '../mastra';

// Import DTOs for unified chat functionality
import {
  UnifiedChatDto,
  UnifiedChatResponseDto,
  UnifiedChatSchema,
} from './dto/unified-chat.dto';

/**
 * PlacesService - Simplified core service for the Foursquare Places application
 *
 * This service provides a direct interface to Mastra agents:
 * 1. Receives requests from the controller layer
 * 2. Routes directly to appropriate Mastra agents based on user preference
 * 3. Returns the exact agent response with minimal processing
 *
 * Simplified Architecture:
 * - Direct agent access through mastra instance
 * - Minimal business logic - let agents handle intelligence
 * - Preserve agent responses in their original structure
 */
@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);

  /**
   * Constructor - No service dependencies needed, direct agent access
   */
  constructor() {}

  // Search method removed - only unified chat needed

  /**
   * Ultra-Simplified Unified Chat - Pure Agent Communication
   *
   * The simplest possible approach:
   * 1. Validate input
   * 2. Call orchestrator agent with user message
   * 3. Return exactly what the agent responds with
   * 4. Agent decides whether to return text, maps, analysis, or combination
   *
   * @param unifiedChatDto - Contains message and optional sessionId/context
   * @returns Promise<UnifiedChatResponseDto> - Pure agent response
   */
  async processUnifiedChat(
    unifiedChatDto: UnifiedChatDto,
  ): Promise<UnifiedChatResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Processing chat: "${unifiedChatDto.message.substring(0, 100)}..."`,
      );

      // Validate input
      const validatedInput = UnifiedChatSchema.parse(unifiedChatDto);

      // Always use orchestrator agent - it's smart enough to handle everything
      const agent = mastra.getAgent('orchestratorAgent');
      if (!agent) {
        throw new Error('Orchestrator agent not found');
      }

      // Build simple, clean prompt
      let prompt = validatedInput.message;

      // Add context if provided
      // if (validatedInput.context) {
      //   prompt += `\n\nAdditional context: ${JSON.stringify(validatedInput.context)}`;
      // }

      // // Add session context if provided
      // if (validatedInput.sessionId) {
      //   prompt += `\n\n(Session: ${validatedInput.sessionId})`;
      // }

      // Execute agent - let it decide everything
      const result = await agent.generate([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      // Return exactly what the agent gives us
      let agentResponse;
      if (result.object) {
        agentResponse = result.object;
      } else if (result.text) {
        // Try to parse as JSON (agent returns structured data)
        try {
          agentResponse = JSON.parse(result.text);
        } catch {
          // If not JSON, wrap in simple structure
          agentResponse = { text: result.text };
        }
      } else {
        agentResponse = { text: 'No response from agent' };
      }

      const executionTime = Date.now() - startTime;

      return {
        response: agentResponse,
        metadata: {
          executionTime,
          agent: 'orchestratorAgent',
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Chat processing failed: ${error.message}`);

      return {
        response: {
          error: `I encountered an error: ${error.message}`,
          text: "Sorry, I'm having trouble processing your request right now.",
        },
        metadata: {
          executionTime: Date.now() - startTime,
          agent: 'orchestratorAgent',
        },
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // No more routing logic needed - orchestrator agent handles everything!
}
