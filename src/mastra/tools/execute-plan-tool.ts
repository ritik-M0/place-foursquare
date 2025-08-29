import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
// No need to import Mastra type directly if we're casting to 'any' for getTool/getAgent access
// import { Mastra } from '@mastra/core/mastra';

export const executePlanTool = createTool({
  id: 'execute-plan',
  description: 'Executes a structured plan of tool calls and returns their combined results.',
  inputSchema: z.object({
    plan: z.array(
      z.object({
        tool: z.string().describe('The ID of the tool to call.'),
        args: z.record(z.any()).optional().default({}).describe('The arguments for the tool call.'),
      })
    ).describe('A JSON array representing the plan of tool calls to execute.')
  }),
  outputSchema: z.record(z.any()).describe('A JSON object containing the results of all executed tool calls, keyed by tool ID or unique identifier.'),
  execute: async ({ context, mastra }) => {
    const plan = context.plan;
    const results: Record<string, any> = {};

    // CRITICAL FIX: Don't call executePlanTool recursively!
    // Skip execution if the tool being called is executePlanTool itself
    for (const toolCall of plan) {
      let toolId = toolCall.tool;
      // Remove "functions." prefix if present
      if (toolId.startsWith('functions.')) {
        toolId = toolId.substring('functions.'.length);
      }
      const toolArgs = toolCall.args || {};

      // PREVENT INFINITE LOOP: Skip if trying to call executePlanTool
      if (toolId === 'execute-plan' || toolId === 'executePlanTool') {
        results[toolId] = { error: 'Recursive call prevented' };
        continue;
      }

      try {
        let toolInstance = null;
        
        // Import tools directly from their modules instead of trying to access through Mastra
        switch (toolId) {
          case 'tomtomFuzzySearchTool':
            const { tomtomFuzzySearchTool } = await import('../tools/tomtom-fuzzy-search-tool.js');
            toolInstance = tomtomFuzzySearchTool;
            break;
          case 'searchPoiTool':
            const { searchPoiTool } = await import('../tools/tomtom-tool.js');
            toolInstance = searchPoiTool;
            break;
          case 'getPlaceByIdTool':
            const { getPlaceByIdTool } = await import('../tools/tomtom-tool.js');
            toolInstance = getPlaceByIdTool;
            break;
          case 'getGooglePlaceDetailsTool':
            const { getGooglePlaceDetailsTool } = await import('../tools/google-place-details-tool.js');
            toolInstance = getGooglePlaceDetailsTool;
            break;
          case 'getGooglePlacesInsightsTool':
            const { getGooglePlacesInsightsTool } = await import('../tools/google-places-insights-tool.js');
            toolInstance = getGooglePlacesInsightsTool;
            break;
          case 'searchEventsTool':
            const { searchEventsTool } = await import('../tools/events-tool.js');
            toolInstance = searchEventsTool;
            break;
          case 'getIpLocationTool':
            const { getIpLocationTool } = await import('../tools/ip-location-tool.js');
            toolInstance = getIpLocationTool;
            break;
          case 'getWeatherTool':
            const { getWeatherTool } = await import('../tools/weather-tool.js');
            toolInstance = getWeatherTool;
            break;
          case 'getFootTrafficTool':
            const { getFootTrafficTool } = await import('../tools/foot-traffic-tool.js');
            toolInstance = getFootTrafficTool;
            break;
          case 'getFootTrafficSummaryTool':
            const { getFootTrafficSummaryTool } = await import('../tools/foot-traffic-summary-tool.js');
            toolInstance = getFootTrafficSummaryTool;
            break;
          case 'getPoiPhotosTool':
            const { getPoiPhotosTool } = await import('../tools/tomtom-tool.js');
            toolInstance = getPoiPhotosTool;
            break;
          case 'getAggregatedMetricTool':
            const { getAggregatedMetricTool } = await import('../tools/get-aggregated-metric-tool.js');
            toolInstance = getAggregatedMetricTool;
            break;
          default:
            break;
        }

        if (toolInstance && typeof toolInstance.execute === 'function') {
          // Call the tool directly with just the arguments - bypass Mastra's execution context
          const toolResult = await (toolInstance as any).execute({ context: toolArgs });
          results[toolId] = toolResult;
        } else {
          results[toolId] = {};
        }
      } catch (error: any) {
        results[toolId] = { error: error.message || 'Unknown error during tool execution' };
      }
    }
    
    return results;
  },
});