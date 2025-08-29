import { Injectable, Logger } from '@nestjs/common';
import { QueryAnalysis, QueryType } from './query-router.service';
import { mastra } from '../../mastra';

export interface ExecutionPlan {
  phases: ExecutionPhase[];
  estimatedDuration: number;
  parallelizable: boolean;
}

export interface ExecutionPhase {
  name: string;
  agent: string;
  tools: string[];
  dependencies: string[];
  parallel: boolean;
}

export interface ExecutionResult {
  phaseResults: Map<string, any>;
  finalOutput: any;
  executionTime: number;
  success: boolean;
  errors?: string[];
}

@Injectable()
export class AgentCoordinationService {
  private readonly logger = new Logger(AgentCoordinationService.name);

  async executeCoordinatedQuery(
    query: string,
    analysis: QueryAnalysis,
    sessionId?: string,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const plan = this.createExecutionPlan(analysis);

    this.logger.log(
      `Executing coordinated query with ${plan.phases.length} phases`,
    );

    try {
      const phaseResults = new Map<string, any>();

      // Execute phases in order, respecting dependencies
      for (const phase of plan.phases) {
        const phaseResult = await this.executePhase(
          phase,
          query,
          phaseResults,
          sessionId,
        );
        phaseResults.set(phase.name, phaseResult);
      }

      // Combine results based on query type
      const finalOutput = await this.combineResults(analysis, phaseResults);

      return {
        phaseResults,
        finalOutput,
        executionTime: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Coordination failed: ${error.message}`);
      return {
        phaseResults: new Map(),
        finalOutput: null,
        executionTime: Date.now() - startTime,
        success: false,
        errors: [error.message],
      };
    }
  }

  private createExecutionPlan(analysis: QueryAnalysis): ExecutionPlan {
    const phases: ExecutionPhase[] = [];

    // Always include map generation if locations are detected
    const hasLocations =
      analysis.extractedEntities.locations &&
      analysis.extractedEntities.locations.length > 0;
    const shouldGenerateMap = analysis.requiresMapping || hasLocations;

    switch (analysis.type) {
      case QueryType.COMPREHENSIVE:
        phases.push({
          name: 'planning',
          agent: 'plannerAgent',
          tools: ['planTool'],
          dependencies: [],
          parallel: false,
        });
        phases.push({
          name: 'data_collection',
          agent: 'orchestratorAgent',
          tools: ['executePlanTool'],
          dependencies: ['planning'],
          parallel: false,
        });
        // Always generate map data for location-based queries
        if (shouldGenerateMap) {
          phases.push({
            name: 'map_generation',
            agent: 'mapDataAgent',
            tools: ['formatMapDataTool'],
            dependencies: ['data_collection'],
            parallel: true,
          });
        }
        // Always generate summary for comprehensive queries
        phases.push({
          name: 'summarization',
          agent: 'summarizerAgent',
          tools: ['summarizeTool'],
          dependencies: ['data_collection'],
          parallel: true,
        });
        break;

      case QueryType.MAP_DATA_ONLY:
        phases.push({
          name: 'planning',
          agent: 'plannerAgent',
          tools: ['planTool'],
          dependencies: [],
          parallel: false,
        });
        phases.push({
          name: 'geospatial_data',
          agent: 'mapDataAgent',
          tools: ['executePlanTool', 'formatMapDataTool'],
          dependencies: ['planning'],
          parallel: false,
        });
        break;

      case QueryType.SEARCH_ONLY:
        phases.push({
          name: 'direct_search',
          agent: 'orchestratorAgent',
          tools: ['planTool', 'executePlanTool'],
          dependencies: [],
          parallel: false,
        });
        // Add map generation for location-based searches
        if (shouldGenerateMap) {
          phases.push({
            name: 'map_generation',
            agent: 'mapDataAgent',
            tools: ['formatMapDataTool'],
            dependencies: ['direct_search'],
            parallel: false,
          });
        }
        break;

      case QueryType.ANALYTICS:
        phases.push({
          name: 'planning',
          agent: 'plannerAgent',
          tools: ['planTool'],
          dependencies: [],
          parallel: false,
        });
        phases.push({
          name: 'data_aggregation',
          agent: 'orchestratorAgent',
          tools: ['executePlanTool'],
          dependencies: ['planning'],
          parallel: false,
        });
        phases.push({
          name: 'analysis_summary',
          agent: 'summarizerAgent',
          tools: ['summarizeTool'],
          dependencies: ['data_aggregation'],
          parallel: false,
        });
        // Add map generation for analytics with locations
        if (shouldGenerateMap) {
          phases.push({
            name: 'map_generation',
            agent: 'mapDataAgent',
            tools: ['formatMapDataTool'],
            dependencies: ['data_aggregation'],
            parallel: true,
          });
        }
        break;
    }

    return {
      phases,
      estimatedDuration: this.estimateDuration(phases),
      parallelizable: phases.some((p) => p.parallel),
    };
  }

  private async executePhase(
    phase: ExecutionPhase,
    query: string,
    previousResults: Map<string, any>,
    sessionId?: string,
  ): Promise<any> {
    this.logger.log(
      `Executing phase: ${phase.name} with agent: ${phase.agent}`,
    );

    const agent = mastra.getAgent(phase.agent);
    if (!agent) {
      throw new Error(`Agent ${phase.agent} not found`);
    }

    // Prepare context from previous phases
    const context = this.buildPhaseContext(phase, previousResults);

    // Execute the agent with appropriate context
    const result = await agent.generate([
      {
        role: 'user',
        content: this.buildPhasePrompt(phase, query, context),
      },
    ]);

    return result;
  }

  private buildPhaseContext(
    phase: ExecutionPhase,
    previousResults: Map<string, any>,
  ): any {
    const context: any = {};

    for (const dependency of phase.dependencies) {
      const depResult = previousResults.get(dependency);
      if (depResult) {
        context[dependency] = depResult;
      }
    }

    return context;
  }

  private buildPhasePrompt(
    phase: ExecutionPhase,
    originalQuery: string,
    context: any,
  ): string {
    // For summarization phases, we need to structure the data properly for the summarizeTool
    if (phase.name === 'analysis_summary' || phase.name === 'summarization') {
      // Extract the data from previous phases for the summarize tool
      const dataForSummarization: any = {};
      
      // Get data from data collection, aggregation, or search phases
      if (context.data_aggregation) {
        dataForSummarization.data_aggregation = context.data_aggregation;
      }
      if (context.data_collection) {
        dataForSummarization.data_collection = context.data_collection;
      }
      if (context.direct_search) {
        dataForSummarization.direct_search = context.direct_search;
      }
      if (context.planning) {
        dataForSummarization.planning = context.planning;
      }

      // Return a structured prompt that will work with the summarizeTool
      return `Use the summarizeTool with the following parameters:
Query: "${originalQuery}"
Data: ${JSON.stringify(dataForSummarization)}

Please summarize the findings from the data collection phase in a clear, human-readable format.`;
    }

    // For other phases, use the original logic
    let prompt = `Original query: "${originalQuery}"\n\n`;

    if (Object.keys(context).length > 0) {
      prompt += `Previous phase results:\n`;
      for (const [phaseName, result] of Object.entries(context)) {
        prompt += `${phaseName}: ${JSON.stringify(result, null, 2)}\n`;
      }
      prompt += '\n';
    }

    switch (phase.name) {
      case 'planning':
        prompt += 'Create a detailed execution plan for this query.';
        break;
      case 'data_collection':
        prompt += 'Execute the plan and collect the required data.';
        break;
      case 'map_generation':
        prompt += 'Generate GeoJSON map data from the collected information.';
        break;
      case 'geospatial_data':
        prompt += 'Focus on geospatial data collection and GeoJSON formatting.';
        break;
      case 'direct_search':
        prompt += 'Perform a direct search and provide results.';
        break;
      case 'data_aggregation':
        prompt += 'Aggregate and analyze the data for statistical insights.';
        break;
    }

    return prompt;
  }

  private async combineResults(
    analysis: QueryAnalysis,
    phaseResults: Map<string, any>,
  ): Promise<any> {
    const combinedResult: any = {
      type: 'analysis',
      data: {
        summary: {
          queryType: analysis.type,
          extractedEntities: analysis.extractedEntities,
          analysis: {
            text: '',
            confidence: analysis.confidence,
          },
        },
        mapData: {
          type: 'FeatureCollection',
          features: [],
          bounds: null,
          center: null,
        },
      },
      metadata: {
        executionTime: 0,
        agentsUsed: analysis.suggestedAgents,
        toolsUsed: [],
        confidence: analysis.confidence,
        intent: this.getIntentFromQueryType(analysis.type),
        detectedEntities: analysis.extractedEntities.locations || [],
      },
      success: true,
      timestamp: new Date().toISOString(),
    };

    // Extract summary text from various sources
    let summaryText = '';
    if (phaseResults.has('summarization')) {
      const summaryResult = phaseResults.get('summarization');
      summaryText = this.extractTextFromResult(summaryResult);
    } else if (phaseResults.has('analysis_summary')) {
      const analysisResult = phaseResults.get('analysis_summary');
      summaryText = this.extractTextFromResult(analysisResult);
    } else if (phaseResults.has('direct_search')) {
      const searchResult = phaseResults.get('direct_search');
      summaryText = this.extractTextFromResult(searchResult);
    }

    combinedResult.data.summary.analysis.text = summaryText;

    // Extract and format map data for Mapbox
    if (phaseResults.has('map_generation')) {
      const mapResult = phaseResults.get('map_generation');

      // Check if the map result is already in the correct GeoJSON format
      if (mapResult && mapResult.type === 'FeatureCollection') {
        combinedResult.data.mapData = mapResult;
      } else if (mapResult && mapResult.text) {
        // Try to parse the text response as JSON
        try {
          const parsedMapData = JSON.parse(mapResult.text);
          if (parsedMapData.type === 'FeatureCollection') {
            combinedResult.data.mapData = parsedMapData;
          }
        } catch (e) {
        }
      } else {
        combinedResult.data.mapData = this.formatMapDataForMapbox(
          mapResult,
          analysis,
        );
      }
    } else if (phaseResults.has('geospatial_data')) {
      const mapResult = phaseResults.get('geospatial_data');
      combinedResult.data.mapData = this.formatMapDataForMapbox(
        mapResult,
        analysis,
      );
    }

    // Always try to generate map data from raw data if we have location entities but no map data
    if (
      (!combinedResult.data.mapData.features ||
        combinedResult.data.mapData.features.length === 0) &&
      analysis.extractedEntities.locations &&
      analysis.extractedEntities.locations.length > 0
    ) {
      const rawData =
        phaseResults.get('data_collection') ||
        phaseResults.get('direct_search') ||
        phaseResults.get('data_aggregation');
      if (rawData) {
        const generatedMapData = this.generateBasicMapData(rawData, analysis);
        if (generatedMapData.features && generatedMapData.features.length > 0) {
          combinedResult.data.mapData = generatedMapData;
        }
      }
    }

    // Store raw data for debugging (optional)
    if (
      phaseResults.has('data_collection') ||
      phaseResults.has('direct_search') ||
      phaseResults.has('data_aggregation')
    ) {
      combinedResult.rawData =
        phaseResults.get('data_collection') ||
        phaseResults.get('direct_search') ||
        phaseResults.get('data_aggregation');
    }

    return combinedResult;
  }

  private extractTextFromResult(result: any): string {
    if (typeof result === 'string') {
      return result;
    }
    if (result?.text) {
      return result.text;
    }
    if (result?.content) {
      return result.content;
    }
    if (result?.object?.text) {
      return result.object.text;
    }
    if (result?.messages && result.messages.length > 0) {
      const lastMessage = result.messages[result.messages.length - 1];
      if (lastMessage.content) {
        if (Array.isArray(lastMessage.content)) {
          return lastMessage.content.map((c: any) => c.text || c).join(' ');
        }
        return lastMessage.content;
      }
    }
    return JSON.stringify(result);
  }

  private formatMapDataForMapbox(mapResult: any, analysis: QueryAnalysis): any {
    // If already in proper GeoJSON format, return as-is
    if (mapResult?.type === 'FeatureCollection') {
      return {
        type: 'FeatureCollection',
        features: mapResult.features || [],
        bounds: this.calculateBounds(mapResult.features || []),
        center: this.calculateCenter(mapResult.features || []),
      };
    }

    // Extract GeoJSON from nested structure
    if (mapResult?.object?.geojson) {
      const geojson = mapResult.object.geojson;
      return {
        type: 'FeatureCollection',
        features: geojson.features || [],
        bounds: this.calculateBounds(geojson.features || []),
        center: this.calculateCenter(geojson.features || []),
      };
    }

    // Return empty FeatureCollection if no valid data
    return {
      type: 'FeatureCollection',
      features: [],
      bounds: null,
      center: null,
    };
  }

  private generateBasicMapData(rawData: any, analysis: QueryAnalysis): any {
    const features: any[] = [];

    // Extract location data from raw results - check multiple possible structures
    let dataToProcess = null;

    if (rawData?.object) {
      dataToProcess = rawData.object;
    } else if (rawData?.toolResults) {
      // Check if rawData has toolResults array
      const toolResult = rawData.toolResults.find(
        (tr: any) => tr.result && typeof tr.result === 'object',
      );
      if (toolResult && toolResult.result) {
        try {
          dataToProcess =
            typeof toolResult.result === 'string'
              ? JSON.parse(toolResult.result)
              : toolResult.result;
        } catch (e) {
          dataToProcess = toolResult.result;
        }
      }
    } else if (rawData?.toolCalls) {
      // Check toolCalls for data
      const toolCall = rawData.toolCalls.find(
        (tc: any) => tc.args && tc.args.data,
      );
      if (toolCall?.args?.data) {
        dataToProcess = toolCall.args.data;
      }
    }

    if (dataToProcess) {
      // Handle TomTom search results
      if (dataToProcess.tomtomFuzzySearchTool?.results) {
        dataToProcess.tomtomFuzzySearchTool.results.forEach(
          (result: any, index: number) => {
            if (result.position) {
              features.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [result.position.lon, result.position.lat],
                },
                properties: {
                  id: result.id || `point-${index}`,
                  name:
                    result.poi?.name ||
                    result.address?.freeformAddress ||
                    'Unknown Location',
                  category: result.poi?.categories?.[0] || 'location',
                  address: result.address?.freeformAddress || '',
                  score: result.score || 0,
                },
              });
            }
          },
        );
      }

      // Handle other tool results with location data
      Object.keys(dataToProcess).forEach((toolKey) => {
        const toolResult = dataToProcess[toolKey];
        if (toolResult?.results && Array.isArray(toolResult.results)) {
          toolResult.results.forEach((item: any, index: number) => {
            if (item.lat && item.lon) {
              features.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [item.lon, item.lat],
                },
                properties: {
                  id: item.id || `${toolKey}-${index}`,
                  name: item.name || item.title || 'Location',
                  category: item.category || toolKey.replace('Tool', ''),
                  source: toolKey,
                },
              });
            }
          });
        }
      });
    }

    return {
      type: 'FeatureCollection',
      features,
      bounds: this.calculateBounds(features),
      center: this.calculateCenter(features),
    };
  }

  private calculateBounds(features: any[]): any {
    if (!features || features.length === 0) return null;

    let minLat = Infinity,
      maxLat = -Infinity;
    let minLon = Infinity,
      maxLon = -Infinity;

    features.forEach((feature) => {
      if (feature.geometry?.type === 'Point') {
        const [lon, lat] = feature.geometry.coordinates;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
      }
    });

    if (minLat === Infinity) return null;

    return {
      north: maxLat,
      south: minLat,
      east: maxLon,
      west: minLon,
    };
  }

  private calculateCenter(features: any[]): any {
    if (!features || features.length === 0) return null;

    let totalLat = 0,
      totalLon = 0,
      count = 0;

    features.forEach((feature) => {
      if (feature.geometry?.type === 'Point') {
        const [lon, lat] = feature.geometry.coordinates;
        totalLat += lat;
        totalLon += lon;
        count++;
      }
    });

    if (count === 0) return null;

    return {
      lat: totalLat / count,
      lon: totalLon / count,
    };
  }

  private getIntentFromQueryType(queryType: QueryType): string {
    switch (queryType) {
      case QueryType.ANALYTICS:
        return 'analytics';
      case QueryType.MAP_DATA_ONLY:
        return 'mapping';
      case QueryType.SEARCH_ONLY:
        return 'search';
      case QueryType.LOCATION_BASED:
        return 'location';
      default:
        return 'comprehensive';
    }
  }

  private estimateDuration(phases: ExecutionPhase[]): number {
    // Simple estimation - could be enhanced with historical data
    const baseDuration = 2000; // 2 seconds base
    const phaseMultiplier = 1500; // 1.5 seconds per phase

    return baseDuration + phases.length * phaseMultiplier;
  }
}
