import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const tomtomApiVersion = '2';
const baseURL = 'https://api.tomtom.com';

export const tomtomFuzzySearchTool = createTool({
  id: 'tomtom-fuzzy-search',
  description:
    'Performs a fuzzy search using the TomTom Search API, handling various input types and providing geobias capabilities.',
  inputSchema: z.object({
    query: z
      .string()
      .describe('The query string (e.g., "123 main st", "coffee shop").'),
    typeahead: z
      .boolean()
      .optional()
      .describe(
        'If true, query is interpreted as partial input for predictive search.',
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe('Maximum number of responses to return (1-100).'),
    ofs: z
      .number()
      .min(0)
      .optional()
      .describe('Starting offset of results for pagination.'),
    countrySet: z
      .string()
      .optional()
      .describe(
        'Comma-separated ISO 3166-1 alpha-2 or alpha-3 country codes to limit search (e.g., "US,GB").',
      ),
    lat: z.number().optional().describe('Latitude for biasing results.'),
    lon: z.number().optional().describe('Longitude for biasing results.'),
    radius: z
      .number()
      .optional()
      .describe('Radius in meters around lat/lon to constrain results.'),
    topLeft: z
      .string()
      .optional()
      .describe(
        'Comma-separated coordinates (lat,lon) of the top-left point of a bounding box.',
      ),
    btmRight: z
      .string()
      .optional()
      .describe(
        'Comma-separated coordinates (lat,lon) of the bottom-right point of a bounding box.',
      ),
    geobias: z
      .string()
      .optional()
      .describe(
        'Location bias for search (e.g., "point:lat,lon" or "rectangle:topLeftLat,topLeftLon,btmRightLat,btmRightLon").',
      ),
    language: z
      .string()
      .optional()
      .describe('Language for the results (e.g., "en-US").'),
    minFuzzyLevel: z
      .number()
      .min(1)
      .max(4)
      .optional()
      .describe('Minimum fuzzy level (1-4).'),
    maxFuzzyLevel: z
      .number()
      .min(1)
      .max(4)
      .optional()
      .default(2)
      .describe('Maximum fuzzy level (1-4). Default is 2.'),
    categorySet: z
      .string()
      .optional()
      .describe('Comma-separated category IDs to filter POI results.'),
    brandSet: z
      .string()
      .optional()
      .describe('Comma-separated brand names to filter POI results.'),
    connectorSet: z
      .string()
      .optional()
      .describe('Comma-separated connector types for EV charging stations.'),
    fuelSet: z
      .string()
      .optional()
      .describe('Comma-separated fuel types for fuel stations.'),
    vehicleTypeSet: z
      .string()
      .optional()
      .describe('Comma-separated vehicle types for filtering relevant POIs.'),
    view: z
      .string()
      .optional()
      .describe('View parameter for regional content (e.g., "Unified", "US").'),
    openingHours: z
      .string()
      .optional()
      .describe('Filter by opening hours (e.g., "nextSevenDays").'),
    timeZone: z.boolean().optional().describe('Include time zone information.'),
    mapcodes: z.boolean().optional().describe('Include mapcode information.'),
    relatedPois: z.boolean().optional().describe('Include related POIs.'),
    minPowerKW: z
      .number()
      .optional()
      .describe('Minimum power in kilowatts for EV charging stations.'),
    maxPowerKW: z
      .number()
      .optional()
      .describe('Maximum power in kilowatts for EV charging stations.'),
    entityTypeSet: z
      .string()
      .optional()
      .describe(
        'Comma-separated entity types to filter results (e.g., "POI", "Street").',
      ),
  }),
  outputSchema: z.object({
    summary: z
      .object({
        query: z.string().optional(),
        queryType: z.string().optional(),
        queryTime: z.number().optional(),
        numResults: z.number().optional(),
        offset: z.number().optional(),
        totalResults: z.number().optional(),
        fuzzyLevel: z.number().optional(),
      })
      .optional(),
    results: z
      .array(
        z.object({
          type: z.string().optional(),
          id: z.string().optional(),
          score: z.number().optional(),
          entityType: z.string().optional(),
          poi: z
            .object({
              name: z.string().optional(),
              phone: z.string().optional(),
              url: z.string().optional(),
              categories: z.array(z.string()).optional(),
              classifications: z
                .array(
                  z.object({
                    code: z.string().optional(),
                    names: z
                      .array(
                        z.object({
                          nameLocale: z.string().optional(),
                          name: z.string().optional(),
                        }),
                      )
                      .optional(),
                  }),
                )
                .optional(),
            })
            .optional(),
          address: z
            .object({
              streetNumber: z.string().optional(),
              streetName: z.string().optional(),
              municipality: z.string().optional(),
              countryCode: z.string().optional(),
              freeformAddress: z.string().optional(),
            })
            .optional(),
          position: z
            .object({
              lat: z.number().optional(),
              lon: z.number().optional(),
            })
            .optional(),
          viewport: z
            .object({
              topLeftPoint: z
                .object({
                  lat: z.number().optional(),
                  lon: z.number().optional(),
                })
                .optional(),
              btmRightPoint: z
                .object({
                  lat: z.number().optional(),
                  lon: z.number().optional(),
                })
                .optional(),
            })
            .optional(),
        }),
      )
      .optional(),
  }),
  execute: async ({ context }) => {
    const {
      query,
      typeahead,
      limit,
      ofs,
      countrySet,
      lat,
      lon,
      radius,
      topLeft,
      btmRight,
      geobias,
      language,
      minFuzzyLevel,
      maxFuzzyLevel,
      categorySet,
      brandSet,
      connectorSet,
      fuelSet,
      vehicleTypeSet,
      view,
      openingHours,
      timeZone,
      mapcodes,
      relatedPois,
      minPowerKW,
      maxPowerKW,
      entityTypeSet,
    } = context;
    const apiKey = process.env.TOMTOM_API_KEY;

    if (!apiKey) {
      throw new Error(
        'TomTom API key not found. Please set the TOMTOM_API_KEY environment variable.',
      );
    }

    let resolvedGeobias = geobias;
    if (
      geobias &&
      !geobias.startsWith('point:') &&
      !geobias.startsWith('rectangle:')
    ) {
      const geocodeUrl = new URL(
        `${baseURL}/search/${tomtomApiVersion}/geocode/${encodeURIComponent(geobias)}.json`,
      );
      geocodeUrl.searchParams.append('key', apiKey);
      geocodeUrl.searchParams.append('limit', '1');

      const geocodeResponse = await fetch(geocodeUrl.toString());
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.results && geocodeData.results.length > 0) {
          const { lat, lon } = geocodeData.results[0].position;
          resolvedGeobias = `point:${lat},${lon}`;
        } else {
          resolvedGeobias = undefined; // Could not resolve, so remove bias
        }
      } else {
        resolvedGeobias = undefined; // Could not resolve, so remove bias
      }
    }

    const url = new URL(
      `${baseURL}/search/${tomtomApiVersion}/search/${encodeURIComponent(query)}.json`,
    );
    url.searchParams.append('key', apiKey);

    if (typeahead !== undefined)
      url.searchParams.append('typeahead', typeahead.toString());
    if (limit !== undefined) url.searchParams.append('limit', limit.toString());
    if (ofs !== undefined) url.searchParams.append('ofs', ofs.toString());
    if (countrySet) url.searchParams.append('countrySet', countrySet);
    if (lat !== undefined) url.searchParams.append('lat', lat.toString());
    if (lon !== undefined) url.searchParams.append('lon', lon.toString());
    if (radius !== undefined)
      url.searchParams.append('radius', radius.toString());
    if (topLeft) url.searchParams.append('topLeft', topLeft);
    if (btmRight) url.searchParams.append('btmRight', btmRight);
    if (resolvedGeobias) url.searchParams.append('geobias', resolvedGeobias);
    if (language) url.searchParams.append('language', language);
    if (minFuzzyLevel !== undefined)
      url.searchParams.append('minFuzzyLevel', minFuzzyLevel.toString());
    if (maxFuzzyLevel !== undefined)
      url.searchParams.append('maxFuzzyLevel', maxFuzzyLevel.toString());
    if (categorySet) url.searchParams.append('categorySet', categorySet);
    if (brandSet) url.searchParams.append('brandSet', brandSet);
    if (connectorSet) url.searchParams.append('connectorSet', connectorSet);
    if (fuelSet) url.searchParams.append('fuelSet', fuelSet);
    if (vehicleTypeSet)
      url.searchParams.append('vehicleTypeSet', vehicleTypeSet);
    if (view) url.searchParams.append('view', view);
    if (openingHours) url.searchParams.append('openingHours', openingHours);
    if (timeZone !== undefined)
      url.searchParams.append('timeZone', timeZone.toString());
    if (mapcodes !== undefined)
      url.searchParams.append('mapcodes', mapcodes.toString());
    if (relatedPois !== undefined)
      url.searchParams.append('relatedPois', relatedPois.toString());
    if (minPowerKW !== undefined)
      url.searchParams.append('minPowerKW', minPowerKW.toString());
    if (maxPowerKW !== undefined)
      url.searchParams.append('maxPowerKW', maxPowerKW.toString());
    if (entityTypeSet) url.searchParams.append('entityTypeSet', entityTypeSet);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `TomTom Fuzzy Search API request failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json();
    return data;
  },
});
