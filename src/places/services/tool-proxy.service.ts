import { Injectable, Logger } from '@nestjs/common';
import { mastra } from '../../mastra';

export interface ToolResult {
  data: any;
  cached: boolean;
  executionTime: number;
  toolName: string;
}

export interface CacheEntry {
  result: any;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class ToolProxyService {
  private readonly logger = new Logger(ToolProxyService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  // TomTom Tools
  async searchPoi(params: any, useCache = true): Promise<ToolResult> {
    return this.executeWithCache('searchPoiTool', params, useCache);
  }

  async fuzzySearch(params: any, useCache = true): Promise<ToolResult> {
    return this.executeWithCache('tomtomFuzzySearchTool', params, useCache);
  }

  async getPlaceById(params: any, useCache = true): Promise<ToolResult> {
    return this.executeWithCache('getPlaceByIdTool', params, useCache, 30 * 60 * 1000); // 30 min cache
  }

  async getPoiPhotos(params: any, useCache = true): Promise<ToolResult> {
    return this.executeWithCache('getPoiPhotosTool', params, useCache, 60 * 60 * 1000); // 1 hour cache
  }

  // Google Tools
  async getGooglePlaceDetails(params: any, useCache = true): Promise<ToolResult> {
    return this.executeWithCache('getGooglePlaceDetailsTool', params, useCache, 30 * 60 * 1000);
  }

  async getGooglePlacesInsights(params: any, useCache = true): Promise<ToolResult> {
    return this.executeWithCache('getGooglePlacesInsightsTool', params, useCache);
  }

  // Event & Weather Tools
  async searchEvents(params: any, useCache = true): Promise<ToolResult> {
    return this.executeWithCache('searchEventsTool', params, useCache, 15 * 60 * 1000); // 15 min cache
  }

  async getWeather(params: any, useCache = true): Promise<ToolResult> {
    return this.executeWithCache('getWeatherTool', params, useCache, 10 * 60 * 1000); // 10 min cache
  }

  // Analytics Tools
  async getFootTraffic(params: any, useCache = true): Promise<ToolResult> {
    return this.executeWithCache('getFootTrafficTool', params, useCache, 60 * 60 * 1000); // 1 hour cache
  }

  async getFootTrafficSummary(params: any, useCache = true): Promise<ToolResult> {
    return this.executeWithCache('getFootTrafficSummaryTool', params, useCache, 60 * 60 * 1000);
  }

  async getAggregatedMetric(params: any, useCache = false): Promise<ToolResult> {
    // Aggregated metrics usually shouldn't be cached as they depend on current data
    return this.executeWithCache('getAggregatedMetricTool', params, useCache);
  }

  // Utility Tools
  async getIpLocation(params: any, useCache = true): Promise<ToolResult> {
    return this.executeWithCache('getIpLocationTool', params, useCache, 24 * 60 * 60 * 1000); // 24 hour cache
  }

  // Batch execution for multiple tools
  async executeBatch(toolCalls: Array<{ toolName: string; params: any; useCache?: boolean }>): Promise<ToolResult[]> {
    const promises = toolCalls.map(call => 
      this.executeWithCache(call.toolName, call.params, call.useCache ?? true)
    );
    
    return Promise.all(promises);
  }

  // Execute tools in parallel for the same location/area
  async executeForLocation(
    location: { lat: number; lon: number; radius?: number },
    toolNames: string[],
    additionalParams: any = {}
  ): Promise<Map<string, ToolResult>> {
    const results = new Map<string, ToolResult>();
    
    const promises = toolNames.map(async (toolName) => {
      const params = { ...location, ...additionalParams };
      const result = await this.executeWithCache(toolName, params, true);
      results.set(toolName, result);
      return result;
    });

    await Promise.all(promises);
    return results;
  }

  private async executeWithCache(
    toolName: string,
    params: any,
    useCache: boolean,
    customTTL?: number
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(toolName, params);

    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < entry.ttl) {
        this.logger.debug(`Cache hit for ${toolName}`);
        return {
          data: entry.result,
          cached: true,
          executionTime: Date.now() - startTime,
          toolName,
        };
      } else {
        // Remove expired entry
        this.cache.delete(cacheKey);
      }
    }

    // Execute tool
    try {
      // Access tools through agents since mastra.getTool doesn't exist
      const orchestratorAgent = mastra.getAgent('orchestratorAgent');
      if (!orchestratorAgent) {
        throw new Error(`Orchestrator agent not found`);
      }

      this.logger.debug(`Executing tool via agent: ${toolName}`);
      const result = await orchestratorAgent.generate([
        {
          role: 'user',
          content: `Execute tool "${toolName}" with parameters: ${JSON.stringify(params)}`,
        },
      ]);

      // Cache result if caching is enabled
      if (useCache) {
        const ttl = customTTL || this.defaultTTL;
        this.cache.set(cacheKey, {
          result,
          timestamp: Date.now(),
          ttl,
        });
      }

      return {
        data: result.text || result,
        cached: false,
        executionTime: Date.now() - startTime,
        toolName,
      };
    } catch (error) {
      this.logger.error(`Tool execution failed for ${toolName}: ${error.message}`);
      throw error;
    }
  }

  private generateCacheKey(toolName: string, params: any): string {
    // Create a stable cache key from tool name and parameters
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    return `${toolName}:${Buffer.from(sortedParams).toString('base64')}`;
  }

  // Cache management methods
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Tool cache cleared');
  }

  getCacheStats(): { size: number; entries: Array<{ key: string; age: number; ttl: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.split(':')[0], // Just show tool name
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }

  // Clean expired entries
  cleanExpiredEntries(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  }
}
