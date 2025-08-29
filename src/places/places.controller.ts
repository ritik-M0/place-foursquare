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
   * POST /api/places/chat/unified - Ultra-Simple Chat Endpoint
   * 
   * The simplest possible chat interface - just send a message and get a response.
   * The orchestrator agent intelligently decides what to return:
   * - Text responses for conversational queries
   * - Map data (GeoJSON) for location-based queries  
   * - Combined responses with both text and maps when relevant
   * - Analysis data for statistical queries
   * 
   * The agent handles all intelligence internally:
   * 1. Query analysis and intent detection
   * 2. Tool selection and execution
   * 3. Response formatting (text, maps, or both)
   * 4. Error handling and fallbacks
   * 
   * Perfect for a frontend chatbot that can display both text and maps.
   * 
   * @param unifiedChatDto - Contains message and optional sessionId/context
   * @returns UnifiedChatResponseDto with the agent's direct response
   */
  @Post('chat/unified')
  @ApiOperation({
    summary: 'Ultra-Simple Chat Endpoint - Direct Agent Communication',
    description:
      'Send a message, get a response. The orchestrator agent intelligently handles everything - query analysis, tool selection, and response formatting. Perfect for chatbots that need to display text and maps.',
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
