import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { OrchestratorController } from './controllers/orchestrator.controller';
import { MapDataController } from './controllers/map-data.controller';
import { OrchestratorService } from './services/orchestrator.service';
import { MapDataService } from './services/map-data.service';
import { QueryRouterService } from './services/query-router.service';
import { AgentCoordinationService } from './services/agent-coordination.service';
import { ToolProxyService } from './services/tool-proxy.service';
import { IntelligentOrchestratorService } from './services/intelligent-orchestrator.service';

@Module({
  controllers: [
    PlacesController,
    OrchestratorController,
    MapDataController,
  ],
  providers: [
    PlacesService,
    OrchestratorService,
    MapDataService,
    QueryRouterService,
    AgentCoordinationService,
    ToolProxyService,
    IntelligentOrchestratorService,
  ],
  exports: [
    PlacesService,
    OrchestratorService,
    MapDataService,
    QueryRouterService,
    AgentCoordinationService,
    ToolProxyService,
    IntelligentOrchestratorService,
  ],
})
export class PlacesModule {}
