import { Injectable, Logger } from '@nestjs/common';
import { orchestratorAgent } from '../../mastra/agents/orchestrator-agent';
import { mapDataAgent } from '../../mastra/agents/map-data-agent';
import { plannerAgent } from '../../mastra/agents/planner-agent';
import { summarizerAgent } from '../../mastra/agents/summarizer-agent';
import { MastraAgentResponse } from '../interfaces/chat.interfaces';

@Injectable()
export class MastraIntegrationService {
  private readonly logger = new Logger(MastraIntegrationService.name);

  /**
   * Process a user query through the orchestrator agent
   * This is the main entry point to the agentic architecture
   */
  async processQuery(
    query: string,
    sessionId: string,
    userLocation?: { latitude: number; longitude: number },
  ): Promise<MastraAgentResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(`Processing query: "${query}" for session: ${sessionId}`);

      // Enhance query with context if available
      let enhancedQuery = query;
      if (userLocation) {
        enhancedQuery += ` (User location: ${userLocation.latitude}, ${userLocation.longitude})`;
      }

      // Call the orchestrator agent
      const response = await orchestratorAgent.generate(enhancedQuery);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Query processed in ${processingTime}ms`);

      // Parse the response text as JSON (orchestrator returns unified JSON format)
      let parsedResponse: MastraAgentResponse;
      try {
        parsedResponse = JSON.parse(response.text || '{}');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (parseError) {
        this.logger.warn(
          'Failed to parse orchestrator response as JSON, creating fallback response',
        );
        parsedResponse = this.createFallbackResponse(
          response.text || 'No response generated',
          processingTime,
        );
      }

      // Ensure response has required structure
      return this.validateAndEnhanceResponse(parsedResponse, processingTime);
    } catch (error) {
      this.logger.error(
        `Error processing query: ${error.message}`,
        error.stack,
      );

      // Return error response in expected format
      return this.createErrorResponse(error.message, Date.now() - startTime);
    }
  }

  /**
   * Validate and enhance the response from the orchestrator agent
   */
  private validateAndEnhanceResponse(
    response: any,
    processingTime: number,
  ): MastraAgentResponse {
    // Ensure the response has the expected structure
    const validatedResponse: MastraAgentResponse = {
      type: response.type || 'analysis',
      data: {
        summary: {
          queryType: response.data?.summary?.queryType || 'general',
          extractedEntities: response.data?.summary?.extractedEntities || {},
          analysis: {
            text:
              response.data?.summary?.analysis?.text ||
              response.text ||
              'No analysis available',
            confidence: response.data?.summary?.analysis?.confidence || 0.8,
          },
        },
        mapData: response.data?.mapData || null,
      },
      metadata: {
        ...response.metadata,
        processingTime,
        generatedAt: new Date().toISOString(),
        service: 'mastra-integration',
      },
      success: response.success !== false,
      timestamp: response.timestamp || new Date().toISOString(),
    };

    return validatedResponse;
  }

  /**
   * Create a fallback response when JSON parsing fails
   */
  private createFallbackResponse(
    text: string,
    processingTime: number,
  ): MastraAgentResponse {
    return {
      type: 'analysis',
      data: {
        summary: {
          queryType: 'general',
          extractedEntities: {},
          analysis: {
            text: text,
            confidence: 0.7,
          },
        },
        mapData: null,
      },
      metadata: {
        processingTime,
        generatedAt: new Date().toISOString(),
        service: 'mastra-integration',
        fallback: true,
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create an error response
   */
  private createErrorResponse(
    errorMessage: string,
    processingTime: number,
  ): MastraAgentResponse {
    return {
      type: 'error',
      data: {
        summary: {
          queryType: 'error',
          extractedEntities: {},
          analysis: {
            text: `I apologize, but I encountered an error while processing your request: ${errorMessage}. Please try again or rephrase your question.`,
            confidence: 0,
          },
        },
        mapData: null,
      },
      metadata: {
        processingTime,
        generatedAt: new Date().toISOString(),
        service: 'mastra-integration',
        error: errorMessage,
      },
      success: false,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check for the Mastra integration
   */
  healthCheck(): boolean {
    try {
      // Simple test to ensure agents are accessible
      return !!(
        orchestratorAgent &&
        mapDataAgent &&
        plannerAgent &&
        summarizerAgent
      );
    } catch (error) {
      this.logger.error('Mastra health check failed', error);
      return false;
    }
  }
}
