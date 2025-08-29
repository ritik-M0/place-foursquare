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
    const matches: string[] = [];
    
    // Enhanced location patterns
    const patterns = [
      // Landmarks and parks: "Millennium Park", "Central Park", "Golden Gate Bridge"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Park|Bridge|Plaza|Square|Center|Mall|Tower|Building|Stadium|Arena|Museum|Library|University|College|Airport|Station))/gi,
      // Preposition + location: "in Austin", "near London", "at New York", "around Chicago"
      /\b(?:in|near|at|around|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      // City, State pattern: "Chicago, Illinois", "Austin, Texas"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      // Direct city/state mentions with state names
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Texas|California|New York|Florida|Illinois|Ohio|Georgia|North Carolina|Michigan|New Jersey|Virginia|Washington|Arizona|Massachusetts|Tennessee|Indiana|Missouri|Maryland|Wisconsin|Colorado|Minnesota|South Carolina|Alabama|Louisiana|Kentucky|Oregon|Oklahoma|Connecticut|Utah|Iowa|Nevada|Arkansas|Mississippi|Kansas|New Mexico|Nebraska|West Virginia|Idaho|Hawaii|New Hampshire|Maine|Montana|Rhode Island|Delaware|South Dakota|North Dakota|Alaska|Vermont|Wyoming|DC)))/g,
      // Coordinates pattern: "30.264979, -97.746598"
      /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/g,
      // Address-like patterns: "123 Main St"
      /\d+\s+[A-Z][a-z]+(?:\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Pl|Place))/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        if (match[1] && match[2]) {
          // City, State pattern
          matches.push(`${match[1].trim()}, ${match[2].trim()}`);
        } else if (match[1]) {
          matches.push(match[1].trim());
        } else if (match[0]) {
          matches.push(match[0].trim());
        }
      }
    });

    // Major US cities (expanded list)
    const majorCities = [
      'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 
      'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville',
      'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis', 
      'seattle', 'denver', 'washington', 'boston', 'el paso', 'detroit', 'nashville',
      'portland', 'memphis', 'oklahoma city', 'las vegas', 'louisville', 'baltimore',
      'milwaukee', 'albuquerque', 'tucson', 'fresno', 'mesa', 'sacramento', 'atlanta',
      'kansas city', 'colorado springs', 'miami', 'raleigh', 'omaha', 'long beach',
      'virginia beach', 'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa',
      'new orleans', 'wichita', 'cleveland', 'bakersfield', 'aurora', 'anaheim',
      'honolulu', 'santa ana', 'corpus christi', 'riverside', 'lexington', 'stockton',
      'toledo', 'st. paul', 'newark', 'greensboro', 'plano', 'henderson', 'lincoln',
      'buffalo', 'jersey city', 'chula vista', 'fort wayne', 'orlando', 'st. petersburg',
      'chandler', 'laredo', 'norfolk', 'durham', 'madison', 'lubbock', 'irvine',
      'winston-salem', 'glendale', 'garland', 'hialeah', 'reno', 'chesapeake',
      'gilbert', 'baton rouge', 'irving', 'scottsdale', 'north las vegas', 'fremont',
      'boise', 'richmond', 'san bernardino', 'birmingham', 'spokane', 'rochester',
      'des moines', 'modesto', 'fayetteville', 'tacoma', 'oxnard', 'fontana',
      'columbus', 'montgomery', 'moreno valley', 'shreveport', 'aurora', 'yonkers',
      'akron', 'huntington beach', 'little rock', 'augusta', 'amarillo', 'glendale',
      'mobile', 'grand rapids', 'salt lake city', 'tallahassee', 'huntsville',
      'grand prairie', 'knoxville', 'worcester', 'newport news', 'brownsville'
    ];
    
    const lowerQuery = query.toLowerCase();
    
    majorCities.forEach(city => {
      if (lowerQuery.includes(city)) {
        matches.push(city.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
      }
    });
    
    return [...new Set(matches)]; // Remove duplicates
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
    const locationBased = this.extractLocations(query).length > 0;
    const businessAnalysis = ['area', 'around', 'near', 'location', 'suitability', 'competition', 'analyze'].some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    
    return mapIndicators.some(indicator => query.includes(indicator)) || locationBased || businessAnalysis;
  }

  private requiresSummary(query: string): boolean {
    const summaryIndicators = ['tell me', 'explain', 'describe', 'what', 'how'];
    return summaryIndicators.some(indicator => query.includes(indicator));
  }
}
