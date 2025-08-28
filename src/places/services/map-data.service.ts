import { Injectable, Logger } from '@nestjs/common';
import { mastra } from '../../mastra';
import { 
  MapDataQueryDto, 
  MapDataResponseDto,
  MapDataQuerySchema,
  MapDataResponseSchema 
} from '../dto/map-data.dto';

@Injectable()
export class MapDataService {
  private readonly logger = new Logger(MapDataService.name);

  async generateMapData(queryDto: MapDataQueryDto): Promise<MapDataResponseDto> {
    this.logger.log(`Generating map data for query: "${queryDto.query}"`);

    try {
      // Validate input with Zod schema
      const validatedQuery = MapDataQuerySchema.parse(queryDto);

      // Get the map data agent
      const mapDataAgent = mastra.getAgent('mapDataAgent');
      if (!mapDataAgent) {
        throw new Error('Map data agent not found');
      }

      // Prepare context for the agent
      const context = {
        query: validatedQuery.query,
        bounds: validatedQuery.bounds,
        center: validatedQuery.center,
        radius: validatedQuery.radius || 5000,
        maxResults: validatedQuery.maxResults || 50,
      };

      // Execute the query with the map data agent
      const result = await mapDataAgent.generate([
        {
          role: 'user',
          content: `Generate GeoJSON map data for this query: "${validatedQuery.query}".
                   
                   Context:
                   ${validatedQuery.bounds ? `Bounds: ${JSON.stringify(validatedQuery.bounds)}` : ''}
                   ${validatedQuery.center ? `Center: ${JSON.stringify(validatedQuery.center)}` : ''}
                   Radius: ${validatedQuery.radius || 5000} meters
                   Max results: ${validatedQuery.maxResults || 50}
                   
                   Please use appropriate geospatial tools and return data in GeoJSON FeatureCollection format.`,
        },
      ]);

      // Extract structured response - MapDataAgent returns GeoJSON as text
      let response;
      
      if (result.object) {
        // Agent returned structured object
        response = result.object;
      } else if (result.text) {
        // MapDataAgent is instructed to return pure GeoJSON FeatureCollection as text
        try {
          const geojsonData = JSON.parse(result.text);
          if (geojsonData.type === 'FeatureCollection') {
            response = {
              geojson: geojsonData,
              metadata: {
                totalFeatures: geojsonData.features?.length || 0,
                bounds: geojsonData.bounds || validatedQuery.bounds || {
                  north: 0, south: 0, east: 0, west: 0,
                },
                center: geojsonData.center,
                sources: geojsonData.metadata?.sources || ['Map Data Agent'],
                generatedAt: geojsonData.metadata?.generatedAt || new Date().toISOString(),
              },
            };
          } else {
            throw new Error('Invalid GeoJSON format');
          }
        } catch (e) {
          // Fallback if agent didn't return valid GeoJSON
          this.logger.warn(`Failed to parse MapDataAgent response as GeoJSON: ${e.message}`);
          response = {
            geojson: {
              type: 'FeatureCollection',
              features: [],
            },
            metadata: {
              totalFeatures: 0,
              bounds: validatedQuery.bounds || {
                north: 0, south: 0, east: 0, west: 0,
              },
              sources: ['Map Data Agent'],
              generatedAt: new Date().toISOString(),
              error: `Failed to parse agent response: ${e.message}`,
            },
          };
        }
      } else {
        // Fallback response
        response = {
          geojson: {
            type: 'FeatureCollection',
            features: [],
          },
          metadata: {
            totalFeatures: 0,
            bounds: validatedQuery.bounds || {
              north: 0, south: 0, east: 0, west: 0,
            },
            sources: ['Map Data Agent'],
            generatedAt: new Date().toISOString(),
          },
        };
      }

      this.logger.log(`Map data generation completed with ${response.geojson.features.length} features`);
      return response as MapDataResponseDto;

    } catch (error) {
      this.logger.error(`Map data generation failed: ${error.message}`);
      throw new Error(`Failed to generate map data: ${error.message}`);
    }
  }

  async generateStreamingMapData(
    queryDto: MapDataQueryDto,
    onProgress: (data: any) => void
  ): Promise<MapDataResponseDto> {
    this.logger.log(`Generating streaming map data for query: "${queryDto.query}"`);

    try {
      // Send initial progress
      onProgress({
        type: 'progress',
        content: 'Starting geospatial data collection...',
        progress: 0,
      });

      // Validate input
      const validatedQuery = MapDataQuerySchema.parse(queryDto);

      // Get the map data agent
      const mapDataAgent = mastra.getAgent('mapDataAgent');
      if (!mapDataAgent) {
        throw new Error('Map data agent not found');
      }

      // Send progress update
      onProgress({
        type: 'progress',
        content: 'Executing geospatial tools...',
        progress: 30,
      });

      // Prepare context for the agent
      const context = {
        query: validatedQuery.query,
        bounds: validatedQuery.bounds,
        center: validatedQuery.center,
        radius: validatedQuery.radius || 5000,
        maxResults: validatedQuery.maxResults || 50,
      };

      // Execute the query
      const result = await mapDataAgent.generate([
        {
          role: 'user',
          content: `Generate GeoJSON map data for this query: "${validatedQuery.query}".
                   
                   Context:
                   ${validatedQuery.bounds ? `Bounds: ${JSON.stringify(validatedQuery.bounds)}` : ''}
                   ${validatedQuery.center ? `Center: ${JSON.stringify(validatedQuery.center)}` : ''}
                   Radius: ${validatedQuery.radius || 5000} meters
                   Max results: ${validatedQuery.maxResults || 50}
                   
                   Please use appropriate geospatial tools and return data in GeoJSON FeatureCollection format.`,
        },
      ]);

      // Send progress update
      onProgress({
        type: 'progress',
        content: 'Processing geospatial data...',
        progress: 70,
      });

      // Extract and format response
      const response = result.object || {
        geojson: {
          type: 'FeatureCollection',
          features: [],
        },
        metadata: {
          totalFeatures: 0,
          bounds: validatedQuery.bounds || {
            north: 0,
            south: 0,
            east: 0,
            west: 0,
          },
          sources: ['Map Data Agent'],
          generatedAt: new Date().toISOString(),
        },
      };

      // Send metadata update
      onProgress({
        type: 'metadata',
        content: response.metadata,
        progress: 90,
      });

      // Send final result
      onProgress({
        type: 'complete',
        content: response,
        progress: 100,
      });

      this.logger.log(`Streaming map data generation completed with ${response.geojson.features.length} features`);
      return response as MapDataResponseDto;

    } catch (error) {
      this.logger.error(`Streaming map data generation failed: ${error.message}`);
      onProgress({
        type: 'error',
        content: `Failed to generate map data: ${error.message}`,
        progress: 0,
      });
      throw new Error(`Failed to generate streaming map data: ${error.message}`);
    }
  }
}
