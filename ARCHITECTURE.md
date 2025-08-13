# Location Intelligence Platform - Architecture

## Overview

This location intelligence platform leverages AI agents to process natural language queries about locations and provides comprehensive insights by orchestrating multiple APIs. Built with **Nest.js**, **Mastra** (agentic framework), **Prisma ORM**, and **PostgreSQL + PostGIS**, the system delivers intelligent location-based recommendations through an interactive **Mapbox GL JS** interface.

## Technology Stack

### Core Framework
- **Backend**: Nest.js (TypeScript)
- **AI Orchestration**: Mastra Framework (Agents, Workflows, Tools)
- **Database**: PostgreSQL + PostGIS with Prisma ORM
- **Frontend**: React/Next.js + Mapbox GL JS
- **Cache**: Redis for performance optimization

### External APIs
- **Foursquare Places API**: POI search, tips, and photos
- **TomTom Traffic API**: Real-time traffic incidents and congestion data
- **PredictHQ Events API**: Comprehensive global event data
- **OpenWeatherMap One Call API**: Weather data and forecasts

## Mastra Agent System

### Primary Agent
**Location Intelligence Agent**
- Master orchestrator processing natural language queries
- Maintains conversation context and user preferences
- Coordinates between specialized agents
- Generates comprehensive location intelligence reports

### Specialized Agents

**POI Discovery Agent**
- Foursquare API integration for place discovery
- Category-based filtering and search optimization
- Rating analysis and recommendation scoring
- Photo and tip aggregation for location insights

**Traffic Intelligence Agent**
- TomTom API integration for real-time traffic data
- Incident impact assessment and route analysis
- Accessibility scoring for locations
- Traffic pattern analysis and congestion predictions

**Event Intelligence Agent**
- PredictHQ API integration for global event data
- Event impact prediction on locations
- Crowd density estimation and business opportunity identification
- Event-location correlation analysis

**Weather Intelligence Agent**
- OpenWeatherMap API integration for weather data
- Current conditions and forecast analysis
- Weather impact assessment on foot traffic
- Seasonal pattern recognition for business insights

## API Integration

### Foursquare Places API
**Endpoints Used:**
- **Place Search**: `/v3/places/search` - Core POI discovery
- **Place Tips**: `/v3/places/{fsq_place_id}/tips` - Customer insights
- **Place Photos**: `/v3/places/{fsq_place_id}/photos` - Visual validation

**Use Cases:**
- Location discovery based on category, rating, popularity
- Customer sentiment analysis through tips
- Visual assessment through photos

### TomTom Traffic API
**Endpoints Used:**
- **Incident Details**: `/traffic/services/5/incidentDetails` - Real-time traffic incidents

**Use Cases:**
- Traffic incident mapping and visualization
- Location accessibility assessment
- Route optimization and planning
- Business impact prediction from traffic disruptions

### PredictHQ Events API
**Endpoints Used:**
- **Event Search**: `/v1/events/` - Comprehensive event discovery

**Use Cases:**
- Event-driven foot traffic predictions
- Business opportunity identification
- Marketing campaign planning around events
- Crowd impact assessment

### OpenWeatherMap One Call API
**Endpoints Used:**
- **Current Weather**: `/data/3.0/onecall` - Weather and forecasts

**Use Cases:**
- Weather impact on business performance
- Seasonal trend analysis
- Weather-based location recommendations
- Outdoor venue viability assessment

## Data Flow Architecture

### Query Processing Flow
1. **User Input** → Natural language query submission
2. **Agent Analysis** → Primary agent parses intent and entities
3. **Workflow Orchestration** → Triggers appropriate workflows
4. **API Orchestration** → Parallel/sequential API calls through tools
5. **Data Enrichment** → Results enhancement and correlation
6. **Intelligence Synthesis** → Comprehensive analysis generation
7. **Response Delivery** → Structured recommendations and insights

### Core Workflows

**Location Discovery Workflow**
- Parse natural language queries
- Execute place search with filters
- Enrich with weather, events, and traffic data
- Generate ranked recommendations

**POI Impact Analysis Workflow**
- Analyze location business potential
- Assess traffic accessibility patterns
- Evaluate event-driven opportunities
- Generate comprehensive business intelligence

**Real-time Monitoring Workflow**
- Continuous data updates for tracked locations
- Change detection and impact assessment
- Automated alerting for significant changes

## Database Schema Design

### Core Entities (Prisma Models)

**POI Model**
- Core place information with spatial geometry (PostGIS)
- Foursquare data integration
- Relationships to enrichment data

**Weather Enrichment**
- Time-series weather data linked to POIs
- Current conditions and forecasts
- Historical weather patterns

**Events Enrichment**
- Event data aggregated from PredictHQ
- Temporal queries for event-POI correlations
- Attendance and impact predictions

**Traffic Enrichment**
- Real-time traffic incidents from TomTom
- Historical traffic patterns
- Accessibility scoring data

**Spatial Indexing**
- GiST indexes for fast location queries
- Composite indexes on location + category
- Time-based partitioning for enrichment data
- Spatial Geointelligence on dashboard


OPENROUTER_API_KEY (infra)="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" OPENAI_API_KEY(infra)="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"