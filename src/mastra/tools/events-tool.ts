import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const baseURL = 'https://api.predicthq.com/v1/events/';

// Define available categories based on PredictHQ API
const CATEGORIES = [
  'concerts',
  'conferences',
  'expos',
  'festivals',
  'performing-arts',
  'sports',
  'community',
  'daylight-savings',
  'observances',
  'politics',
  'public-holidays',
  'school-holidays',
  'academic-session',
] as const;

// Define available sort options
const SORT_OPTIONS = [
  'start',
  '-start',
  'end',
  '-end',
  'rank',
  '-rank',
  'updated',
  '-updated',
] as const;

export const searchEventsTool = createTool({
  id: 'search-events',
  description:
    'Search for events using the PredictHQ API. Find concerts, sports events, festivals, conferences, and more.',
  inputSchema: z.object({
    q: z
      .string()
      .optional()
      .describe('Keyword to search for (e.g., "concert", "festival", "NBA")'),
    limit: z
      .number()
      .min(1)
      .max(1000)
      .optional()
      .default(10)
      .describe('Number of events to return (1-1000)'),
    offset: z
      .number()
      .min(0)
      .optional()
      .describe('Number of results to skip for pagination'),
    country: z
      .string()
      .length(2)
      .optional()
      .describe('Filter by 2-letter ISO country code (e.g., "US", "GB", "AU")'),
    latitude: z
      .number()
      .optional()
      .describe('Latitude for the center of the search radius.'),
    longitude: z
      .number()
      .optional()
      .describe('Longitude for the center of the search radius.'),
    radius_km: z
      .number()
      .optional()
      .describe('Radius in kilometers for the search.'),
    category: z
      .enum(CATEGORIES)
      .optional()
      .describe('Filter by event category'),
    label: z
      .string()
      .optional()
      .describe('Filter by event labels (e.g., "nfl", "nba", "concert-tour")'),
    'start.gte': z
      .string()
      .optional()
      .describe(
        'Events starting on or after this date (ISO 8601: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)',
      ),
    'start.lte': z
      .string()
      .optional()
      .describe(
        'Events starting on or before this date (ISO 8601: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)',
      ),
    'end.gte': z
      .string()
      .optional()
      .describe(
        'Events ending on or after this date (ISO 8601: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)',
      ),
    'end.lte': z
      .string()
      .optional()
      .describe(
        'Events ending on or before this date (ISO 8601: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)',
      ),
    'active.gte': z
      .string()
      .optional()
      .describe('Events active on or after this date'),
    'active.lte': z
      .string()
      .optional()
      .describe('Events active on or before this date'),
    'updated.gte': z
      .string()
      .optional()
      .describe('Events updated on or after this date'),
    'updated.lte': z
      .string()
      .optional()
      .describe('Events updated on or before this date'),
    state: z
      .enum(['active', 'deleted'])
      .optional()
      .default('active')
      .describe('Event state filter'),
    sort: z
      .enum(SORT_OPTIONS)
      .optional()
      .default('start')
      .describe('Sort order for results'),
    'rank.gte': z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe('Minimum rank threshold (0-100)'),
    'rank.lte': z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe('Maximum rank threshold (0-100)'),
    'local_rank.gte': z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe('Minimum local rank threshold (0-100)'),
    'local_rank.lte': z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe('Maximum local rank threshold (0-100)'),
    'aviation_rank.gte': z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe('Minimum aviation rank threshold (0-100)'),
    'aviation_rank.lte': z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe('Maximum aviation rank threshold (0-100)'),
    place_id: z.string().optional().describe('Filter by specific place ID'),
    relevance: z.string().optional().describe('Relevance search query'),
    brand_safe: z
      .boolean()
      .optional()
      .describe('Filter for brand-safe events only'),
    deleted_reason: z
      .string()
      .optional()
      .describe('Reason for deletion (when state=deleted)'),
    duplicate_of_id: z
      .string()
      .optional()
      .describe('Original event ID for duplicates'),
  }),
  outputSchema: z.object({
    count: z.number().describe('Total number of events matching the query'),
    overflow: z
      .boolean()
      .optional()
      .describe('True if there are more results than can be returned'),
    next: z.string().optional().describe('URL for next page of results'),
    previous: z
      .string()
      .optional()
      .describe('URL for previous page of results'),
    results: z.array(
      z.object({
        id: z.string().describe('Unique event identifier'),
        title: z.string().describe('Event title'),
        description: z.string().nullable().describe('Event description'),
        category: z.string().describe('Event category'),
        labels: z.array(z.string()).optional().describe('Event labels/tags'),
        rank: z.number().optional().describe('Global popularity rank (0-100)'),
        local_rank: z
          .number()
          .optional()
          .describe('Local popularity rank (0-100)'),
        aviation_rank: z
          .number()
          .optional()
          .describe('Aviation impact rank (0-100)'),
        phq_attendance: z.number().optional().describe('Predicted attendance'),
        start: z.string().describe('Event start date/time (ISO 8601)'),
        end: z.string().nullable().describe('Event end date/time (ISO 8601)'),
        updated: z.string().describe('Last updated timestamp (ISO 8601)'),
        first_seen: z.string().describe('First seen timestamp (ISO 8601)'),
        timezone: z.string().nullable().describe('Event timezone'),
        duration: z.number().optional().describe('Event duration in seconds'),
        country: z.string().describe('2-letter country code'),
        location: z
          .object({
            type: z.string().describe('GeoJSON type (usually "Point")'),
            coordinates: z
              .array(z.number())
              .describe('Longitude and latitude coordinates'),
          })
          .describe('Event location coordinates'),
        geo: z
          .object({
            geometry: z.object({
              type: z.string(),
              coordinates: z.array(z.number()),
            }),
            address: z
              .object({
                country_code: z.string().optional(),
                formatted_address: z.string().optional(),
                locality: z.string().optional(),
                postcode: z.string().optional(),
                region: z.string().optional(),
              })
              .optional(),
            place_hierarchies: z.array(z.any()).optional(),
          })
          .optional(),
        scope: z.string().optional().describe('Geographic scope of the event'),
        relevance: z
          .number()
          .optional()
          .describe('Relevance score for search query'),
        state: z
          .enum(['active', 'deleted'])
          .describe('Current state of the event'),
        brand_safe: z
          .boolean()
          .optional()
          .describe('Whether event is brand safe'),
        deleted_reason: z
          .string()
          .optional()
          .describe('Reason for deletion if applicable'),
        duplicate_of_id: z
          .string()
          .optional()
          .describe('ID of original event if duplicate'),
        entities: z
          .array(
            z.object({
              entity_id: z.string(),
              name: z.string(),
              type: z.string(),
            }),
          )
          .optional()
          .describe('Related entities (performers, teams, etc.)'),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const {
      q,
      limit,
      offset,
      country,
      latitude,
      longitude,
      radius_km,
      category,
      label,
      state,
      sort,
      place_id,
      relevance,
      brand_safe,
      deleted_reason,
      duplicate_of_id,
    } = context;
    const startGte = context['start.gte'];
    const startLte = context['start.lte'];
    const endGte = context['end.gte'];
    const endLte = context['end.lte'];
    const activeGte = context['active.gte'];
    const activeLte = context['active.lte'];
    const updatedGte = context['updated.gte'];
    const updatedLte = context['updated.lte'];
    const rankGte = context['rank.gte'];
    const rankLte = context['rank.lte'];
    const localRankGte = context['local_rank.gte'];
    const localRankLte = context['local_rank.lte'];
    const aviationRankGte = context['aviation_rank.gte'];
    const aviationRankLte = context['aviation_rank.lte'];

    let within;
    if (latitude && longitude && radius_km) {
      within = `${radius_km}km@${latitude},${longitude}`;
    }

    const apiKey = process.env.PREDICTHQ_API_KEY;

    if (!apiKey) {
      throw new Error(
        'PredictHQ API key not found. Please set the PREDICTHQ_API_KEY environment variable.',
      );
    }

    // Build query parameters
    const url = new URL(baseURL);
    const params = new URLSearchParams();

    // Add parameters if they exist
    if (q) params.append('q', q);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (country) params.append('country', country);
    if (within) params.append('within', within);
    if (category) params.append('category', category);
    if (label) params.append('label', label);
    if (startGte) params.append('start.gte', startGte);
    if (startLte) params.append('start.lte', startLte);
    if (endGte) params.append('end.gte', endGte);
    if (endLte) params.append('end.lte', endLte);
    if (activeGte) params.append('active.gte', activeGte);
    if (activeLte) params.append('active.lte', activeLte);
    if (updatedGte) params.append('updated.gte', updatedGte);
    if (updatedLte) params.append('updated.lte', updatedLte);
    if (state) params.append('state', state);
    if (sort) params.append('sort', sort);
    if (rankGte !== undefined) params.append('rank.gte', rankGte.toString());
    if (rankLte !== undefined) params.append('rank.lte', rankLte.toString());
    if (localRankGte !== undefined)
      params.append('local_rank.gte', localRankGte.toString());
    if (localRankLte !== undefined)
      params.append('local_rank.lte', localRankLte.toString());
    if (aviationRankGte !== undefined)
      params.append('aviation_rank.gte', aviationRankGte.toString());
    if (aviationRankLte !== undefined)
      params.append('aviation_rank.lte', aviationRankLte.toString());
    if (place_id) params.append('place.id', place_id);
    if (relevance) params.append('relevance', relevance);
    if (brand_safe !== undefined)
      params.append('brand_safe', brand_safe.toString());
    if (deleted_reason) params.append('deleted_reason', deleted_reason);
    if (duplicate_of_id) params.append('duplicate_of_id', duplicate_of_id);

    url.search = params.toString();

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `PredictHQ API request failed with status ${response.status}: ${errorBody}`,
        );
      }

      const data = await response.json();

      // Transform the response to match our output schema
      const results =
        data.results?.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description || null,
          category: event.category,
          labels: event.labels || [],
          rank: event.rank,
          local_rank: event.local_rank,
          aviation_rank: event.aviation_rank,
          phq_attendance: event.phq_attendance,
          start: event.start,
          end: event.end || null,
          updated: event.updated,
          first_seen: event.first_seen,
          timezone: event.timezone || null,
          duration: event.duration,
          country: event.country,
          location: event.location || {
            type: event.geo?.geometry?.type || 'Point',
            coordinates: event.geo?.geometry?.coordinates || [],
          },
          geo: event.geo,
          scope: event.scope,
          relevance: event.relevance,
          state: event.state || 'active',
          brand_safe: event.brand_safe,
          deleted_reason: event.deleted_reason,
          duplicate_of_id: event.duplicate_of_id,
          entities: event.entities || [],
        })) || [];

      return {
        count: data.count || 0,
        overflow: data.overflow,
        next: data.next,
        previous: data.previous,
        results,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to fetch events from PredictHQ: ${error.message}`,
        );
      }
      throw new Error('Failed to fetch events from PredictHQ: Unknown error');
    }
  },
});
