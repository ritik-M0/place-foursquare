import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const baseURL = 'https://api.openweathermap.org/data/2.5/weather';

export const getWeatherTool = createTool({
  id: 'get-weather',
  description: 'Get the current weather for a specific city',
  inputSchema: z.object({
    city: z
      .string()
      .describe('The city to get the weather for (e.g., "London", "New York")'),
  }),
  outputSchema: z.object({
    city: z.string(),
    temperature: z.number(),
    description: z.string(),
  }),
  execute: async ({ context }) => {
    const { city } = context;
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OpenWeatherMap API key not found. Please set the OPENWEATHERMAP_API_KEY environment variable.',
      );
    }

    const url = new URL(baseURL);
    url.searchParams.append('q', city);
    url.searchParams.append('appid', apiKey);
    url.searchParams.append('units', 'metric'); // Use metric units for temperature

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `OpenWeatherMap API request failed with status ${response.status}`,
      );
    }

    const data = await response.json();

    return {
      city: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
    };
  },
});
