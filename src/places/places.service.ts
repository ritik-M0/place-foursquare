// NestJS dependency injection and logging
import { Injectable, Logger } from '@nestjs/common';

// Import Mastra framework instance for direct agent access
import { mastra } from '../mastra';

// Import specialized service classes for different types of queries
import { OrchestratorService } from './services/orchestrator.service';
import { IntelligentOrchestratorService } from './services/intelligent-orchestrator.service';
import { MapDataService } from './services/map-data.service';
import { QueryRouterService, QueryType } from './services/query-router.service';

// Import DTOs for unified chat functionality
import {
  UnifiedChatDto,
  UnifiedChatResponseDto,
  ResponseType,
  ResponsePreference,
  UnifiedChatSchema,
} from './dto/unified-chat.dto';

/**
 * PlacesService - Core business logic service for the Foursquare Places application
 *
 * This service acts as the main orchestrator that:
 * 1. Receives requests from the controller layer
 * 2. Analyzes user queries to determine intent
 * 3. Routes to appropriate specialized services
 * 4. Coordinates with Mastra AI agents
 * 5. Returns processed responses
 *
 * Service Architecture:
 * - OrchestratorService: Handles general text-based queries
 * - IntelligentOrchestratorService: Processes complex analytical queries
 * - MapDataService: Generates GeoJSON data for map visualization
 * - QueryRouterService: Analyzes query intent for intelligent routing
 */
@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);

  /**
   * Constructor - Injects all specialized services for query processing
   * @param orchestratorService - Handles basic orchestration and text responses
   * @param intelligentOrchestrator - Processes complex analytical queries
   * @param mapDataService - Generates GeoJSON data for mapping
   * @param queryRouter - Analyzes queries to determine routing strategy
   */
  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly intelligentOrchestrator: IntelligentOrchestratorService,
    private readonly mapDataService: MapDataService,
    private readonly queryRouter: QueryRouterService,
  ) {}

  // Search method removed - only unified chat needed

  /**
   * Unified Chat Method - Intelligent Query Routing (MAIN FEATURE)
   *
   * This is the most advanced method that intelligently analyzes user queries
   * and automatically routes them to the most appropriate service based on content.
   *
   * Intelligence Features:
   * - Automatic intent detection (map, analysis, or text)
   * - Smart response format selection
   * - Multi-service coordination
   * - Performance tracking and metadata
   *
   * Routing Logic:
   * 1. Analyze query using QueryRouterService
   * 2. Determine response type (auto or user preference)
   * 3. Route to appropriate service:
   *    - MapDataService → GeoJSON for location queries
   *    - IntelligentOrchestratorService → Analysis for complex queries
   *    - OrchestratorService → Text for general queries
   * 4. Return response with execution metadata
   *
   * @param unifiedChatDto - Contains message, sessionId, and preferences
   * @returns Promise<UnifiedChatResponseDto> - Intelligent response with metadata
   */
  async processUnifiedChat(
    unifiedChatDto: UnifiedChatDto,
  ): Promise<UnifiedChatResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Processing unified chat: "${unifiedChatDto.message.substring(0, 100)}..."`,
      );

      // Validate input
      const validatedInput = UnifiedChatSchema.parse(unifiedChatDto);

      // Analyze query to determine intent and routing
      const analysis = this.queryRouter.analyzeQuery(validatedInput.message);

      let responseType: ResponseType;
      let responseData: any;
      let agentsUsed: string[] = [];
      let toolsUsed: string[] = [];

      // Determine response type based on preference and analysis
      if (validatedInput.responsePreference === ResponsePreference.AUTO) {
        responseType = this.determineAutoResponseType(
          analysis,
          validatedInput.message,
        );
      } else {
        responseType = this.mapPreferenceToType(
          validatedInput.responsePreference,
        );
      }

      // Route to appropriate service based on determined response type
      switch (responseType) {
        case ResponseType.GEOJSON:
          this.logger.log('Routing to MapDataService for GeoJSON response');
          const mapResult = await this.mapDataService.generateMapData({
            query: validatedInput.message,
            sessionId: validatedInput.sessionId,
            maxResults: 50,
          });
          responseData = mapResult.geojson;
          agentsUsed = ['mapDataAgent'];
          toolsUsed = ['tomtomFuzzySearchTool', 'formatMapDataTool'];
          break;

        case ResponseType.ANALYSIS:
          this.logger.log(
            'Routing to IntelligentOrchestratorService for detailed analysis',
          );
          const intelligentResult =
            await this.intelligentOrchestrator.processIntelligentQuery({
              query: validatedInput.message,
              sessionId: validatedInput.sessionId,
              preferences: {
                responseFormat: 'summary',
                includeRawData: false,
              },
              context: validatedInput.context,
            });
          // Extract both summary and mapData from agent coordination results
          const executionData = intelligentResult.executionResult.finalOutput;
          responseData = {
            summary:
              executionData?.data?.summary?.analysis?.text || executionData,
            analysis: intelligentResult.analysis,
            recommendations: intelligentResult.recommendations,
            mapData: executionData?.data?.mapData || null,
          };
          agentsUsed = intelligentResult.optimizations.agentsUsed;
          toolsUsed = [];
          break;

        case ResponseType.TEXT:
        default:
          this.logger.log('Routing to OrchestratorService for text response');
          const textResult = await this.orchestratorService.processQuery({
            query: validatedInput.message,
            sessionId: validatedInput.sessionId,
            maxSteps: 10,
            includeRawData: false,
          });

          // OrchestratorAgent returns structured data with both summary and mapData
          if (textResult.data && textResult.data.summary) {
            responseData = {
              summary:
                textResult.data.summary.analysis?.text ||
                textResult.summary ||
                textResult.data.summary,
              mapData: textResult.data.mapData,
              metadata: textResult.metadata,
            };
          } else {
            responseData = textResult.summary || textResult;
          }

          agentsUsed = ['orchestratorAgent'];
          toolsUsed = ['planTool', 'executePlanTool', 'summarizeTool'];
          break;
      }

      const executionTime = Date.now() - startTime;

      return {
        type: responseType,
        data: responseData,
        metadata: {
          executionTime,
          agentsUsed,
          toolsUsed,
          confidence: analysis.confidence,
          intent: analysis.type,
          detectedEntities: analysis.extractedEntities.locations || [],
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Unified chat processing failed: ${error.message}`);

      return {
        type: ResponseType.TEXT,
        data: `I encountered an error processing your request: ${error.message}`,
        metadata: {
          executionTime: Date.now() - startTime,
          agentsUsed: [],
          toolsUsed: [],
          confidence: 0,
        },
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private determineAutoResponseType(
    analysis: any,
    message: string,
  ): ResponseType {
    // Keywords that strongly indicate map visualization
    const mapKeywords = [
      'map',
      'show on map',
      'visualize',
      'plot',
      'geojson',
      'locations',
      'where are',
      'show me on',
      'display on map',
      'geographic',
      'coordinates',
    ];

    // Keywords that indicate detailed analysis needed
    const analysisKeywords = [
      'analyze',
      'analysis',
      'comprehensive',
      'detailed',
      'compare',
      'trends',
      'patterns',
      'insights',
      'statistics',
      'metrics',
      'report',
      'breakdown',
    ];

    const lowerMessage = message.toLowerCase();

    // Check for explicit map requests
    if (mapKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      return ResponseType.GEOJSON;
    }

    // Check for analysis requests
    if (analysisKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      return ResponseType.ANALYSIS;
    }

    // Use query analysis results
    switch (analysis.type) {
      case QueryType.MAP_DATA_ONLY:
        return ResponseType.GEOJSON;
      case QueryType.ANALYTICS:
      case QueryType.COMPREHENSIVE:
        return ResponseType.ANALYSIS;
      default:
        return ResponseType.TEXT;
    }
  }

  private mapPreferenceToType(preference: ResponsePreference): ResponseType {
    switch (preference) {
      case ResponsePreference.GEOJSON:
        return ResponseType.GEOJSON;
      case ResponsePreference.ANALYSIS:
        return ResponseType.ANALYSIS;
      case ResponsePreference.TEXT:
      default:
        return ResponseType.TEXT;
    }
  }
}
