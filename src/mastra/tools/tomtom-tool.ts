import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const tomtomApiVersion = '2';
const baseURL = 'https://api.tomtom.com';

// Tool for searching for points of interest
export const searchPoiTool = createTool({
  id: 'search-poi',
  description: 'Search for Points of Interest using the TomTom API',
  inputSchema: z.object({
    query: z.string().describe('The search query (e.g., "restaurant", "cafe")'),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Maximum number of responses to return'),
    lat: z.number().optional().describe('Latitude for biasing results'),
    lon: z.number().optional().describe('Longitude for biasing results'),
    radius: z
      .number()
      .optional()
      .describe('Radius in meters for constraining results'),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        id: z.string(),
        dist: z.number(),
        poi: z.object({
          name: z.string(),
        }),
        address: z.object({
          freeformAddress: z.string(),
        }),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const { query, limit, lat, lon, radius } = context;
    const apiKey = process.env.TOMTOM_API_KEY;

    if (!apiKey) {
      throw new Error(
        'TomTom API key not found. Please set the TOMTOM_API_KEY environment variable.',
      );
    }

    const url = new URL(
      `${baseURL}/search/${tomtomApiVersion}/poiSearch/${query}.json`,
    );
    url.searchParams.append('key', apiKey);
    url.searchParams.append('limit', limit.toString());

    if (lat) url.searchParams.append('lat', lat.toString());
    if (lon) url.searchParams.append('lon', lon.toString());
    if (radius) url.searchParams.append('radius', radius.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `TomTom API request failed with status ${response.status}`,
      );
    }

    const data = await response.json();
    return { results: data.results };
  },
});

// Tool for getting place details by ID using the regular Search API
export const getPlaceByIdTool = createTool({
  id: 'get-place-by-id',
  description:
    'Get detailed information about a place using its entity ID from the TomTom Search API',
  inputSchema: z.object({
    entityId: z
      .string()
      .describe(
        'A unique POI, Street, Geography, Point Address, Address Range, or Cross Street identifier',
      ),
    language: z
      .string()
      .optional()
      .describe('Language for the results (e.g., en-US, es-ES)'),
    openingHours: z
      .boolean()
      .optional()
      .describe('Include opening hours information'),
    timeZone: z.boolean().optional().describe('Include timezone information'),
    mapcodes: z.boolean().optional().describe('Include mapcode information'),
    relatedPois: z.boolean().optional().describe('Include related POIs'),
    view: z
      .enum(['Unified', 'US'])
      .optional()
      .describe('View type for the response'),
  }),
  outputSchema: z.object({
    summary: z.object({
      query: z.string(),
      queryType: z.string(),
      queryTime: z.number(),
      numResults: z.number(),
      offset: z.number(),
      totalResults: z.number(),
      fuzzyLevel: z.number(),
    }),
    results: z.array(
      z.object({
        type: z.string(),
        id: z.string(),
        score: z.number(),
        entityType: z.string().optional(),
        poi: z
          .object({
            name: z.string(),
            phone: z.string().optional(),
            brands: z
              .array(
                z.object({
                  name: z.string(),
                }),
              )
              .optional(),
            categorySet: z
              .array(
                z.object({
                  id: z.number(),
                }),
              )
              .optional(),
            url: z.string().optional(),
            categories: z.array(z.string()).optional(),
            classifications: z
              .array(
                z.object({
                  code: z.string(),
                  names: z.array(
                    z.object({
                      nameLocale: z.string(),
                      name: z.string(),
                    }),
                  ),
                }),
              )
              .optional(),
            openingHours: z
              .object({
                mode: z.string(),
                timeRanges: z.array(
                  z.object({
                    startTime: z.object({
                      date: z.string(),
                      hour: z.number(),
                      minute: z.number(),
                    }),
                    endTime: z.object({
                      date: z.string(),
                      hour: z.number(),
                      minute: z.number(),
                    }),
                  }),
                ),
              })
              .optional(),
          })
          .optional(),
        address: z.object({
          streetNumber: z.string().optional(),
          streetName: z.string().optional(),
          municipalitySubdivision: z.string().optional(),
          municipality: z.string().optional(),
          countrySecondarySubdivision: z.string().optional(),
          countrySubdivision: z.string().optional(),
          postalCode: z.string().optional(),
          countryCode: z.string().optional(),
          country: z.string().optional(),
          countryCodeISO3: z.string().optional(),
          freeformAddress: z.string().optional(),
          localName: z.string().optional(),
        }),
        position: z.object({
          lat: z.number(),
          lon: z.number(),
        }),
        viewport: z
          .object({
            topLeftPoint: z.object({
              lat: z.number(),
              lon: z.number(),
            }),
            btmRightPoint: z.object({
              lat: z.number(),
              lon: z.number(),
            }),
          })
          .optional(),
        entryPoints: z
          .array(
            z.object({
              type: z.string(),
              position: z.object({
                lat: z.number(),
                lon: z.number(),
              }),
            }),
          )
          .optional(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const {
      entityId,
      language,
      openingHours,
      timeZone,
      mapcodes,
      relatedPois,
      view,
    } = context;
    const apiKey = process.env.TOMTOM_API_KEY;

    if (!apiKey) {
      throw new Error(
        'TomTom API key not found. Please set the TOMTOM_API_KEY environment variable.',
      );
    }

    // URL format: https://{baseURL}/search/{versionNumber}/place.{ext}
    const url = new URL(`${baseURL}/search/${tomtomApiVersion}/place.json`);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('entityId', entityId);

    // Add optional parameters
    if (language) url.searchParams.append('language', language);
    if (openingHours !== undefined)
      url.searchParams.append('openingHours', openingHours.toString());
    if (timeZone !== undefined)
      url.searchParams.append('timeZone', timeZone.toString());
    if (mapcodes !== undefined)
      url.searchParams.append('mapcodes', mapcodes.toString());
    if (relatedPois !== undefined)
      url.searchParams.append('relatedPois', relatedPois.toString());
    if (view) url.searchParams.append('view', view);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `TomTom Place by ID API request failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json();
    return data;
  },
});

// Tool for getting POI photos - FIXED VERSION
export const getPoiPhotosTool = createTool({
  id: 'get-poi-photos',
  description:
    'Get photos for a specific Point of Interest from the TomTom API',
  inputSchema: z.object({
    id: z.string().describe('The ID of the photo'),
    height: z.number().optional().describe('Height of the image in pixels'),
    width: z.number().optional().describe('Width of the image in pixels'),
  }),
  outputSchema: z.object({
    imageBuffer: z.any().describe('Raw image buffer'),
    contentType: z.string().describe('Content type of the image'),
  }),
  execute: async ({ context }) => {
    const { id, height, width } = context;
    const apiKey = process.env.TOMTOM_API_KEY;

    if (!apiKey) {
      throw new Error(
        'TomTom API key not found. Please set the TOMTOM_API_KEY environment variable.',
      );
    }

    // Correct URL format as per documentation for POI Photos API (no .ext needed)
    const url = new URL(`${baseURL}/search/${tomtomApiVersion}/poiPhoto`);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('id', id);

    if (height) url.searchParams.append('height', height.toString());
    if (width) url.searchParams.append('width', width.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `TomTom POI Photos API request failed with status ${response.status}: ${errorText}`,
      );
    }

    // Get the image as an array buffer
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return {
      imageBuffer,
      contentType,
    };
  },
});
