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
    sessionId?: string
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const plan = this.createExecutionPlan(analysis);
    
    this.logger.log(`Executing coordinated query with ${plan.phases.length} phases`);
    
    try {
      const phaseResults = new Map<string, any>();
      
      // Execute phases in order, respecting dependencies
      for (const phase of plan.phases) {
        const phaseResult = await this.executePhase(phase, query, phaseResults, sessionId);
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
        if (analysis.requiresMapping) {
          phases.push({
            name: 'map_generation',
            agent: 'mapDataAgent',
            tools: ['formatMapDataTool'],
            dependencies: ['data_collection'],
            parallel: true,
          });
        }
        if (analysis.requiresSummary) {
          phases.push({
            name: 'summarization',
            agent: 'summarizerAgent',
            tools: ['summarizeTool'],
            dependencies: ['data_collection'],
            parallel: true,
          });
        }
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
        break;
    }

    return {
      phases,
      estimatedDuration: this.estimateDuration(phases),
      parallelizable: phases.some(p => p.parallel),
    };
  }

  private async executePhase(
    phase: ExecutionPhase,
    query: string,
    previousResults: Map<string, any>,
    sessionId?: string
  ): Promise<any> {
    this.logger.log(`Executing phase: ${phase.name} with agent: ${phase.agent}`);

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

  private buildPhaseContext(phase: ExecutionPhase, previousResults: Map<string, any>): any {
    const context: any = {};
    
    for (const dependency of phase.dependencies) {
      const depResult = previousResults.get(dependency);
      if (depResult) {
        context[dependency] = depResult;
      }
    }

    return context;
  }

  private buildPhasePrompt(phase: ExecutionPhase, originalQuery: string, context: any): string {
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
      case 'summarization':
        prompt += 'Create a comprehensive summary of the findings.';
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
      case 'analysis_summary':
        prompt += 'Summarize the analytical findings in a clear format.';
        break;
    }

    return prompt;
  }

  private async combineResults(analysis: QueryAnalysis, phaseResults: Map<string, any>): Promise<any> {
    const combinedResult: any = {
      queryType: analysis.type,
      extractedEntities: analysis.extractedEntities,
    };

    // Combine results based on what phases were executed
    if (phaseResults.has('summarization')) {
      combinedResult.summary = phaseResults.get('summarization');
    }

    if (phaseResults.has('map_generation') || phaseResults.has('geospatial_data')) {
      combinedResult.mapData = phaseResults.get('map_generation') || phaseResults.get('geospatial_data');
    }

    if (phaseResults.has('data_collection') || phaseResults.has('direct_search')) {
      combinedResult.rawData = phaseResults.get('data_collection') || phaseResults.get('direct_search');
    }

    if (phaseResults.has('analysis_summary')) {
      combinedResult.analysis = phaseResults.get('analysis_summary');
    }

    return combinedResult;
  }

  private estimateDuration(phases: ExecutionPhase[]): number {
    // Simple estimation - could be enhanced with historical data
    const baseDuration = 2000; // 2 seconds base
    const phaseMultiplier = 1500; // 1.5 seconds per phase
    
    return baseDuration + (phases.length * phaseMultiplier);
  }
}
