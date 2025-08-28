# 🏗️ ENTERPRISE BACKEND ARCHITECTURE FOR CHATBOT

## Directory Structure

```
src/
├── controllers/
│   ├── chat.controller.ts          # Main chatbot endpoint
│   ├── analytics.controller.ts     # Analytics & reporting endpoints
│   ├── maps.controller.ts          # Map data endpoints
│   └── health.controller.ts        # Health check endpoints
├── services/
│   ├── core/
│   │   ├── chat.service.ts         # Main chatbot orchestration
│   │   ├── query-analysis.service.ts   # Intent detection & routing
│   │   └── session.service.ts      # Session management
│   ├── ai/
│   │   ├── orchestrator-ai.service.ts  # AI orchestration wrapper
│   │   ├── map-ai.service.ts       # Map AI processing
│   │   ├── planner-ai.service.ts   # Planning AI wrapper
│   │   └── summarizer-ai.service.ts    # Summary AI wrapper
│   ├── external/
│   │   ├── tomtom.service.ts       # TomTom API integration
│   │   ├── google-places.service.ts    # Google Places integration
│   │   ├── events.service.ts       # PredictHQ integration
│   │   ├── weather.service.ts      # Weather API integration
│   │   └── traffic.service.ts      # Foot traffic integration
│   ├── data/
│   │   ├── geojson.service.ts      # GeoJSON processing
│   │   ├── aggregation.service.ts # Data aggregation
│   │   └── cache.service.ts        # Caching layer
│   └── utils/
│       ├── validation.service.ts   # Input validation
│       ├── rate-limiter.service.ts # Rate limiting
│       └── logger.service.ts       # Centralized logging
├── interfaces/
│   ├── chat.interface.ts           # Chat-related interfaces
│   ├── ai.interface.ts             # AI service interfaces
│   ├── external-api.interface.ts  # External API interfaces
│   └── geospatial.interface.ts     # Geospatial data interfaces
├── dto/
│   ├── chat/
│   │   ├── chat-request.dto.ts
│   │   ├── chat-response.dto.ts
│   │   └── session.dto.ts
│   ├── maps/
│   │   ├── map-request.dto.ts
│   │   └── geojson-response.dto.ts
│   └── analytics/
│       ├── analytics-request.dto.ts
│       └── analytics-response.dto.ts
├── enums/
│   ├── query-types.enum.ts
│   ├── response-types.enum.ts
│   └── ai-agents.enum.ts
├── config/
│   ├── ai.config.ts                # AI configuration
│   ├── external-apis.config.ts     # External API configs
│   └── app.config.ts               # Application config
└── middleware/
    ├── auth.middleware.ts           # Authentication
    ├── rate-limit.middleware.ts     # Rate limiting
    └── logging.middleware.ts        # Request logging
```

## Key Design Decisions

### 1. Controller Layer Separation

- **ChatController**: Primary chatbot endpoint with streaming support
- **MapsController**: Dedicated map data endpoints for frontend map components
- **AnalyticsController**: Business intelligence and reporting endpoints
- **HealthController**: System health and monitoring

### 2. Service Layer Architecture

- **Core Services**: Business logic and orchestration
- **AI Services**: Thin wrappers around Mastra agents
- **External Services**: API integrations with proper error handling
- **Data Services**: Data processing and caching
- **Utility Services**: Cross-cutting concerns

### 3. Interface-Driven Design

- Clear contracts between all layers
- Easy testing and mocking
- Improved maintainability
- Better TypeScript support

### 4. Error Handling Strategy

- Global exception filters
- Service-level error handling
- Client-friendly error responses
- Comprehensive logging

### 5. Performance Optimizations

- Response caching
- Connection pooling
- Async processing
- Request timeout handling
- Rate limiting
