import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const tomtomApiVersion = '2';
const baseURL = 'https://api.tomtom.com';

export const getPoiDetailsTool = createTool({
  id: 'get-poi-details',
  description: 'Get additional details for a Point of Interest (POI) using its ID, such as ratings, price range, photos, and reviews.',
  inputSchema: z.object({
    id: z.string().describe('POI id, previously retrieved from the poiDetails section at the bottom of the Search response.'),
    sourceName: z.string().optional().describe('Name of an external data provider. Required only for MultiNet-R customers.'),
  }),
  outputSchema: z.object({
    id: z.string().optional(),
    result: z.object({
        id: z.string().optional(),
        rating: z.object({
            totalRatings: z.number().optional(),
            value: z.number().optional(),
        }).optional(),
        priceRange: z.number().optional(),
        photos: z.array(z.object({
            id: z.string().optional(),
        })).optional(),
        reviews: z.array(z.object({
            text: z.string().optional(),
            authorName: z.string().optional(),
            publicationDate: z.string().optional(),
            language: z.string().optional(),
        })).optional(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    const { id, sourceName } = context;
    const apiKey = process.env.TOMTOM_API_KEY;

    if (!apiKey) {
      throw new Error(
        'TomTom API key not found. Please set the TOMTOM_API_KEY environment variable.',
      );
    }

    const url = new URL(`${baseURL}/search/${tomtomApiVersion}/poiDetails.json`);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('id', id);

    if (sourceName) {
      url.searchParams.append('sourceName', sourceName);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `TomTom POI Details API request failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json();
    return data;
  },
});
