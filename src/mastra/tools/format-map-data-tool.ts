import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Define a basic GeoJSON Feature and FeatureCollection schema for output clarity
const GeoJsonFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.string(), // e.g., 'Point', 'Polygon'
    coordinates: z.any(), // Array of numbers for Point, array of arrays for Polygon etc.
  }),
  properties: z.record(z.any()).optional(), // Arbitrary properties
});

const GeoJsonFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(GeoJsonFeatureSchema),
});

export const formatMapDataTool = createTool({
  id: 'format-map-data',
  description: 'Consolidates raw geospatial data from various tool outputs into a single GeoJSON FeatureCollection.',
  inputSchema: z.record(z.any()).describe('A JSON object containing raw results from executed geospatial tool calls.'),
  outputSchema: GeoJsonFeatureCollectionSchema.describe('A GeoJSON FeatureCollection object containing all identified geospatial features.'),
  execute: async ({ context }) => {
    const rawData = context;
    const features: z.infer<typeof GeoJsonFeatureSchema>[] = [];

    // Helper to add a feature
    const addFeature = (geometry: any, properties: any = {}) => {
      features.push({
        type: 'Feature',
        geometry: geometry,
        properties: properties,
      });
    };

    // Process TomTom Fuzzy Search results
    if (rawData['tomtom-fuzzy-search'] && rawData['tomtom-fuzzy-search'].results) {
      for (const result of rawData['tomtom-fuzzy-search'].results) {
        if (result.position && result.position.lat && result.position.lon) {
          addFeature(
            {
              type: 'Point',
              coordinates: [result.position.lon, result.position.lat],
            },
            {
              name: result.poi?.name || result.address?.freeformAddress,
              address: result.address?.freeformAddress,
              category: result.poi?.categories?.[0],
              source: 'TomTom Fuzzy Search',
            }
          );
        }
      }
    }

    // Process Google Place Details results
    if (rawData['get-google-place-details'] && rawData['get-google-place-details'].result) {
      const place = rawData['get-google-place-details'].result;
      if (place.location && place.location.latitude && place.location.longitude) {
        addFeature(
          {
            type: 'Point',
            coordinates: [place.location.longitude, place.location.latitude],
          },
          {
            name: place.displayName?.text,
            address: place.formattedAddress,
            rating: place.rating,
            priceLevel: place.priceLevel,
            source: 'Google Place Details',
          }
        );
      }
    }

    // Process Google Places Insights results (if it returns place IDs, you might need to fetch details)
    // For simplicity, this tool assumes it gets enough info to create a point.
    // In a real scenario, if insights only give IDs, you'd need another tool call to get details.
    if (rawData['get-google-places-insights'] && rawData['get-google-places-insights'].places) {
        // This part is tricky. get-google-places-insights only returns place IDs.
        // To get coordinates, you'd typically need to call get-google-place-details for each ID.
        // For this tool, we'll assume the rawData might contain pre-fetched details or
        // we'll just add a placeholder if only IDs are available.
        for (const placeId of rawData['get-google-places-insights'].places) {
            // If the rawData also contains details for this placeId, use them
            // Otherwise, just add a feature with the ID
            addFeature(
                { type: 'Point', coordinates: [0, 0] }, // Placeholder coordinates
                { placeId: placeId, source: 'Google Places Insights (ID only)' }
            );
        }
    }

    // Process searchEventsTool results
    if (rawData['search-events'] && rawData['search-events'].results) {
      for (const event of rawData['search-events'].results) {
        if (event.location && event.location.coordinates) {
          addFeature(
            {
              type: 'Point',
              coordinates: event.location.coordinates, // [longitude, latitude]
            },
            {
              title: event.title,
              category: event.category,
              start: event.start,
              end: event.end,
              source: 'PredictHQ Events',
            }
          );
        }
      }
    }

    // Add more processing for other geospatial tools as needed (e.g., IP location)
    if (rawData['get-ip-location'] && rawData['get-ip-location'].latitude && rawData['get-ip-location'].longitude) {
      addFeature(
        {
          type: 'Point',
          coordinates: [rawData['get-ip-location'].longitude, rawData['get-ip-location'].latitude],
        },
        {
          city: rawData['get-ip-location'].city,
          source: 'IP Location',
        }
      );
    }


    return {
      type: 'FeatureCollection' as const, // Use 'as const' to infer literal type
      features: features,
    };
  },
});
