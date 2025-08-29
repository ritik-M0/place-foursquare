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
  inputSchema: z.object({
    rawData: z.record(z.any()).describe('A JSON object containing raw results from executed geospatial tool calls.')
  }),
  outputSchema: GeoJsonFeatureCollectionSchema.describe('A GeoJSON FeatureCollection object containing all identified geospatial features.'),
  execute: async ({ context }) => {
    const rawData = context.rawData;
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
    const tomtomData = rawData['tomtomFuzzySearchTool'] || rawData['tomtom-fuzzy-search'];
    if (tomtomData && tomtomData.results) {
      for (const result of tomtomData.results) {
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
    const googlePlaceData = rawData['getGooglePlaceDetailsTool'] || rawData['get-google-place-details'];
    if (googlePlaceData && googlePlaceData.result) {
      const place = googlePlaceData.result;
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
    const googleInsightsData = rawData['getGooglePlacesInsightsTool'] || rawData['get-google-places-insights'];
    if (googleInsightsData && googleInsightsData.places) {
        // This part is tricky. get-google-places-insights only returns place IDs.
        // To get coordinates, you'd typically need to call get-google-place-details for each ID.
        // For this tool, we'll assume the rawData might contain pre-fetched details or
        // we'll just add a placeholder if only IDs are available.
        for (const placeId of googleInsightsData.places) {
            // If the rawData also contains details for this placeId, use them
            // Otherwise, just add a feature with the ID
            addFeature(
                { type: 'Point', coordinates: [0, 0] }, // Placeholder coordinates
                { placeId: placeId, source: 'Google Places Insights (ID only)' }
            );
        }
    }

    // Process searchEventsTool results
    const eventsData = rawData['searchEventsTool'] || rawData['search-events'];
    if (eventsData && eventsData.results) {
      for (const event of eventsData.results) {
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
    const ipLocationData = rawData['getIpLocationTool'] || rawData['get-ip-location'];
    if (ipLocationData && ipLocationData.latitude && ipLocationData.longitude) {
      addFeature(
        {
          type: 'Point',
          coordinates: [ipLocationData.longitude, ipLocationData.latitude],
        },
        {
          city: ipLocationData.city,
          source: 'IP Location',
        }
      );
    }

    // Process searchPoiTool results
    const searchPoiData = rawData['searchPoiTool'];
    if (searchPoiData && searchPoiData.results) {
      for (const result of searchPoiData.results) {
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
              source: 'TomTom POI Search',
            }
          );
        }
      }
    }

    // Process getPlaceByIdTool results
    const placeByIdData = rawData['getPlaceByIdTool'];
    if (placeByIdData && placeByIdData.position) {
      addFeature(
        {
          type: 'Point',
          coordinates: [placeByIdData.position.lon, placeByIdData.position.lat],
        },
        {
          name: placeByIdData.poi?.name || placeByIdData.address?.freeformAddress,
          address: placeByIdData.address?.freeformAddress,
          category: placeByIdData.poi?.categories?.[0],
          source: 'TomTom Place Details',
        }
      );
    }


    // Calculate bounds and center for Mapbox
    const bounds = calculateBounds(features);
    const center = calculateCenter(features);

    return {
      type: 'FeatureCollection' as const,
      features: features,
      bounds: bounds,
      center: center,
      metadata: {
        totalFeatures: features.length,
        sources: [...new Set(features.map(f => f.properties?.source).filter(Boolean))],
        generatedAt: new Date().toISOString()
      }
    };
  },
});

// Helper functions for bounds and center calculation
function calculateBounds(features: any[]): any {
  if (!features || features.length === 0) return null;

  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;

  features.forEach(feature => {
    if (feature.geometry?.type === 'Point') {
      const [lon, lat] = feature.geometry.coordinates;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    }
  });

  if (minLat === Infinity) return null;

  return {
    north: maxLat,
    south: minLat,
    east: maxLon,
    west: minLon
  };
}

function calculateCenter(features: any[]): any {
  if (!features || features.length === 0) return null;

  let totalLat = 0, totalLon = 0, count = 0;

  features.forEach(feature => {
    if (feature.geometry?.type === 'Point') {
      const [lon, lat] = feature.geometry.coordinates;
      totalLat += lat;
      totalLon += lon;
      count++;
    }
  });

  if (count === 0) return null;

  return {
    lat: totalLat / count,
    lon: totalLon / count
  };
}
