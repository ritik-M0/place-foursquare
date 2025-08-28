import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const baseURL = 'https://areainsights.googleapis.com/v1:computeInsights';

const locationFilterSchema = z.object({
  circle: z
    .object({
      center: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      radius: z.number(),
    })
    .optional(),
  region: z
    .object({
      place: z
        .string()
        .describe("Place ID of the region. Must start with 'places/'"),
    })
    .optional(),
  customArea: z
    .any()
    .optional()
    .describe('Custom polygon area. Not implemented yet.'),
});

const typeFilterSchema = z.object({
  includedTypes: z.array(z.string()),
  excludedTypes: z.array(z.string()).optional(),
});

const ratingFilterSchema = z.object({
  minRating: z.number().min(0).max(5).optional(),
  maxRating: z.number().min(0).max(5).optional(),
});

export const getGooglePlacesInsightsTool = createTool({
  id: 'get-google-places-insights',
  description:
    'Get insights from the Google Places Aggregate API, such as place counts or place IDs based on filters.',
  inputSchema: z.object({
    insights: z
      .array(z.enum(['INSIGHT_COUNT', 'INSIGHT_PLACES']))
      .describe('The type of insights to compute.'),
    filter: z.object({
      locationFilter: locationFilterSchema,
      typeFilter: typeFilterSchema,
      operatingStatus: z
        .array(
          z.enum([
            'OPERATING_STATUS_UNSPECIFIED',
            'OPERATING_STATUS_OPERATIONAL',
            'OPERATING_STATUS_CLOSED_TEMPORARILY',
            'OPERATING_STATUS_CLOSED_PERMANENTLY',
          ]),
        )
        .optional(),
      priceLevels: z
        .array(
          z.enum([
            'PRICE_LEVEL_UNSPECIFIED',
            'PRICE_LEVEL_FREE',
            'PRICE_LEVEL_INEXPENSIVE',
            'PRICE_LEVEL_MODERATE',
            'PRICE_LEVEL_EXPENSIVE',
            'PRICE_LEVEL_VERY_EXPENSIVE',
          ]),
        )
        .optional(),
      ratingFilter: ratingFilterSchema.optional(),
    }),
  }),
  outputSchema: z.object({
    count: z
      .string()
      .optional()
      .describe('The number of places matching the filter.'),
    places: z
      .array(z.string())
      .optional()
      .describe('A list of place IDs matching the filter (up to 100).'),
  }),
  execute: async ({ context }) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Google API key not found. Please set the GOOGLE_API_KEY environment variable.',
      );
    }

    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify(context),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Google Places Insights API request failed with status ${response.status}: ${errorBody}`,
      );
    }

    const data = await response.json();

    // The API returns place IDs under a `places` key inside a `placeInsights` array
    if (
      data.placeInsights &&
      data.placeInsights[0] &&
      data.placeInsights[0].places
    ) {
      return { places: data.placeInsights[0].places.map((p: any) => p.place) };
    }

    return data;
  },
});
