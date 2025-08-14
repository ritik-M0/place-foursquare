import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const baseURL = 'https://app.ticketmaster.com/discovery/v2/events.json';

export const searchEventsTool = createTool({
  id: 'search-events',
  description: 'Search for events using the Ticketmaster API',
  inputSchema: z.object({
    keyword: z.string().optional().describe('Keyword to search for (e.g., "concert", "music festival")'),
    city: z.string().optional().describe('City to search for events in'),
    postalCode: z.string().optional().describe('Postal code to search for events in'),
    size: z.number().optional().default(5).describe('Number of events to return'),
  }),
  outputSchema: z.object({
    events: z.array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        dates: z.object({
          start: z.object({
            localDate: z.string(),
            localTime: z.string().optional(),
          }),
        }),
        venues: z.array(
            z.object({
                name: z.string(),
                city: z.object({
                    name: z.string(),
                }),
                address: z.object({
                    line1: z.string(),
                }),
            })
        ).optional(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const { keyword, city, postalCode, size } = context;
    const apiKey = process.env.TICKETMASTER_API_KEY;

    if (!apiKey) {
      throw new Error('Ticketmaster API key not found. Please set the TICKETMASTER_API_KEY environment variable.');
    }

    const url = new URL(baseURL);
    url.searchParams.append('apikey', apiKey);
    url.searchParams.append('size', size.toString());

    if (keyword) url.searchParams.append('keyword', keyword);
    if (city) url.searchParams.append('city', city);
    if (postalCode) url.searchParams.append('postalCode', postalCode);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Ticketmaster API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data._embedded && data._embedded.events) {
        const events = data._embedded.events.map((event: any) => ({
            name: event.name,
            url: event.url,
            dates: {
                start: {
                    localDate: event.dates.start.localDate,
                    localTime: event.dates.start.localTime,
                },
            },
            venues: event._embedded?.venues?.map((venue: any) => ({
                name: venue.name,
                city: {
                    name: venue.city.name,
                },
                address: {
                    line1: venue.address.line1,
                },
            })),
        }));
        return { events };
    }

    return { events: [] };
  },
});
