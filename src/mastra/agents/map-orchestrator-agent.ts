import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';

import { tomtomFuzzySearchTool } from '../tools/tomtom-fuzzy-search-tool';
import { searchEventsTool } from '../tools/events-tool';
import { getWeatherTool } from '../tools/weather-tool';
import { getIpLocationTool } from '../tools/ip-location-tool';

export const mapOrchestratorAgent = new Agent({
  name: 'Map Orchestrator Agent',
  instructions: `
    You are a data processing agent. Your only purpose is to take a natural language query and return a single, valid GeoJSON FeatureCollection object. Do NOT include any text, explanations, or markdown formatting outside of the final JSON object.

    **CRITICAL INSTRUCTIONS:**
    1.  The final output **MUST** be a single, valid GeoJSON FeatureCollection object.
    2.  Use the available tools to gather data. Use 'tomtomFuzzySearchTool' for all place-related queries.
    3.  Each item (place, event, etc.) you find must be converted into a GeoJSON Feature object.
    4.  The geometry for each feature must be a Point.
    5.  The coordinates array for the geometry **MUST** be in the format [longitude, latitude].
    6.  All metadata (name, address, category, relevance, etc.) must go inside the properties object for each feature.
    7.  Add a layer property to each feature's properties to identify its type (e.g., "layer": "places", "layer": "events").

    **GeoJSON Output Example:**
    {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [-122.4194, 37.7749]
          },
          "properties": {
            "layer": "places",
            "name": "Example Cafe",
            "address": "123 Main St, San Francisco, CA",
            "category": "Restaurant",
            "relevance": 0.95
          }
        }
      ]
    }
  `,
  model: openai('gpt-4o-mini'),
  tools: {
    tomtomFuzzySearchTool,
    searchEventsTool,
    getWeatherTool,
    getIpLocationTool,
  },
});
