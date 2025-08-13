import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const getIpLocationTool = createTool({
  id: 'get-ip-location',
  description:
    'Get approximate location (latitude, longitude, city) based on the IP address of the request.',
  inputSchema: z.object({}), // No input needed, it uses the request's IP
  outputSchema: z.object({
    latitude: z.number(),
    longitude: z.number(),
    city: z.string().optional(),
  }),
  execute: async () => {
    const apiKey = process.env.IPSTACK_API_KEY;

    if (!apiKey) {
      throw new Error(
        'IPstack API key not found. Please set the IPSTACK_API_KEY environment variable.',
      );
    }

    const url = `http://api.ipstack.com/check?access_key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `IPstack API request failed with status ${response.status}`,
      );
    }

    const data = await response.json();

    if (data.latitude === null || data.longitude === null) {
      throw new Error('Could not determine precise location from IP address.');
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
    };
  },
});
