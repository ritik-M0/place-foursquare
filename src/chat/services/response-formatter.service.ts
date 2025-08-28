import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  MastraAgentResponse,
  ChatAttachment,
  SuggestedAction,
} from '../interfaces/chat.interfaces';
import { ChatResponseDto } from '../dto/chat-response.dto';

@Injectable()
export class ResponseFormatterService {
  private readonly logger = new Logger(ResponseFormatterService.name);

  /**
   * Format the Mastra agent response into a chat-friendly format
   */
  formatResponse(
    agentResponse: MastraAgentResponse,
    sessionId: string,
    originalQuery: string,
  ): ChatResponseDto {
    const messageId = uuidv4();

    try {
      // Extract the core response text
      const text = this.extractResponseText(agentResponse);

      // Process map data if available
      const mapData = this.processMapData(agentResponse.data.mapData);

      // Generate attachments from response data
      const attachments = this.generateAttachments(agentResponse);

      // Create suggested actions based on response
      const suggestedActions = this.generateSuggestedActions(
        agentResponse,
        originalQuery,
      );

      // Build metadata
      const metadata = this.buildMetadata(agentResponse, originalQuery);

      const response: ChatResponseDto = {
        messageId,
        sessionId,
        text,
        mapData,
        attachments,
        metadata,
        suggestedActions,
      };

      this.logger.log(
        `Formatted response ${messageId} for session ${sessionId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error formatting response: ${error.message}`,
        error.stack,
      );

      // Return fallback response
      return this.createFallbackResponse(
        messageId,
        sessionId,
        agentResponse,
        originalQuery,
      );
    }
  }

  /**
   * Extract the main response text from the agent response
   */
  private extractResponseText(agentResponse: MastraAgentResponse): string {
    // Try to get the analysis text first
    if (agentResponse.data?.summary?.analysis?.text) {
      return agentResponse.data.summary.analysis.text;
    }

    // Fallback to raw text if available
    if (typeof agentResponse === 'string') {
      return agentResponse;
    }

    // Last resort fallback
    return "I processed your request, but I'm having trouble formatting the response. Please try again.";
  }

  /**
   * Process and validate map data
   */
  private processMapData(mapData: any): any {
    if (!mapData) return undefined;

    // Validate GeoJSON structure
    if (
      mapData.type === 'FeatureCollection' &&
      Array.isArray(mapData.features)
    ) {
      return mapData;
    }

    // If it's not valid GeoJSON, return undefined
    this.logger.warn('Invalid map data structure received from agent');
    return undefined;
  }

  /**
   * Generate attachments based on response data
   */
  private generateAttachments(
    agentResponse: MastraAgentResponse,
  ): ChatAttachment[] {
    const attachments: ChatAttachment[] = [];

    // Add map data as attachment if available
    if (agentResponse.data.mapData) {
      attachments.push({
        type: 'map',
        data: agentResponse.data.mapData,
        metadata: {
          featureCount: agentResponse.data.mapData.features?.length || 0,
          bounds: agentResponse.data.mapData.bounds,
          center: agentResponse.data.mapData.center,
        },
      });
    }

    // TODO: Add other attachment types based on response content
    // - Images from POI photos
    // - Links to external resources
    // - Structured data cards

    return attachments;
  }

  /**
   * Generate suggested follow-up actions
   */
  private generateSuggestedActions(
    agentResponse: MastraAgentResponse,
    originalQuery: string,
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];
    const queryType = agentResponse.data?.summary?.queryType || 'general';

    // Generate context-aware suggestions based on query type
    switch (queryType) {
      case 'location':
      case 'poi':
        actions.push(
          {
            type: 'query',
            label: 'Show nearby restaurants',
            action: 'Find restaurants near these locations',
          },
          {
            type: 'query',
            label: 'Get directions',
            action: 'How do I get to the closest location?',
          },
          {
            type: 'filter',
            label: 'Filter by rating',
            action: 'show only places with 4+ stars',
          },
        );
        break;

      case 'weather':
        actions.push(
          {
            type: 'query',
            label: 'Extended forecast',
            action: "What's the weather forecast for the next week?",
          },
          {
            type: 'query',
            label: 'Weather in other cities',
            action: 'Compare weather with nearby cities',
          },
        );
        break;

      case 'events':
        actions.push(
          {
            type: 'query',
            label: 'More events',
            action: 'Show more events this week',
          },
          {
            type: 'query',
            label: 'Event details',
            action: 'Tell me more about the first event',
          },
        );
        break;

      default:
        // Generic suggestions
        actions.push(
          {
            type: 'query',
            label: 'More details',
            action: 'Tell me more about this',
          },
          {
            type: 'query',
            label: 'Related info',
            action: 'What else can you tell me about this area?',
          },
        );
    }

    return actions.slice(0, 4); // Limit to 4 suggestions
  }

  /**
   * Build comprehensive metadata
   */
  private buildMetadata(
    agentResponse: MastraAgentResponse,
    originalQuery: string,
  ): any {
    const confidence = agentResponse.data?.summary?.analysis?.confidence || 0.8;
    const processingTime = agentResponse.metadata?.processingTime || 0;
    const dataSources = this.extractDataSources(agentResponse);

    return {
      queryType: agentResponse.data?.summary?.queryType || 'general',
      confidence,
      processingTime,
      dataSource: dataSources,
      originalQuery,
      agentVersion: 'mastra-1.0',
      responseGenerated: new Date().toISOString(),
      extractedEntities: agentResponse.data?.summary?.extractedEntities || {},
    };
  }

  /**
   * Extract data sources used in the response
   */
  private extractDataSources(agentResponse: MastraAgentResponse): string[] {
    const sources: string[] = [];

    // Check metadata for source information
    if (agentResponse.metadata?.sources) {
      sources.push(...agentResponse.metadata.sources);
    }

    // Check map data metadata for sources
    if (agentResponse.data?.mapData?.metadata?.sources) {
      sources.push(...agentResponse.data.mapData.metadata.sources);
    }

    // Default sources based on response type
    if (sources.length === 0) {
      sources.push('AI Agent');
    }

    return [...new Set(sources)]; // Remove duplicates
  }

  /**
   * Create a fallback response when formatting fails
   */
  private createFallbackResponse(
    messageId: string,
    sessionId: string,
    agentResponse: MastraAgentResponse,
    originalQuery: string,
  ): ChatResponseDto {
    return {
      messageId,
      sessionId,
      text: 'I processed your request successfully, but encountered an issue formatting the response. The core functionality worked, but the presentation may be limited.',
      metadata: {
        queryType: 'error',
        confidence: 0.5,
        processingTime: agentResponse.metadata?.processingTime || 0,
        dataSource: ['Fallback Handler'],
        fallback: true,
        originalError: 'Response formatting error',
      },
      suggestedActions: [
        {
          type: 'query',
          label: 'Try again',
          action: originalQuery,
        },
        {
          type: 'query',
          label: 'Rephrase question',
          action: 'Can you help me with something similar?',
        },
      ],
    };
  }
}
