import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Res,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PlacesService } from './places.service';
import {
  ChatDto,
  SearchQueryDto,
  ChatResponseDto,
  SearchResponseDto,
  HealthResponseDto,
  ExamplesResponseDto,
} from './dto';

@ApiTags('Places')
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post('chat')
  @ApiOperation({
    summary: 'Chat with TomTom Agent',
    description:
      'Send a natural language message to the TomTom agent for places search and information',
  })
  @ApiBody({ type: ChatDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully processed the chat message',
    type: ChatResponseDto,
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
  async chatWithAgent(@Body() chatDto: ChatDto): Promise<ChatResponseDto> {
    try {
      const { message, sessionId } = chatDto;

      const response = await this.placesService.chatWithAgent(
        message,
        sessionId,
      );

      return {
        success: true,
        response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('chat/stream')
  @ApiOperation({
    summary: 'Chat with TomTom Agent (Streaming)',
    description:
      'Send a natural language message to the TomTom agent with streaming response using Server-Sent Events',
  })
  @ApiBody({ type: ChatDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully started streaming chat response',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          description: 'Server-Sent Events stream',
        },
      },
    },
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
  async chatWithAgentStream(
    @Body() chatDto: ChatDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { message, sessionId } = chatDto;

      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Send initial metadata
      res.write(
        `data: ${JSON.stringify({
          type: 'start',
          timestamp: new Date().toISOString(),
          sessionId,
        })}\n\n`,
      );

      try {
        // Stream the response
        for await (const chunk of this.placesService.chatWithAgentStream(
          message,
          sessionId,
        )) {
          res.write(
            `data: ${JSON.stringify({
              type: 'content',
              content: chunk,
              timestamp: new Date().toISOString(),
            })}\n\n`,
          );
        }

        // Send completion signal
        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            timestamp: new Date().toISOString(),
          })}\n\n`,
        );
      } catch (streamError) {
        // Send error in stream
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error:
              streamError instanceof Error
                ? streamError.message
                : 'Stream error',
            timestamp: new Date().toISOString(),
          })}\n\n`,
        );
      }

      res.end();
    } catch (error) {
      if (!res.headersSent) {
        throw new HttpException(
          error instanceof Error ? error.message : 'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search Places',
    description:
      'Search for places using query parameters. Converts to natural language for the agent.',
  })
  @ApiQuery({
    name: 'query',
    description: 'Search query for places',
    example: 'restaurants',
  })
  @ApiQuery({
    name: 'lat',
    description: 'Latitude coordinate',
    required: false,
    example: '40.7128',
  })
  @ApiQuery({
    name: 'lon',
    description: 'Longitude coordinate',
    required: false,
    example: '-74.0060',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    required: false,
    example: '10',
  })
  @ApiQuery({
    name: 'radius',
    description: 'Search radius in meters',
    required: false,
    example: '1000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully searched for places',
    type: SearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid query parameters',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async searchPlaces(
    @Query() queryDto: SearchQueryDto,
  ): Promise<SearchResponseDto> {
    try {
      const { query, lat, lon, limit, radius } = queryDto;

      const result = await this.placesService.searchPlaces(
        query,
        lat,
        lon,
        limit,
        radius,
      );

      return {
        success: true,
        response: result.response,
        originalQuery: query,
        searchMessage: result.searchMessage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to search places',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('location')
  @ApiOperation({
    summary: 'Get Location Suggestion',
    description: 'Ask the agent to help determine current location',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully processed location request',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getLocationSuggestion(): Promise<ChatResponseDto> {
    try {
      const response = await this.placesService.getLocationSuggestion();

      return {
        success: true,
        response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to get location',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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

  @Get('examples')
  @ApiOperation({
    summary: 'Get Usage Examples',
    description: 'Get examples of what you can ask the TomTom agent',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved examples',
    type: ExamplesResponseDto,
  })
  getExamples(): ExamplesResponseDto {
    return {
      success: true,
      examples: [
        {
          category: 'Search',
          examples: [
            'Find restaurants near me',
            'Search for coffee shops in New York',
            'Find gas stations within 5 km of coordinates 40.7128, -74.0060',
            'Look for hotels near Times Square',
          ],
        },
        {
          category: 'Details',
          examples: [
            'Tell me more about Starbucks',
            'Get details about that restaurant',
            'Show me information about the first result',
          ],
        },
        {
          category: 'Location',
          examples: [
            'Where am I?',
            'What is my current location?',
            'Find my location',
          ],
        },
        {
          category: 'Photos',
          examples: [
            'Show me photos of that place',
            'Get images for this restaurant',
          ],
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }
}
