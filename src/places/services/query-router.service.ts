import { Injectable, Logger } from '@nestjs/common';

export enum QueryType {
  SEARCH_ONLY = 'search_only',
  MAP_DATA_ONLY = 'map_data_only',
  COMPREHENSIVE = 'comprehensive',
  ANALYTICS = 'analytics',
  LOCATION_BASED = 'location_based',
}

export interface QueryAnalysis {
  type: QueryType;
  confidence: number;
  suggestedAgents: string[];
  extractedEntities: {
    locations?: string[];
    categories?: string[];
    metrics?: string[];
    timeframes?: string[];
  };
  requiresMapping: boolean;
  requiresSummary: boolean;
}

@Injectable()
export class QueryRouterService {
  private readonly logger = new Logger(QueryRouterService.name);

  analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    // Extract entities
    const locations = this.extractLocations(query);
    const categories = this.extractCategories(query);
    const metrics = this.extractMetrics(query);
    const timeframes = this.extractTimeframes(query);

    // Determine query type and routing
    const analysis: QueryAnalysis = {
      type: this.classifyQueryType(lowerQuery),
      confidence: 0.8, // Could be enhanced with ML model
      suggestedAgents: [],
      extractedEntities: {
        locations,
        categories,
        metrics,
        timeframes,
      },
      requiresMapping: this.requiresMapping(lowerQuery),
      requiresSummary: this.requiresSummary(lowerQuery),
    };

    // Determine which agents to use
    analysis.suggestedAgents = this.determineAgents(analysis);

    this.logger.log(`Query analyzed: ${analysis.type} (confidence: ${analysis.confidence})`);
    return analysis;
  }

  private classifyQueryType(query: string): QueryType {
    const mapKeywords = ['map', 'show on map', 'geojson', 'coordinates', 'plot', 'visualize'];
    const analyticsKeywords = ['average', 'count', 'sum', 'how many', 'statistics', 'foot traffic', 'busy'];
    const searchKeywords = ['find', 'search', 'look for', 'locate'];

    if (mapKeywords.some(keyword => query.includes(keyword))) {
      return QueryType.MAP_DATA_ONLY;
    }
    
    if (analyticsKeywords.some(keyword => query.includes(keyword))) {
      return QueryType.ANALYTICS;
    }

    if (searchKeywords.some(keyword => query.includes(keyword)) && 
        !query.includes('weather') && !query.includes('events')) {
      return QueryType.SEARCH_ONLY;
    }

    return QueryType.COMPREHENSIVE;
  }

  private determineAgents(analysis: QueryAnalysis): string[] {
    const agents: string[] = [];

    switch (analysis.type) {
      case QueryType.MAP_DATA_ONLY:
        agents.push('mapDataAgent');
        break;
      case QueryType.SEARCH_ONLY:
        agents.push('orchestratorAgent');
        break;
      case QueryType.COMPREHENSIVE:
        agents.push('orchestratorAgent');
        if (analysis.requiresMapping) {
          agents.push('mapDataAgent');
        }
        break;
      case QueryType.ANALYTICS:
        agents.push('orchestratorAgent');
        break;
      case QueryType.LOCATION_BASED:
        agents.push('orchestratorAgent', 'mapDataAgent');
        break;
    }

    return agents;
  }

  private extractLocations(query: string): string[] {
    // Simple regex-based extraction - could be enhanced with NER
    const locationPattern = /\b(?:in|near|at|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
    const matches = [];
    let match;
    
    while ((match = locationPattern.exec(query)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  }

  private extractCategories(query: string): string[] {
    const commonCategories = [
      'restaurant', 'cafe', 'coffee shop', 'hotel', 'gas station',
      'pharmacy', 'hospital', 'bank', 'atm', 'grocery store'
    ];
    
    return commonCategories.filter(category => 
      query.toLowerCase().includes(category)
    );
  }

  private extractMetrics(query: string): string[] {
    const metricKeywords = ['average', 'count', 'sum', 'max', 'min', 'total'];
    return metricKeywords.filter(metric => 
      query.toLowerCase().includes(metric)
    );
  }

  private extractTimeframes(query: string): string[] {
    const timeKeywords = ['today', 'tomorrow', 'this week', 'weekend', 'next week'];
    return timeKeywords.filter(time => 
      query.toLowerCase().includes(time)
    );
  }

  private requiresMapping(query: string): boolean {
    const mapIndicators = ['map', 'show', 'plot', 'visualize', 'geojson', 'coordinates'];
    return mapIndicators.some(indicator => query.includes(indicator));
  }

  private requiresSummary(query: string): boolean {
    const summaryIndicators = ['tell me', 'explain', 'describe', 'what', 'how'];
    return summaryIndicators.some(indicator => query.includes(indicator));
  }
}
