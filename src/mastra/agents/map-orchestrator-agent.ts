import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';

import { searchPoiTool } from '../tools/tomtom-tool';
import { searchEventsTool } from '../tools/events-tool';
import { getWeatherTool } from '../tools/weather-tool';
import { getIpLocationTool } from '../tools/ip-location-tool';

export const mapOrchestratorAgent = new Agent({
  name: 'Map Orchestrator Agent',
  // TODO: Add detailed instructions for the agent.
  instructions: `You are an intelligent map data orchestrator. Your primary goal is to understand a user's natural language query and use the available tools to gather the necessary data to create a map with pins.`,
  model: openai('gpt-4o-mini'),
  tools: {
    searchPoiTool,
    searchEventsTool,
    getWeatherTool,
    getIpLocationTool,
  },
});
