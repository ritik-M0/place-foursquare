import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { z } from 'zod'; // Still needed for tool schemas

import { mapDataAgent } from './map-data-agent'; // Add this import

// Import the new tools
import { planTool } from '../tools/planner-tool';
import { executePlanTool } from '../tools/execute-plan-tool';
import { summarizeTool } from '../tools/summarizer-tool';

// Import ALL data-gathering tools that the OrchestratorAgent needs to expose
// so that executePlanTool can access them.
import { tomtomFuzzySearchTool } from '../tools/tomtom-fuzzy-search-tool';
import { searchEventsTool } from '../tools/events-tool';
import { getWeatherTool } from '../tools/weather-tool';
import { getIpLocationTool } from '../tools/ip-location-tool';
import { getFootTrafficSummaryTool } from '../tools/foot-traffic-summary-tool';
import { getGooglePlaceDetailsTool } from '../tools/google-place-details-tool';
import { getGooglePlacesInsightsTool } from '../tools/google-places-insights-tool';
import { searchPoiTool, getPlaceByIdTool, getPoiPhotosTool } from '../tools/tomtom-tool';
import { getAggregatedMetricTool } from '../tools/get-aggregated-metric-tool';
import { getFootTrafficTool } from '../tools/foot-traffic-tool'; // getFootTrafficSummaryTool uses this internally

export const orchestratorAgent = new Agent({
  name: 'Orchestrator Agent',
  instructions: `
    You are the central orchestrator agent. Your primary role is to manage the entire process of fulfilling a user's query by coordinating with specialized planning, execution, and summarization, and map data generation.

    **CRITICAL BEHAVIORAL RULES:**

    1.  **Plan Generation:** First, you MUST use the 'planTool' with the user's original query to generate a detailed, step-by-step plan of tool calls.
        *   Example: If the user asks "coffee shops in London and weather", you would call 
          planTool({ query: "coffee shops in London and weather" })
        .
    2.  **Data Collection:** Once you receive the plan from 'planTool', you MUST use the 'executePlanTool' with that generated plan to execute all the tool calls and gather all the necessary raw data.
        *   **IMPORTANT:** You MUST proceed to the next steps even if some tool calls within the plan fail. The 'executePlanTool' will return an object containing results for successful calls and error messages for failed ones.
        *   Example: If 
          planTool 
          returns 
          [{"tool": "tomtom-fuzzy-search", "args": { ... } }, {"tool": "get-weather", "args": { ... } }]
          , you would then call 
          executePlanTool({ plan: [{ "tool": "tomtom-fuzzy-search", "args": { ... } }, { "tool": "get-weather", "args": { ... } }] })
          .
    3.  **Map Data Generation:** After executing the plan and collecting raw data from 'executePlanTool', you MUST use the 'mapDataAgent' to generate GeoJSON data from the collected raw data.
        *   CRITICAL: Pass the EXACT results object from executePlanTool as the 'rawData' parameter to mapDataAgent.
        *   Example: If executePlanTool returns { "tomtom-fuzzy-search": {...}, "searchPoiTool": {...} }, you would then call mapDataAgent.generate({ query: original_query, rawData: { "tomtom-fuzzy-search": {...}, "searchPoiTool": {...} } }) 
    4.  **Summarization:** After executing the plan and collecting all raw data from 'executePlanTool', you MUST use the 'summarizeTool' with the original user query and the collected raw data to generate a concise, human-readable summary of the findings.
        *   Example: If 
          executePlanTool 
          returns 
          { "tomtom-fuzzy-search": {...}, "get-weather": {...} }
          , you would then call 
          summarizeTool({ query: "coffee shops in London and weather", data: { "tomtom-fuzzy-search": {...}, "get-weather": {...} } }) 
    5.  **Final Output:** Your final response to the user MUST be a JSON object containing both the text summary and the GeoJSON data.
        *   The JSON object MUST have two keys: "summary" (string) and "map_data" (GeoJSON FeatureCollection object).
        *   Example: { "summary": "...", "map_data": { "type": "FeatureCollection", "features": [...] } }

    **Important Note:** You must follow these steps sequentially. Do not skip steps or try to combine them.
  `,
  model: openai('gpt-4.1-2025-04-14'),
  tools: {
    // Orchestration tools
    planTool,
    executePlanTool,
    summarizeTool,

    // All data-gathering tools must be exposed here so executePlanTool can access them.
    // The LLM will decide when to call planTool, executePlanTool, and summarizeTool.
    // The executePlanTool will then use these tools programmatically.
    tomtomFuzzySearchTool,
    searchEventsTool,
    getWeatherTool,
    getIpLocationTool,
    getFootTrafficSummaryTool,
    getGooglePlaceDetailsTool,
    getGooglePlacesInsightsTool,
    searchPoiTool,
    getPlaceByIdTool,
    getPoiPhotosTool,
    getAggregatedMetricTool,
    getFootTrafficTool,
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
  // The agent's output will be the text generated by the LLM based on its instructions.
  // If structured output is desired, the caller of this agent will need to use
  // the structuredOutput option in the generate() call.
});
