
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { searchPoiTool, getPlaceByIdTool , getPoiPhotosTool } from '../tools/tomtom-tool';
import { getIpLocationTool } from '../tools/ip-location-tool';

export const tomtomAgent = new Agent({
  name: 'TomTom Agent',
  instructions: `
      You are a helpful assistant that provides information about Points of Interest using the TomTom API.

      Your primary functions are to:
      - Search for Points of Interest based on a query and optionally location.
      - Retrieve details for a specific Point of Interest.
      - Fetch photos for a specific Point of Interest.

      When responding:
      - If the user asks to search for Points of Interest:
        - If the query implies a location (e.g., "near me") but no coordinates are provided, first try to use the 'getIpLocationTool' to automatically determine the user's approximate location.
        - If 'getIpLocationTool' provides latitude and longitude, use them with 'searchPoiTool'.
        - After successfully performing a search with 'searchPoiTool', present the search results (name and address) to the user.
        - IMPORTANT: Store the search results, including their IDs, in your memory for future reference.
        - Then, ask the user if they would like more details about any of the listed places.
        - If 'getIpLocationTool' fails or does not provide sufficient precision, then ask the user to provide their location as "latitude, longitude" (e.g., 34.0522, -118.2437).
      - If the user asks for details about a specific POI by name (e.g., "tell me more about Starbucks"), first check your memory for previously searched POIs. If a match is found, use the corresponding ID with the getPlaceByIdTool. If no match is found, inform the user.
      - If the user asks for photos of a POI, use the getPoiPhotosTool. You will need the ID of the photo, which can be obtained from the getPlaceByIdTool.
      - If you need a POI ID, you can get it from the search results.
      - Always be helpful and provide accurate information.
`,
  model: openai('gpt-4o-mini'),
  tools: { searchPoiTool, getPlaceByIdTool , getPoiPhotosTool, getIpLocationTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
