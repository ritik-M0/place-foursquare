import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const baseURL = 'https://api.predicthq.com/v1/events/';

export const searchEventsTool = createTool({
  id: 'search-events',
  description: 'Search for events using the PredictHQ API.',
  inputSchema: z.object({
    q: z.string().optional().describe('Keyword to search for (e.g., "concert", "festival")'),
    limit: z.number().optional().default(10).describe('Number of events to return'),
    country: z.string().optional().describe('Filter by 2-letter country code (e.g., "US", "GB")'),
    within: z.string().optional().describe('Filter by a radius around a latitude/longitude (e.g., "10km@-33.8688,151.2093")'),
    category: z.string().optional().describe('Filter by category (e.g., "concerts", "sports")'),
    'start.gte': z.string().optional().describe('Events that start on or after this date (YYYY-MM-DD)'),
    'start.lte': z.string().optional().describe('Events that start on or before this date (YYYY-MM-DD)'),
    sort: z.string().optional().describe('Sort order (e.g., "start", "-start", "rank")'),
  }),
  outputSchema: z.object({
    count: z.number(),
    results: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        category: z.string(),
        start: z.string(),
        end: z.string().nullable(),
        timezone: z.string().nullable(),
        country: z.string(),
        location: z.object({
            type: z.string(),
            coordinates: z.array(z.number()),
        }),
        address: z.object({
            formatted_address: z.string().nullable(),
            locality: z.string().nullable(),
            region: z.string().nullable(),
            postcode: z.string().nullable(),
        }).optional(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const { q, limit, country, within, category, 'start.gte': startGte, 'start.lte': startLte, sort } = context;
    const apiKey = process.env.PREDICTHQ_API_KEY;

    if (!apiKey) {
      throw new Error('PredictHQ API key not found. Please set the PREDICTHQ_API_KEY environment variable.');
    }

    const url = new URL(baseURL);
    if (q) url.searchParams.append('q', q);
    if (limit) url.searchParams.append('limit', limit.toString());
    if (country) url.searchParams.append('country', country);
    if (within) url.searchParams.append('within', within);
    if (category) url.searchParams.append('category', category);
    if (startGte) url.searchParams.append('start.gte', startGte);
    if (startLte) url.searchParams.append('start.lte', startLte);
    if (sort) url.searchParams.append('sort', sort);


    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Accept": "application/json"
        },
    });

    if (!response.ok) {
      throw new Error(`PredictHQ API request failed with status ${response.status}`);
    }

    const data = await response.json();

    const results = data.results.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        start: event.start,
        end: event.end,
        timezone: event.timezone,
        country: event.country,
        location: event.geo.geometry,
        address: event.geo.address,
    }));

    return {
        count: data.count,
        results,
    };
  },
});
