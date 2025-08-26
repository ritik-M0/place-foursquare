# Foursquare Places - Multi-Agent Workflow Guide

## Overview

The Foursquare Places platform implements a sophisticated multi-agent AI architecture that orchestrates multiple specialized agents to provide comprehensive location intelligence. This guide explains the complete workflow, architecture, and usage patterns.

## Architecture Components

### 1. Core Agents

#### **OrchestratorAgent**
- **Purpose**: Main coordinator for general queries and summaries
- **Model**: OpenAI GPT-4o-mini
- **Tools**: All geospatial and analytics tools
- **Role**: Executes complex queries, coordinates with other agents

#### **MapDataAgent**
- **Purpose**: Specialized for GeoJSON map data generation
- **Model**: OpenAI GPT-4o-mini
- **Tools**: Geospatial tools + formatMapDataTool
- **Role**: Converts location data into standardized GeoJSON format

#### **PlannerAgent**
- **Purpose**: Generates step-by-step execution plans
- **Model**: OpenAI GPT-4o-mini
- **Tools**: executePlanTool
- **Role**: Analyzes queries and creates structured execution plans

#### **SummarizerAgent**
- **Purpose**: Creates human-readable summaries
- **Model**: OpenAI GPT-4o-mini
- **Tools**: None (pure text processing)
- **Role**: Converts raw tool data into concise, actionable insights

### 2. Core Services

#### **IntelligentOrchestratorService**
Central coordination hub that combines:
- Query routing and analysis
- Agent coordination and execution
- Tool proxying and caching
- Response formatting and streaming

#### **QueryRouterService**
- Analyzes incoming queries for intent and entities
- Routes queries to appropriate agents based on keywords
- Extracts location entities, temporal references, and metrics

#### **AgentCoordinationService**
- Manages multi-phase execution workflows
- Coordinates between planning, execution, and summarization phases
- Handles context building and result combination

#### **ToolProxyService**
- Provides centralized tool execution with caching
- Implements parallel execution for performance
- Manages tool result formatting and error handling

## Workflow Examples

### Example 1: Natural Language Query

**Query**: "Find popular restaurants near Times Square with good foot traffic"

#### Phase 1: Query Analysis
```typescript
// QueryRouterService analyzes the query
{
  intent: "search_places",
  entities: {
    location: "Times Square",
    category: "restaurants",
    metrics: ["foot_traffic", "popularity"]
  },
  suggestedAgent: "orchestrator",
  confidence: 0.95
}
```

#### Phase 2: Planning
```typescript
// PlannerAgent generates execution plan
{
  steps: [
    {
      tool: "tomtomFuzzySearchTool",
      params: { query: "restaurants Times Square", limit: 20 }
    },
    {
      tool: "getFootTrafficTool", 
      params: { venues: "{{step1.results}}" }
    },
    {
      tool: "getGooglePlacesInsightsTool",
      params: { location: "Times Square", types: ["restaurant"] }
    }
  ]
}
```

#### Phase 3: Execution
```typescript
// AgentCoordinationService executes the plan
const results = await this.executeMultiPhase([
  { agent: 'planner', task: 'Generate execution plan' },
  { agent: 'orchestrator', task: 'Execute tools and gather data' },
  { agent: 'summarizer', task: 'Create human-readable summary' }
]);
```

#### Phase 4: Response
```json
{
  "summary": "Found 15 popular restaurants near Times Square. Top recommendations include Joe Allen (high foot traffic: 85%), Sardi's (tourist favorite), and The View (rotating restaurant with 90% popularity score).",
  "data": {
    "restaurants": [...],
    "footTraffic": {...},
    "insights": {...}
  },
  "metadata": {
    "executionTime": "2.3s",
    "toolsUsed": ["tomtomFuzzySearchTool", "getFootTrafficTool", "getGooglePlacesInsightsTool"],
    "confidence": 0.92
  }
}
```

### Example 2: GeoJSON Map Data Generation

**Query**: "Generate a map of coffee shops in Manhattan with their ratings"

#### Workflow
1. **MapDataService** receives the request
2. **MapDataAgent** processes the query using geospatial tools
3. **formatMapDataTool** converts results to GeoJSON FeatureCollection
4. Response includes standardized geographic data

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-73.9857, 40.7484]
      },
      "properties": {
        "name": "Blue Bottle Coffee",
        "rating": 4.5,
        "category": "coffee_shop",
        "address": "54 Mint Plaza, Manhattan"
      }
    }
  ],
  "metadata": {
    "totalFeatures": 45,
    "bounds": {
      "north": 40.7831,
      "south": 40.7074,
      "east": -73.9442,
      "west": -74.0200
    }
  }
}
```

## API Endpoints Usage

### 1. Chat Interface
```bash
# Natural language queries
POST /api/places/chat
{
  "query": "What are the busiest areas in downtown LA?",
  "sessionId": "user-123",
  "context": {}
}
```

### 2. Streaming Chat
```bash
# Real-time streaming responses
POST /api/places/chat/stream
# Returns Server-Sent Events for real-time updates
```

### 3. Orchestrator Queries
```bash
# Advanced orchestrated queries
POST /api/places/orchestrator/query
{
  "query": "Analyze foot traffic patterns around Central Park",
  "options": {
    "includeWeather": true,
    "includeEvents": true,
    "timeframe": "last_week"
  }
}
```

### 4. Map Data Generation
```bash
# GeoJSON map data
POST /api/places/map-data/generate
{
  "query": "Museums in Washington DC",
  "bounds": {
    "north": 38.9955,
    "south": 38.8031,
    "east": -76.9093,
    "west": -77.1190
  }
}
```

### 5. Batch Processing
```bash
# Process multiple queries
POST /api/places/orchestrator/query/batch
{
  "queries": [
    "Best pizza places in Brooklyn",
    "Tourist attractions in Manhattan",
    "Nightlife in Queens"
  ]
}
```

## External API Integration

### TomTom APIs
- **Fuzzy Search**: Advanced location search with geobias
- **POI Search**: Point of interest discovery
- **Place Details**: Comprehensive place information
- **Photos**: Visual content for places

### Google APIs
- **Places API**: Detailed place information and insights
- **Places Insights**: Area analysis and venue counts

### Analytics APIs
- **PredictHQ**: Event data and impact analysis
- **BestTime.app**: Foot traffic and busy hours
- **OpenWeatherMap**: Weather data correlation
- **IPstack**: IP-based geolocation

## Performance Features

### Caching Strategy
```typescript
// ToolProxyService implements intelligent caching
const cacheKey = `${toolName}:${JSON.stringify(params)}`;
const cached = this.cache.get(cacheKey);
if (cached && !this.isCacheExpired(cached)) {
  return cached.result;
}
```

### Parallel Execution
```typescript
// Multiple tools executed concurrently
const results = await Promise.all([
  this.executeTool('tomtomFuzzySearchTool', params1),
  this.executeTool('getWeatherTool', params2),
  this.executeTool('searchEventsTool', params3)
]);
```

### Streaming Responses
```typescript
// Real-time progress updates via Server-Sent Events
onProgress({
  type: 'progress',
  content: 'Analyzing location data...',
  progress: 45
});
```

## Error Handling

### Graceful Degradation
- If one API fails, others continue processing
- Partial results returned with error notifications
- Retry logic for transient failures

### Validation
- Input validation using Zod schemas
- Output validation for API responses
- GeoJSON validation for map data

## Development Setup

### Environment Variables
```bash
DATABASE_URL="postgresql://..."
TOMTOM_API_KEY="your_tomtom_key"
OPENAI_API_KEY="your_openai_key"
GOOGLE_API_KEY="your_google_key"
PREDICTHQ_API_KEY="your_predicthq_key"
BESTTIME_API_KEY="your_besttime_key"
OPENWEATHERMAP_API_KEY="your_weather_key"
IPSTACK_API_KEY="your_ipstack_key"
```

### Running the Application
```bash
# Install dependencies
pnpm install

# Start database
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev

# Access API documentation
open http://localhost:4000/api/docs
```

## Testing Examples

### Health Check
```bash
curl http://localhost:4000/api/health
```

### Simple Query
```bash
curl -X POST http://localhost:4000/api/places/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Find coffee shops near Central Park"}'
```

### Map Data
```bash
curl -X POST http://localhost:4000/api/places/map-data/generate \
  -H "Content-Type: application/json" \
  -d '{"query": "Parks in San Francisco"}'
```

## Best Practices

### Query Optimization
- Use specific location references
- Include relevant context and constraints
- Specify desired output format

### API Usage
- Implement proper error handling
- Use streaming for long-running queries
- Cache responses when appropriate

### Performance
- Batch similar queries together
- Use appropriate geographic bounds
- Limit result sets for better performance

This multi-agent architecture provides a robust, scalable foundation for location intelligence applications with comprehensive external API integration and intelligent query processing.
