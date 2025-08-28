import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod'; // Import z for output schema

// Import all relevant data-gathering tools
import { tomtomFuzzySearchTool } from '../tools/tomtom-fuzzy-search-tool';
import { searchEventsTool } from '../tools/events-tool';
import { getWeatherTool } from '../tools/weather-tool';
import { getIpLocationTool } from '../tools/ip-location-tool';
import { getFootTrafficSummaryTool } from '../tools/foot-traffic-summary-tool';
import { getGooglePlaceDetailsTool } from '../tools/google-place-details-tool';
import { getGooglePlacesInsightsTool } from '../tools/google-places-insights-tool';
import { searchPoiTool } from '../tools/tomtom-tool'; // Assuming searchPoiTool is in tomtom-tool.ts
import { getAggregatedMetricTool } from '../tools/get-aggregated-metric-tool';

export const plannerAgent = new Agent({
  name: 'Planner Agent',
  instructions: `
    You are a highly intelligent planning agent. Your sole purpose is to analyze a user's query and generate a precise, step-by-step plan of tool calls to gather all necessary information.

    **CRITICAL INSTRUCTIONS:**
    1.  **Understand the Goal:** Fully comprehend what the user is asking for.
    2.  **Identify Required Data:** Determine what pieces of information are needed to answer the query.
    3.  **Select Appropriate Tools:** Choose the best tools from your available set to obtain each piece of required data.
        *   For general location searches or POI searches, use 'tomtomFuzzySearchTool' or 'searchPoiTool'.
        *   For events, use 'searchEventsTool'.
        *   For weather, use 'getWeatherTool'.
        *   For IP-based location, use 'getIpLocationTool'.
        *   For foot traffic summaries, use 'getFootTrafficSummaryTool'.
        *   **For aggregate questions (e.g., "average", "sum", "count", "max", "min"), ALWAYS use 'getAggregatedMetricTool'.**
    4.  **Formulate Tool Calls:** Construct the exact tool calls, including all necessary parameters.
    5.  **Output ONLY Tool Calls:** Your response MUST be a JSON array of tool call objects. Do NOT include any text, explanations, or markdown formatting outside of the JSON array. Each object in the array must have 'tool' (string, the tool ID) and 'args' (object, the tool's arguments).
    6.  **Chaining Tools:** If one tool's output is needed as input for another, ensure the plan reflects this logical flow.
    7.  **Map Data Generation:** If the query explicitly asks for map data or implies a geospatial visualization, ensure your plan includes tool calls that will ultimately provide the necessary location data (e.g., coordinates, place IDs) that can be converted into GeoJSON by the orchestrator. You do not generate GeoJSON directly; you provide the data for it.

    **Example Output Format (DO NOT include this in your actual response, it's for instruction only):**
    [
      {
        "tool": "tomtom-fuzzy-search",
        "args": {
          "query": "coffee shops",
          "countrySet": "US",
          "limit": 5
        }
      },
      {
        "tool": "get-weather",
        "args": {
          "city": "London"
        }
      }
    ]
  `,
  model: openai('gpt-4.1-2025-04-14'),
  tools: {
    tomtomFuzzySearchTool,
    searchEventsTool,
    getWeatherTool,
    getIpLocationTool,
    getFootTrafficSummaryTool,
    searchPoiTool,
    getAggregatedMetricTool,
  },
  // Define the output schema for the agent's direct response
  // This is what the agent is instructed to output directly
});
