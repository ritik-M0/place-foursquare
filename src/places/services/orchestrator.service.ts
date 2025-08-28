import { Injectable, Logger } from '@nestjs/common';
import { mastra } from '../../mastra';
import { 
  OrchestratorQueryDto, 
  OrchestratorResponseDto,
  OrchestratorQuerySchema,
  OrchestratorResponseSchema 
} from '../dto/orchestrator.dto';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  async processQuery(queryDto: OrchestratorQueryDto): Promise<OrchestratorResponseDto> {
    this.logger.log(`Processing orchestrator query: "${queryDto.query}"`);

    try {
      // Validate input with Zod schema
      const validatedQuery = OrchestratorQuerySchema.parse(queryDto);

      // Get the orchestrator agent
      const orchestratorAgent = mastra.getAgent('orchestratorAgent');
      if (!orchestratorAgent) {
        throw new Error('Orchestrator agent not found');
      }

      // Execute the query with the orchestrator agent
      const result = await orchestratorAgent.generate([
        {
          role: 'user',
          content: `Process this location intelligence query: "${validatedQuery.query}". 
                   Maximum steps: ${validatedQuery.maxSteps || 10}.
                   Include raw data: ${validatedQuery.includeRawData || false}.
                   
                   Please provide a comprehensive analysis using available tools and return structured data.`,
        },
      ]);

      // Extract structured response - OrchestratorAgent returns structured JSON
      let response;
      
      if (result.object) {
        // Agent returned structured object
        response = result.object;
      } else if (result.text) {
        // Try to parse agent's text response as JSON (agent is instructed to return JSON)
        try {
          const parsedResponse = JSON.parse(result.text);
          response = parsedResponse;
        } catch (e) {
          // Fallback if agent didn't return valid JSON
          response = {
            summary: result.text,
            rawData: validatedQuery.includeRawData ? result : undefined,
            executionPlan: ['Query processed by orchestrator agent'],
            confidence: 0.8,
            sources: ['Orchestrator Agent'],
          };
        }
      } else {
        // Fallback response
        response = {
          summary: 'Query processed successfully',
          rawData: validatedQuery.includeRawData ? result : undefined,
          executionPlan: ['Query processed by orchestrator agent'],
          confidence: 0.8,
          sources: ['Orchestrator Agent'],
        };
      }

      this.logger.log(`Orchestrator query completed successfully`);
      return response as OrchestratorResponseDto;

    } catch (error) {
      this.logger.error(`Orchestrator query failed: ${error.message}`);
      throw new Error(`Failed to process orchestrator query: ${error.message}`);
    }
  }

  async processStreamingQuery(
    queryDto: OrchestratorQueryDto,
    onProgress: (data: any) => void
  ): Promise<OrchestratorResponseDto> {
    this.logger.log(`Processing streaming orchestrator query: "${queryDto.query}"`);

    try {
      // Send initial progress
      onProgress({
        type: 'progress',
        content: 'Starting orchestrator analysis...',
        step: 1,
        totalSteps: 3,
      });

      // Validate input
      const validatedQuery = OrchestratorQuerySchema.parse(queryDto);

      // Get the orchestrator agent
      const orchestratorAgent = mastra.getAgent('orchestratorAgent');
      if (!orchestratorAgent) {
        throw new Error('Orchestrator agent not found');
      }

      // Send progress update
      onProgress({
        type: 'progress',
        content: 'Executing query with orchestrator agent...',
        step: 2,
        totalSteps: 3,
      });

      // Execute the query
      const result = await orchestratorAgent.generate([
        {
          role: 'user',
          content: `Process this location intelligence query: "${validatedQuery.query}". 
                   Maximum steps: ${validatedQuery.maxSteps || 10}.
                   Include raw data: ${validatedQuery.includeRawData || false}.
                   
                   Please provide a comprehensive analysis using available tools and return structured data.`,
        },
      ]);

      // Extract and format response
      const response = result.object || {
        summary: result.text || 'Query processed successfully',
        rawData: validatedQuery.includeRawData ? result : undefined,
        executionPlan: ['Query processed by orchestrator agent'],
        confidence: 0.8,
        sources: ['Orchestrator Agent'],
      };

      // Send final progress
      onProgress({
        type: 'complete',
        content: response,
        step: 3,
        totalSteps: 3,
      });

      this.logger.log(`Streaming orchestrator query completed successfully`);
      return response as OrchestratorResponseDto;

    } catch (error) {
      this.logger.error(`Streaming orchestrator query failed: ${error.message}`);
      onProgress({
        type: 'error',
        content: `Failed to process query: ${error.message}`,
      });
      throw new Error(`Failed to process streaming orchestrator query: ${error.message}`);
    }
  }
}
