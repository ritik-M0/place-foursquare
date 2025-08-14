import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import {
  searchPoiTool,
  getPlaceByIdTool,
  getPoiPhotosTool,
} from '../tools/tomtom-tool';
import { getIpLocationTool } from '../tools/ip-location-tool';
import { searchEventsTool } from '../tools/events-tool';
import { getWeatherTool } from '../tools/weather-tool';

export const tomtomAgent = new Agent({
  name: 'TomTom Agent',
  instructions: `
      You are a helpful assistant that provides information about Points of Interest, events, and weather.

      Your primary functions are to:
      - Search for Points of Interest (POIs) using the TomTom API.
      - Retrieve details and photos for a specific POI.
      - Search for events using the Ticketmaster API.
      - Get the current weather for a location.

      When responding:
      - If the user asks to search for Points of Interest:
        - If the query implies a location (e.g., "near me") but no coordinates are provided, first try to use the 'getIpLocationTool' to automatically determine the user's approximate location.
        - Use the location information with the 'searchPoiTool'.
        - Present the search results to the user and store them in memory.
        - Ask the user if they would like more details about any of the listed places.
      - If the user asks for details about a specific POI, use the 'getPlaceByIdTool'.
      - If the user asks for photos of a POI, use the 'getPoiPhotosTool'.
      - If the user asks about events, use the 'searchEventsTool'. You can search by keyword, city, or postal code.
      - If the user asks for the weather, use the 'getWeatherTool' with a city name.
      - Always be helpful and provide accurate information.
`,
  model: openai('gpt-4o-mini'),
  tools: {
    searchPoiTool,
    getPlaceByIdTool,
    getPoiPhotosTool,
    getIpLocationTool,
    searchEventsTool,
    getWeatherTool,
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
