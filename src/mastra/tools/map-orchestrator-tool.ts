import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { mapOrchestratorAgent } from '../agents/map-orchestrator-agent';

const mapDataSchema = z.object({
  center: z.object({ lat: z.number(), lng: z.number() }),
  bounds: z.object({
    north: z.number(), south: z.number(),
    east: z.number(), west: z.number()
  }).optional(),
  layers: z.object({
    places: z.array(z.object({
      id: z.string(),
      type: z.literal('place'),
      coordinates: z.array(z.number()),
      properties: z.object({
        name: z.string(),
        address: z.string().optional(),
        category: z.string().optional(),
        relevance: z.number().optional()
      })
    })),
    googlePlaces: z.array(z.object({
        id: z.string(),
        type: z.literal('googlePlace'),
        coordinates: z.array(z.number()),
        properties: z.object({
            name: z.string(),
            address: z.string().optional(),
            rating: z.number().optional(),
            priceLevel: z.string().optional()
        })
    })).optional(),
    events: z.array(z.object({
      id: z.string(),
      type: z.literal('event'),
      coordinates: z.array(z.number()),
      properties: z.object({
        title: z.string(),
        category: z.string(),
        startDate: z.string(),
        endDate: z.string().optional(),
        rank: z.number().optional()
      })
    })),
    weather: z.array(z.object({
      id: z.string(),
      type: z.literal('weather'),
      coordinates: z.array(z.number()),
      properties: z.object({
        temperature: z.number(),
        condition: z.string(),
        location: z.string()
      })
    })),
    userLocation: z.object({
      id: z.string(),
      type: z.literal('user'),
      coordinates: z.array(z.number()),
      properties: z.object({
        city: z.string().optional(),
        isCurrentUser: z.boolean()
      })
    }).optional()
  })
});

export const getMapDataTool = createTool({
  id: 'get-map-data',
  description: 'Primary tool for all geographic analysis and visualization. Use this for any query that involves finding, analyzing, or showing locations on a map. It takes a natural language query and returns a complete GeoJSON object ready for plotting.',
  inputSchema: z.object({
    query: z.string().describe('The natural language query to search for (e.g., "restaurants in London", "parks near me").'),
  }),
  outputSchema: mapDataSchema,
  execute: async ({ context }) => {
    const { query } = context;

    const response = await mapOrchestratorAgent.generate(query);

    return JSON.parse(response.text);
  },
});
