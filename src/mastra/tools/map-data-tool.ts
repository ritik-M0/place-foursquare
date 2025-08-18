import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// TomTom POI Result Schema
const TomTomPoiSchema = z.object({
  id: z.string(),
  dist: z.number().optional(),
  poi: z.object({
    name: z.string(),
    phone: z.string().optional(),
    brands: z.array(z.object({ name: z.string() })).optional(),
    categorySet: z.array(z.object({ id: z.number() })).optional(),
    url: z.string().optional(),
    categories: z.array(z.string()).optional(),
    classifications: z.array(z.object({
      code: z.string(),
      names: z.array(z.object({
        nameLocale: z.string(),
        name: z.string(),
      })),
    })).optional(),
  }),
  address: z.object({
    streetNumber: z.string().optional(),
    streetName: z.string().optional(),
    municipality: z.string().optional(),
    countrySubdivision: z.string().optional(),
    postalCode: z.string().optional(),
    countryCode: z.string().optional(),
    country: z.string().optional(),
    freeformAddress: z.string().optional(),
  }),
  position: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  viewport: z.object({
    topLeftPoint: z.object({ lat: z.number(), lon: z.number() }),
    btmRightPoint: z.object({ lat: z.number(), lon: z.number() }),
  }).optional(),
});

// Event Schema for PredictHQ data
const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  start: z.string(),
  end: z.string().nullable(),
  location: z.object({
    coordinates: z.array(z.number()).length(2),
  }),
  rank: z.number().optional(),
  local_rank: z.number().optional(),
  phq_attendance: z.number().optional(),
  country: z.string(),
  labels: z.array(z.string()).optional(),
});

// POI GeoJSON Feature Schema
const PoiFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: z.object({
    type: z.literal("Point"),
    coordinates: z.array(z.number()).length(2),
  }),
  properties: z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    subcategory: z.string().optional(),
    address: z.string(),
    phone: z.string().optional(),
    website: z.string().optional(),
    distance: z.number().optional(),
    markerColor: z.string(),
    markerIcon: z.string(),
    markerSize: z.enum(['small', 'medium', 'large']),
    priority: z.enum(['low', 'medium', 'high']),
    dataSource: z.literal('poi'),
  }),
});

// Event GeoJSON Feature Schema
const EventFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: z.object({
    type: z.literal("Point"),
    coordinates: z.array(z.number()).length(2),
  }),
  properties: z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    startDate: z.string(),
    endDate: z.string().nullable(),
    rank: z.number().optional(),
    attendance: z.number().optional(),
    eventType: z.enum(['upcoming', 'ongoing', 'past']),
    markerColor: z.string(),
    markerIcon: z.string(),
    markerSize: z.string(),
    description: z.string().nullable(),
    labels: z.array(z.string()).optional(),
    country: z.string(),
    dataSource: z.literal('event'),
  }),
});

// Category mapping type
const CategoryStyleSchema = z.object({
  color: z.string(),
  icon: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
});

const prepareMapDataInputSchema = z.object({
  tomtomResults: z.array(TomTomPoiSchema),
  searchContext: z.object({
    query: z.string().optional(),
    center: z.object({ lat: z.number(), lng: z.number() }).optional(),
    radius: z.number().optional(),
  }).optional(),
  mapOptions: z.object({
    style: z.string().optional().default('mapbox://styles/mapbox/streets-v12'),
    zoom: z.number().min(1).max(20).optional().default(12),
    pitch: z.number().min(0).max(60).optional().default(0),
    bearing: z.number().min(0).max(360).optional().default(0),
  }).optional(),
  categoryMapping: z.record(CategoryStyleSchema).optional(),
});

const prepareMapDataOutputSchema = z.object({
  geojson: z.object({
    type: z.literal("FeatureCollection"),
    features: z.array(PoiFeatureSchema),
  }),
  mapConfig: z.object({
    center: z.array(z.number()).length(2),
    zoom: z.number(),
    pitch: z.number(),
    bearing: z.number(),
    style: z.string(),
    bounds: z.array(z.array(z.number())).optional(),
  }),
  metadata: z.object({
    totalResults: z.number(),
    searchQuery: z.string().optional(),
    searchCenter: z.object({ lat: z.number(), lng: z.number() }).optional(),
    searchRadius: z.number().optional(),
    categories: z.array(z.string()),
    boundingBox: z.object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    }),
    averageDistance: z.number().optional(),
    furthestDistance: z.number().optional(),
  }),
});

export const prepareMapDataTool = createTool({
  id: 'prepare-map-data',
  description: 'Transform TomTom POI search results into Mapbox GL JS ready format',
  inputSchema: prepareMapDataInputSchema,
  outputSchema: prepareMapDataOutputSchema,
  execute: async ({ context }: { context: z.infer<typeof prepareMapDataInputSchema> }): Promise<z.infer<typeof prepareMapDataOutputSchema>> => {
    const { tomtomResults, searchContext, mapOptions, categoryMapping } = context;

    if (!tomtomResults || tomtomResults.length === 0) {
      throw new Error('No TomTom POI results provided for map preparation');
    }

    // Default category styling
    const defaultCategoryStyles: Record<string, { color: string; icon: string; priority: 'low' | 'medium' | 'high' }> = {
      'restaurant': { color: '#ff6b6b', icon: 'restaurant-15', priority: 'medium' },
      'hotel': { color: '#4ecdc4', icon: 'lodging-15', priority: 'medium' },
      'gas_station': { color: '#45b7d1', icon: 'fuel-15', priority: 'low' },
      'hospital': { color: '#f9ca24', icon: 'hospital-15', priority: 'high' },
      'school': { color: '#6c5ce7', icon: 'school-15', priority: 'medium' },
      'shopping': { color: '#a29bfe', icon: 'shop-15', priority: 'medium' },
      'bank': { color: '#fd79a8', icon: 'bank-15', priority: 'low' },
      'pharmacy': { color: '#00b894', icon: 'pharmacy-15', priority: 'high' },
      'attraction': { color: '#e17055', icon: 'attraction-15', priority: 'high' },
      'default': { color: '#74b9ff', icon: 'marker-15', priority: 'medium' },
    };

    const finalCategoryMapping = { ...defaultCategoryStyles, ...categoryMapping };

    // Helper function to determine POI category from TomTom data
    const determinePOICategory = (poi: z.infer<typeof TomTomPoiSchema>): string => {
      if (poi.poi?.categories && poi.poi.categories.length > 0) {
        const category = poi.poi.categories[0].toLowerCase();
        
        // Map common TomTom categories to our standardized categories
        if (category.includes('restaurant') || category.includes('food')) return 'restaurant';
        if (category.includes('hotel') || category.includes('accommodation')) return 'hotel';
        if (category.includes('gas') || category.includes('petrol')) return 'gas_station';
        if (category.includes('hospital') || category.includes('medical')) return 'hospital';
        if (category.includes('school') || category.includes('education')) return 'school';
        if (category.includes('shop') || category.includes('retail')) return 'shopping';
        if (category.includes('bank') || category.includes('atm')) return 'bank';
        if (category.includes('pharmacy') || category.includes('drugstore')) return 'pharmacy';
        if (category.includes('attraction') || category.includes('museum') || category.includes('park')) return 'attraction';
        
        return category;
      }
      
      if (poi.poi?.classifications && poi.poi.classifications.length > 0) {
        const classification = poi.poi.classifications[0].code.toLowerCase();
        return classification;
      }
      
      return 'default';
    };

    // Transform TomTom results to GeoJSON features
    const features: z.infer<typeof PoiFeatureSchema>[] = tomtomResults.map((poi) => {
      const category = determinePOICategory(poi);
      const categoryStyle = finalCategoryMapping[category] || finalCategoryMapping['default'];
      
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [poi.position.lon, poi.position.lat],
        },
        properties: {
          id: poi.id,
          name: poi.poi.name,
          category: category,
          subcategory: poi.poi?.categories?.[0],
          address: poi.address.freeformAddress || 'Address not available',
          phone: poi.poi?.phone,
          website: poi.poi?.url,
          distance: poi.dist,
          markerColor: categoryStyle.color,
          markerIcon: categoryStyle.icon,
          markerSize: categoryStyle.priority === 'high' ? 'large' : 
                     categoryStyle.priority === 'low' ? 'small' : 'medium',
          priority: categoryStyle.priority,
          dataSource: 'poi',
        }
      };
    });

    // Calculate bounds and center
    const coordinates = features.map(f => f.geometry.coordinates);
    const lngs = coordinates.map(coord => coord[0]);
    const lats = coordinates.map(coord => coord[1]);
    
    const bounds = coordinates.length > 1 ? [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    ] : undefined;

    const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;
    const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;

    // Calculate zoom level
    const calculateZoom = (): number => {
      if (!bounds || coordinates.length === 1) return mapOptions?.zoom || 14;
      
      const lngDiff = Math.max(...lngs) - Math.min(...lngs);
      const latDiff = Math.max(...lats) - Math.min(...lats);
      const maxDiff = Math.max(lngDiff, latDiff);
      
      if (maxDiff > 10) return 8;
      if (maxDiff > 1) return 10;
      if (maxDiff > 0.1) return 12;
      if (maxDiff > 0.01) return 14;
      return 16;
    };

    const categories = [...new Set(features.map(f => f.properties.category))];

    return {
      geojson: {
        type: "FeatureCollection",
        features,
      },
      mapConfig: {
        center: [centerLng, centerLat],
        zoom: calculateZoom(),
        pitch: mapOptions?.pitch || 0,
        bearing: mapOptions?.bearing || 0,
        style: mapOptions?.style || 'mapbox://styles/mapbox/streets-v12',
        bounds,
      },
      metadata: {
        totalResults: tomtomResults.length,
        searchQuery: searchContext?.query,
        searchCenter: searchContext?.center,
        searchRadius: searchContext?.radius,
        categories,
        boundingBox: bounds ? {
          north: Math.max(...lats),
          south: Math.min(...lats),
          east: Math.max(...lngs),
          west: Math.min(...lngs),
        } : {
          north: centerLat,
          south: centerLat,
          east: centerLng,
          west: centerLng,
        },
        averageDistance: tomtomResults.filter(poi => poi.dist).length > 0 
          ? tomtomResults.filter(poi => poi.dist).reduce((sum, poi) => sum + (poi.dist || 0), 0) / tomtomResults.filter(poi => poi.dist).length
          : undefined,
        furthestDistance: tomtomResults.filter(poi => poi.dist).length > 0 
          ? Math.max(...tomtomResults.map(poi => poi.dist || 0))
          : undefined,
      },
    };
  },
});

const prepareEventMapDataInputSchema = z.object({
  events: z.array(EventSchema),
  mapOptions: z.object({
    style: z.string().optional().default('mapbox://styles/mapbox/streets-v12'),
    zoom: z.number().optional().default(11),
  }).optional(),
});

const prepareEventMapDataOutputSchema = z.object({
  geojson: z.object({
    type: z.literal("FeatureCollection"),
    features: z.array(EventFeatureSchema),
  }),
  mapConfig: z.object({
    center: z.array(z.number()).length(2),
    zoom: z.number(),
    style: z.string(),
    bounds: z.array(z.array(z.number())).optional(),
  }),
  metadata: z.object({
    totalEvents: z.number(),
    categories: z.array(z.string()),
    dateRange: z.object({
      earliest: z.string(),
      latest: z.string(),
    }),
    eventTypes: z.object({
      upcoming: z.number(),
      ongoing: z.number(),
      past: z.number(),
    }),
  }),
});

export const prepareEventMapDataTool = createTool({
  id: 'prepare-event-map-data',
  description: 'Transform PredictHQ event data into Mapbox GL JS ready format',
  inputSchema: prepareEventMapDataInputSchema,
  outputSchema: prepareEventMapDataOutputSchema,
  execute: async ({ context }: { context: z.infer<typeof prepareEventMapDataInputSchema> }): Promise<z.infer<typeof prepareEventMapDataOutputSchema>> => {
    const { events, mapOptions } = context;

    if (!events || events.length === 0) {
      throw new Error('No event data provided for map preparation');
    }

    // Event category styling
    const eventCategoryStyles: Record<string, { color: string; icon: string; size: string }> = {
      'concerts': { color: '#e74c3c', icon: 'music-15', size: 'large' },
      'sports': { color: '#2ecc71', icon: 'basketball-15', size: 'large' },
      'festivals': { color: '#f39c12', icon: 'star-15', size: 'large' },
      'conferences': { color: '#3498db', icon: 'building-15', size: 'medium' },
      'performing-arts': { color: '#9b59b6', icon: 'theatre-15', size: 'medium' },
      'community': { color: '#1abc9c', icon: 'park-15', size: 'medium' },
      'public-holidays': { color: '#e67e22', icon: 'town-hall-15', size: 'small' },
      'default': { color: '#95a5a6', icon: 'marker-15', size: 'medium' }
    };

    // Helper function to determine event time status
    const getEventTimeStatus = (start: string, end: string | null): 'upcoming' | 'ongoing' | 'past' => {
      const now = new Date();
      const startDate = new Date(start);
      const endDate = end ? new Date(end) : startDate;

      if (now < startDate) return 'upcoming';
      if (now >= startDate && now <= endDate) return 'ongoing';
      return 'past';
    };

    // Transform events to GeoJSON features
    const features: z.infer<typeof EventFeatureSchema>[] = events.map(event => {
      const category = event.category.toLowerCase();
      const categoryStyle = eventCategoryStyles[category] || eventCategoryStyles['default'];
      const timeStatus = getEventTimeStatus(event.start, event.end);
      
      // Adjust marker size based on rank/popularity
      let markerSize = categoryStyle.size;
      if (event.rank && event.rank > 80) markerSize = 'large';
      else if (event.rank && event.rank < 30) markerSize = 'small';

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: event.location.coordinates,
        },
        properties: {
          id: event.id,
          title: event.title,
          category: event.category,
          startDate: event.start,
          endDate: event.end,
          rank: event.rank,
          attendance: event.phq_attendance,
          eventType: timeStatus,
          markerColor: categoryStyle.color,
          markerIcon: categoryStyle.icon,
          markerSize,
          description: event.description,
          labels: event.labels,
          country: event.country,
          dataSource: 'event',
        }
      };
    });

    // Calculate map bounds and center
    const coordinates = features.map(f => f.geometry.coordinates);
    const lngs = coordinates.map(coord => coord[0]);
    const lats = coordinates.map(coord => coord[1]);
    
    const bounds = coordinates.length > 1 ? [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    ] : undefined;

    const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;
    const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;

    // Calculate zoom based on data spread
    const calculateEventZoom = (): number => {
      if (coordinates.length === 1) return 14;
      
      const lngDiff = Math.max(...lngs) - Math.min(...lngs);
      const latDiff = Math.max(...lats) - Math.min(...lats);
      const maxDiff = Math.max(lngDiff, latDiff);
      
      if (maxDiff > 20) return 6;
      if (maxDiff > 5) return 8;
      if (maxDiff > 1) return 10;
      if (maxDiff > 0.1) return 12;
      return 14;
    };

    // Calculate metadata
    const eventTypes = features.reduce((acc, feature) => {
      const type = feature.properties.eventType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, { upcoming: 0, ongoing: 0, past: 0 });

    const categories = [...new Set(features.map(f => f.properties.category))];
    
    const startDates = events.map(e => new Date(e.start)).sort((a, b) => a.getTime() - b.getTime());
    const endDates = events.filter(e => e.end).map(e => new Date(e.end!)).sort((a, b) => a.getTime() - b.getTime());

    return {
      geojson: {
        type: "FeatureCollection",
        features,
      },
      mapConfig: {
        center: [centerLng, centerLat],
        zoom: calculateEventZoom(),
        style: mapOptions?.style || 'mapbox://styles/mapbox/streets-v12',
        bounds,
      },
      metadata: {
        totalEvents: events.length,
        categories,
        dateRange: {
          earliest: startDates[0]?.toISOString() || '',
          latest: (endDates[endDates.length - 1] || startDates[startDates.length - 1])?.toISOString() || '',
        },
        eventTypes,
      },
    };
  },
});

const prepareCombinedMapDataInputSchema = z.object({
  tomtomResults: z.array(TomTomPoiSchema).optional(),
  events: z.array(EventSchema).optional(),
  layerConfig: z.object({
    showPois: z.boolean().default(true),
    showEvents: z.boolean().default(true),
    eventTimeFilter: z.enum(['all', 'upcoming', 'ongoing', 'past']).optional().default('all'),
  }).optional(),
  mapOptions: z.object({
    style: z.string().optional().default('mapbox://styles/mapbox/streets-v12'),
    zoom: z.number().optional().default(12),
    pitch: z.number().min(0).max(60).optional().default(0),
    bearing: z.number().min(0).max(360).optional().default(0),
  }).optional(),
});

const prepareCombinedMapDataOutputSchema = z.object({
  geojson: z.object({
    type: z.literal("FeatureCollection"),
    features: z.array(z.union([PoiFeatureSchema, EventFeatureSchema])),
  }),
  mapConfig: z.object({
    center: z.array(z.number()).length(2),
    zoom: z.number(),
    style: z.string(),
    bounds: z.array(z.array(z.number())).optional(),
  }),
  layerSources: z.object({
    pois: z.object({
      type: z.literal("geojson"),
      data: z.object({
        type: z.literal("FeatureCollection"),
        features: z.array(PoiFeatureSchema),
      }),
      cluster: z.boolean(),
      clusterMaxZoom: z.number(),
      clusterRadius: z.number(),
    }).optional(),
    events: z.object({
      type: z.literal("geojson"),
      data: z.object({
        type: z.literal("FeatureCollection"),
        features: z.array(EventFeatureSchema),
      }),
    }).optional(),
  }),
  metadata: z.object({
    totalPois: z.number(),
    totalEvents: z.number(),
    categories: z.array(z.string()),
    bounds: z.object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    }),
  }),
});

const generateMapLayerConfigInputSchema = z.object({
  dataType: z.enum(['poi', 'events', 'combined']),
  enableClustering: z.boolean().optional().default(true),
});

const generateMapLayerConfigOutputSchema = z.object({
  layers: z.array(z.object({
    id: z.string(),
    type: z.string(),
    source: z.string(),
    layout: z.record(z.any()).optional(),
    paint: z.record(z.any()).optional(),
    filter: z.array(z.any()).optional(),
  })),
  sources: z.record(z.object({
    type: z.string(),
    cluster: z.boolean().optional(),
    clusterMaxZoom: z.number().optional(),
    clusterRadius: z.number().optional(),
  })),
});

// Simplified layer configuration tool for basic Mapbox setup
export const generateMapLayerConfigTool = createTool({
  id: 'generate-map-layer-config',
  description: 'Generate basic Mapbox GL JS layer configurations for POI and event data',
  inputSchema: generateMapLayerConfigInputSchema,
  outputSchema: generateMapLayerConfigOutputSchema,
  execute: async ({ context }: { context: z.infer<typeof generateMapLayerConfigInputSchema> }): Promise<z.infer<typeof generateMapLayerConfigOutputSchema>> => {
    const { dataType, enableClustering } = context;

    let layers: any[] = [];
    let sources: Record<string, any> = {};

    if (dataType === 'poi' || dataType === 'combined') {
      // POI source
      sources.pois = {
        type: 'geojson',
        cluster: enableClustering,
        clusterMaxZoom: 14,
        clusterRadius: 50
      };

      if (enableClustering) {
        // Cluster layers
        layers.push({
          id: 'poi-clusters',
          type: 'circle',
          source: 'pois',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#51bbd6',
              100, '#f1c40f',
              750, '#e74c3c'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              100, 30,
              750, 40
            ]
          }
        });

        layers.push({
          id: 'poi-cluster-count',
          type: 'symbol',
          source: 'pois',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          },
          paint: {
            'text-color': '#ffffff'
          }
        });
      }

      // Individual POI markers
      layers.push({
        id: 'poi-unclustered-points',
        type: 'symbol',
        source: 'pois',
        filter: enableClustering ? ['!', ['has', 'point_count']] : undefined,
        layout: {
          'icon-image': ['get', 'markerIcon'],
          'icon-size': [
            'case',
            ['==', ['get', 'markerSize'], 'small'], 0.8,
            ['==', ['get', 'markerSize'], 'large'], 1.2,
            1.0
          ],
          'text-field': ['get', 'name'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.25],
          'text-anchor': 'top',
          'text-size': 12
        },
        paint: {
          'icon-color': ['get', 'markerColor'],
          'text-color': '#333333',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });
    }

    if (dataType === 'events' || dataType === 'combined') {
      // Events source
      sources.events = {
        type: 'geojson'
      };

      // Event markers
      layers.push({
        id: 'event-markers',
        type: 'symbol',
        source: 'events',
        layout: {
          'icon-image': [
            'case',
            ['==', ['get', 'category'], 'concerts'], 'music-15',
            ['==', ['get', 'category'], 'sports'], 'basketball-15',
            ['==', ['get', 'category'], 'festivals'], 'star-15',
            'marker-15'
          ],
          'icon-size': [
            'case',
            ['==', ['get', 'eventType'], 'ongoing'], 1.4,
            ['>', ['get', 'rank'], 80], 1.2,
            1.0
          ],
          'text-field': ['get', 'title'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-size': [
            'case',
            ['==', ['get', 'eventType'], 'ongoing'], 14,
            12
          ]
        },
        paint: {
          'icon-color': [
            'case',
            ['==', ['get', 'eventType'], 'ongoing'], '#e74c3c',
            ['==', ['get', 'eventType'], 'upcoming'], '#2ecc71',
            '#95a5a6'
          ],
          'text-color': '#333333',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1,
          'icon-opacity': [
            'case',
            ['==', ['get', 'eventType'], 'past'], 0.6,
            1.0
          ]
        }
      });
    }

    return {
      layers,
      sources,
    };
  },
});