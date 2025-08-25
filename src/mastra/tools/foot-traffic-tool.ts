import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const baseURL = 'https://besttime.app/api/v1/forecasts';

const venueInfoSchema = z.object({
  venue_address: z.string(),
  venue_id: z.string(),
  venue_name: z.string(),
  venue_timezone: z.string().optional(),
  venue_dwell_time_min: z.number().optional(),
  venue_dwell_time_max: z.number().optional(),
  venue_dwell_time_avg: z.number().optional(),
  venue_type: z.string().optional(),
  venue_types: z.array(z.string()).optional(),
  venue_lat: z.number(),
  venue_lon: z.number(),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  price_level: z.number().optional(),
});

const dayInfoSchema = z.object({
  day_int: z.number(),
  day_text: z.string(),
  venue_open_close_v2: z.any().optional(),
});

const analysisSchema = z.object({
  day_info: dayInfoSchema,
  day_raw: z.array(z.number()),
  peak_hours: z.array(z.any()).optional(),
  quiet_hours: z.array(z.number()).optional(),
  busy_hours: z.array(z.number()).optional(),
  surge_hours: z.any().optional(),
});

const successOutputSchema = z.object({
  status: z.string(),
  venue_info: venueInfoSchema,
  analysis: z.array(analysisSchema),
});

const errorOutputSchema = z.object({
  status: z.literal('Error'),
  message: z.string(),
});

export const getFootTrafficTool = createTool({
  id: 'get-foot-traffic-forecast',
  description: 'Get foot-traffic forecast for a venue based on a name and address.',
  inputSchema: z.object({
    venue_name: z.string().describe('The name of the venue (e.g., "McDonalds").'),
    venue_address: z.string().describe('The address of the venue (e.g., "Ocean Ave, San Francisco").'),
  }),
  outputSchema: z.union([successOutputSchema, errorOutputSchema]),
  execute: async ({ context }) => {
    const { venue_name, venue_address } = context;
    const apiKey = process.env.BESTTIME_API_KEY;

    if (!apiKey) {
      throw new Error('BestTime.app API key not found. Please set the BESTTIME_API_KEY environment variable.');
    }

    const params = new URLSearchParams({
      'api_key_private': apiKey,
      'venue_name': venue_name,
      'venue_address': venue_address,
    });

    const url = new URL(baseURL);
    url.search = params.toString();

    const response = await fetch(url.toString(), {
      method: 'POST',
    });

    if (!response.ok) {
      const errorBodyText = await response.text();
      if (response.status === 404) {
        let message = `Could not get a foot traffic forecast for '${venue_name}' at '${venue_address}'.`;
        try {
          const errorData = JSON.parse(errorBodyText);
          if (errorData.message) {
            message += ` Reason: ${errorData.message}`;
          }
        } catch (e) {
          // The body was not JSON, the generic message is sufficient.
        }
        return {
          status: 'Error',
          message: message
        };
      }
      throw new Error(`BestTime.app API request failed with status ${response.status}: ${errorBodyText}`);
    }

    const data = await response.json();
    return data;
  },
});
