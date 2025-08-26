import { Controller, Post, Body, Res, HttpStatus, Logger, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { MapDataService } from '../services/map-data.service';
import { 
  MapDataQueryDto, 
  MapDataResponseDto,
  MapDataStreamingResponseDto 
} from '../dto/map-data.dto';

@ApiTags('Map Data')
@Controller('api/places/map-data')
export class MapDataController {
  private readonly logger = new Logger(MapDataController.name);

  constructor(private readonly mapDataService: MapDataService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate GeoJSON map data',
    description: 'Generate GeoJSON FeatureCollection for geospatial visualization based on natural language query.',
  })
  @ApiBody({ type: MapDataQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Map data generated successfully',
    type: MapDataResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during map data generation',
  })
  async generateMapData(
    @Body() queryDto: MapDataQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Received map data query: "${queryDto.query}"`);

      const result = await this.mapDataService.generateMapData(queryDto);

      res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Map data generation failed: ${error.message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Sse('generate/stream')
  @ApiOperation({
    summary: 'Generate GeoJSON map data with streaming',
    description: 'Generate GeoJSON map data with real-time progress updates via Server-Sent Events.',
  })
  @ApiResponse({
    status: 200,
    description: 'Streaming map data generation started successfully',
    type: MapDataStreamingResponseDto,
  })
  async generateStreamingMapData(
    @Body() queryDto: MapDataQueryDto,
  ): Promise<Observable<any>> {
    this.logger.log(`Received streaming map data query: "${queryDto.query}"`);

    return new Observable((observer) => {
      this.mapDataService
        .generateStreamingMapData(queryDto, (data) => {
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
          this.logger.error(`Streaming map data generation failed: ${error.message}`);
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

  @Post('generate/batch')
  @ApiOperation({
    summary: 'Generate multiple map datasets in batch',
    description: 'Generate multiple GeoJSON datasets efficiently in a single request.',
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: { $ref: '#/components/schemas/MapDataQueryDto' },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Batch map data generation completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/MapDataResponseDto' },
        },
      },
    },
  })
  async generateBatchMapData(
    @Body() batchRequest: { queries: MapDataQueryDto[] },
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Received batch map data queries: ${batchRequest.queries.length} queries`);

      const results = await Promise.all(
        batchRequest.queries.map((query) =>
          this.mapDataService.generateMapData(query)
        )
      );

      res.status(HttpStatus.OK).json({
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
        totalQueries: batchRequest.queries.length,
      });
    } catch (error) {
      this.logger.error(`Batch map data generation failed: ${error.message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Validate GeoJSON data',
    description: 'Validate GeoJSON FeatureCollection format and geographic bounds.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        geojson: {
          type: 'object',
          description: 'GeoJSON FeatureCollection to validate',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'GeoJSON validation completed',
  })
  async validateGeoJSON(
    @Body() request: { geojson: any },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { geojson } = request;
      const validation = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        statistics: {
          totalFeatures: 0,
          featureTypes: {} as Record<string, number>,
          bounds: null as { north: number; south: number; east: number; west: number; } | null,
        },
      };

      // Basic GeoJSON validation
      if (!geojson || geojson.type !== 'FeatureCollection') {
        validation.isValid = false;
        validation.errors.push('Invalid GeoJSON: Must be a FeatureCollection');
      } else {
        validation.statistics.totalFeatures = geojson.features?.length || 0;
        
        // Calculate bounds and feature types
        if (geojson.features && geojson.features.length > 0) {
          let minLat = Infinity, maxLat = -Infinity;
          let minLon = Infinity, maxLon = -Infinity;

          geojson.features.forEach((feature: any, index: number) => {
            // Validate feature structure
            if (!feature.type || feature.type !== 'Feature') {
              validation.errors.push(`Feature ${index}: Invalid feature type`);
            }
            
            if (!feature.geometry || !feature.geometry.type) {
              validation.errors.push(`Feature ${index}: Missing geometry`);
            }

            // Count feature types
            const geomType = feature.geometry?.type;
            if (geomType) {
              validation.statistics.featureTypes[geomType] = 
                (validation.statistics.featureTypes[geomType] || 0) + 1;
            }

            // Calculate bounds for Point geometries
            if (feature.geometry?.type === 'Point' && feature.geometry.coordinates) {
              const [lon, lat] = feature.geometry.coordinates;
              if (typeof lat === 'number' && typeof lon === 'number') {
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
                minLon = Math.min(minLon, lon);
                maxLon = Math.max(maxLon, lon);
              }
            }
          });

          if (minLat !== Infinity) {
            validation.statistics.bounds = {
              north: maxLat,
              south: minLat,
              east: maxLon,
              west: minLon,
            };
          }
        }

        // Add warnings
        if (validation.statistics.totalFeatures === 0) {
          validation.warnings.push('FeatureCollection contains no features');
        }
        
        if (validation.statistics.totalFeatures > 1000) {
          validation.warnings.push('Large dataset: Consider pagination for better performance');
        }
      }

      res.status(HttpStatus.OK).json({
        success: true,
        data: validation,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`GeoJSON validation failed: ${error.message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('examples')
  @ApiOperation({
    summary: 'Get example map data queries',
    description: 'Returns example queries that demonstrate the capabilities of the map data agent.',
  })
  @ApiResponse({
    status: 200,
    description: 'Example queries retrieved successfully',
  })
  async getExamples(@Res() res: Response): Promise<void> {
    const examples = [
      {
        title: 'Coffee Shops Map',
        query: 'Show me all coffee shops in downtown Seattle',
        description: 'Generate a map of coffee shops with ratings and hours',
        center: { lat: 47.6062, lon: -122.3321 },
        radius: 2000,
        maxResults: 50,
      },
      {
        title: 'Restaurant Density',
        query: 'Map all restaurants in Manhattan with foot traffic data',
        description: 'Comprehensive restaurant mapping with business intelligence',
        bounds: {
          north: 40.8176,
          south: 40.7047,
          east: -73.9442,
          west: -74.0479,
        },
        maxResults: 100,
      },
      {
        title: 'Tourist Attractions',
        query: 'Plot major tourist attractions in Paris on a map',
        description: 'Tourist destination mapping with ratings and photos',
        center: { lat: 48.8566, lon: 2.3522 },
        radius: 10000,
        maxResults: 30,
      },
      {
        title: 'Gas Stations Route',
        query: 'Show gas stations along Highway 101 from San Francisco to Los Angeles',
        description: 'Route-based point of interest mapping',
        maxResults: 75,
      },
      {
        title: 'Event Venues',
        query: 'Map all event venues and conference centers in Austin',
        description: 'Business event location mapping',
        center: { lat: 30.2672, lon: -97.7431 },
        radius: 15000,
        maxResults: 40,
      },
    ];

    res.status(HttpStatus.OK).json({
      success: true,
      data: examples,
      timestamp: new Date().toISOString(),
    });
  }
}
