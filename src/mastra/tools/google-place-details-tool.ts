import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const baseURL = 'https://places.googleapis.com/v1/places/';

export const getGooglePlaceDetailsTool = createTool({
  id: 'get-google-place-details',
  description: 'Get details for a specific place using its Google Place ID.',
  inputSchema: z.object({
    placeId: z.string().describe('The Google Place ID of the place.'),
    fields: z
      .array(z.string())
      .describe('The fields to return in the response.'),
  }),
  outputSchema: z.any().describe('The place details as a JSON object.'),
  execute: async ({ context }) => {
    const { placeId, fields } = context;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error(
        'Google API key not found. Please set the GOOGLE_API_KEY environment variable.',
      );
    }

    const url = new URL(`${baseURL}${placeId}`);
    url.searchParams.append('fields', fields.join(','));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Google Place Details API request failed with status ${response.status}: ${errorBody}`,
      );
    }

    return await response.json();
  },
});
