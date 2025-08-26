import { Controller, Post, Body, Res, HttpStatus, Logger, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { OrchestratorService } from '../services/orchestrator.service';
import { 
  OrchestratorQueryDto, 
  OrchestratorResponseDto,
  OrchestratorStreamingResponseDto 
} from '../dto/orchestrator.dto';

@ApiTags('Orchestrator')
@Controller('api/places/orchestrator')
export class OrchestratorController {
  private readonly logger = new Logger(OrchestratorController.name);

  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Post('query')
  @ApiOperation({
    summary: 'Process location intelligence query',
    description: 'Process a comprehensive location intelligence query using the orchestrator agent. Returns structured analysis with summary and optional raw data.',
  })
  @ApiBody({ type: OrchestratorQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Query processed successfully',
    type: OrchestratorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during query processing',
  })
  async processQuery(
    @Body() queryDto: OrchestratorQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Received orchestrator query: "${queryDto.query}"`);

      const result = await this.orchestratorService.processQuery(queryDto);

      res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Orchestrator query failed: ${error.message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Sse('query/stream')
  @ApiOperation({
    summary: 'Process location intelligence query with streaming',
    description: 'Process a location intelligence query with real-time progress updates via Server-Sent Events.',
  })
  @ApiResponse({
    status: 200,
    description: 'Streaming query started successfully',
    type: OrchestratorStreamingResponseDto,
  })
  async processStreamingQuery(
    @Body() queryDto: OrchestratorQueryDto,
  ): Promise<Observable<any>> {
    this.logger.log(`Received streaming orchestrator query: "${queryDto.query}"`);

    return new Observable((observer) => {
      this.orchestratorService
        .processStreamingQuery(queryDto, (data) => {
          observer.next({
            data: JSON.stringify(data),
          });
        })
        .then((finalResult) => {
          observer.next({
            data: JSON.stringify({
              type: 'final',
              content: finalResult,
            }),
          });
          observer.complete();
        })
        .catch((error) => {
          this.logger.error(`Streaming orchestrator query failed: ${error.message}`);
          observer.next({
            data: JSON.stringify({
              type: 'error',
              content: error.message,
            }),
          });
          observer.error(error);
        });
    });
  }

  @Post('query/batch')
  @ApiOperation({
    summary: 'Process multiple queries in batch',
    description: 'Process multiple location intelligence queries efficiently in a single request.',
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: { $ref: '#/components/schemas/OrchestratorQueryDto' },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Batch queries processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/OrchestratorResponseDto' },
        },
      },
    },
  })
  async processBatchQueries(
    @Body() batchRequest: { queries: OrchestratorQueryDto[] },
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Received batch orchestrator queries: ${batchRequest.queries.length} queries`);

      const results = await Promise.all(
        batchRequest.queries.map((query) =>
          this.orchestratorService.processQuery(query)
        )
      );

      res.status(HttpStatus.OK).json({
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
        totalQueries: batchRequest.queries.length,
      });
    } catch (error) {
      this.logger.error(`Batch orchestrator queries failed: ${error.message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('examples')
  @ApiOperation({
    summary: 'Get example orchestrator queries',
    description: 'Returns example queries that demonstrate the capabilities of the orchestrator agent.',
  })
  @ApiResponse({
    status: 200,
    description: 'Example queries retrieved successfully',
  })
  async getExamples(@Res() res: Response): Promise<void> {
    const examples = [
      {
        title: 'Restaurant Analysis',
        query: 'Find popular restaurants in Manhattan and analyze their foot traffic patterns',
        description: 'Comprehensive analysis of restaurant locations with foot traffic data',
        maxSteps: 8,
        includeRawData: false,
      },
      {
        title: 'Event Impact Analysis',
        query: 'Show me how upcoming events in San Francisco will affect local business foot traffic',
        description: 'Analyze correlation between events and business impact',
        maxSteps: 10,
        includeRawData: true,
      },
      {
        title: 'Weather-Based Recommendations',
        query: 'Recommend indoor activities in Seattle based on current weather conditions',
        description: 'Weather-aware location recommendations',
        maxSteps: 6,
        includeRawData: false,
      },
      {
        title: 'Competitive Analysis',
        query: 'Compare coffee shop density and ratings between downtown Portland and Seattle',
        description: 'Multi-city competitive business analysis',
        maxSteps: 12,
        includeRawData: true,
      },
      {
        title: 'Tourism Optimization',
        query: 'Find the best tourist attractions in London with current crowd levels and weather',
        description: 'Real-time tourism recommendations with crowd and weather data',
        maxSteps: 8,
        includeRawData: false,
      },
    ];

    res.status(HttpStatus.OK).json({
      success: true,
      data: examples,
      timestamp: new Date().toISOString(),
    });
  }
}
