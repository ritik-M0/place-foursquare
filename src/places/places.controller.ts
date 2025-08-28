// NestJS framework imports for creating REST API controllers
import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';

// Swagger/OpenAPI imports for API documentation
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

// Express Response removed - no streaming endpoints

// Import the main business logic service
import { PlacesService } from './places.service';

// Import DTOs for unified chat and health check only
import {
  HealthResponseDto,
  UnifiedChatDto,
  UnifiedChatResponseDto,
} from './dto';

// Swagger tag for grouping all endpoints under "Places" in API docs
@ApiTags('Places')

// Define the base route for all endpoints in this controller
@Controller('api/places')

/**
 * PlacesController - Main REST API controller for the Foursquare Places application
 * 
 * This controller provides multiple endpoints for location intelligence:
 * 1. /chat - Legacy non-streaming chat with AI agents
 * 2. /chat/stream - Streaming chat using Server-Sent Events (SSE)
 * 3. /search - Parameterized place search
 * 4. /location - Get location suggestions
 * 5. /health - Health check endpoint
 * 6. /examples - Usage examples for the API
 * 7. /chat/unified - Intelligent routing endpoint (NEW)
 * 
 * The controller acts as the entry point for all HTTP requests and delegates
 * business logic to the PlacesService.
 */
export class PlacesController {
  /**
   * Constructor - Injects the PlacesService for handling business logic
   * @param placesService - Service containing all business logic for places operations
   */
  constructor(private readonly placesService: PlacesService) {}

  // Legacy chat endpoint removed - only unified chat needed

  // Streaming chat endpoint removed - only unified chat needed

  // Search endpoint removed - unified chat handles all queries

  // Location endpoint removed - unified chat handles all queries

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Check the health status of the Places API',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthResponseDto,
  })
  healthCheck(): HealthResponseDto {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  // Examples endpoint removed - unified chat handles all queries

  /**
   * POST /api/places/chat/unified - Intelligent Unified Chat Endpoint
   * 
   * This is the most advanced endpoint that intelligently analyzes user queries
   * and automatically determines the best response format:
   * 
   * Response Types:
   * - 'text': Regular conversational responses
   * - 'geojson': Map data for location-based queries
   * - 'analysis': Statistical/analytical data
   * 
   * Intelligence Flow:
   * 1. Analyze user query for intent (map, analysis, or general)
   * 2. Route to appropriate service:
   *    - MapDataService for location/map queries → GeoJSON
   *    - OrchestratorService for analysis queries → structured data
   *    - Default to text responses for general queries
   * 3. Return response with metadata about processing
   * 
   * This endpoint replaces the need for multiple specialized endpoints
   * by providing intelligent routing based on query content.
   * 
   * @param unifiedChatDto - Contains message, sessionId, and response preference
   * @returns UnifiedChatResponseDto with intelligent response type and metadata
   */
  @Post('chat/unified')
  @ApiOperation({
    summary:
      'Unified Chat Endpoint - Intelligently Routes to Appropriate Services',
    description:
      'Single endpoint that analyzes user queries and automatically returns text, GeoJSON, or analysis data based on content. This is the ultimate chatbot endpoint that handles all query types intelligently.',
  })
  @ApiBody({ type: UnifiedChatDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully processed the unified chat request',
    type: UnifiedChatResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async processUnifiedChat(
    @Body() unifiedChatDto: UnifiedChatDto,
  ): Promise<UnifiedChatResponseDto> {
    try {
      // Delegate to service for intelligent query processing and routing
      return await this.placesService.processUnifiedChat(unifiedChatDto);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
