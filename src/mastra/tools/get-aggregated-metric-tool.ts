import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const tomtomApiVersion = '2';
const baseURL = 'https://api.tomtom.com';

// Helper function to safely access nested properties using dot notation
const getNestedValue = (obj: any, path: string): number | undefined => {
  const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

export const getAggregatedMetricTool = createTool({
  id: 'get-aggregated-metric',
  description:
    'Performs a search and then calculates an aggregate metric (average, sum, count) on the results. Use this for questions like "What is the average rating..." or "How many cafes...".',
  inputSchema: z.object({
    search_query: z
      .string()
      .describe('The item to search for (e.g., "5-star hotels", "Starbucks").'),
    location: z
      .string()
      .describe(
        'The geographic area to search within (e.g., "Las Vegas", "Chicago").',
      ),
    aggregation_type: z
      .enum(['average', 'sum', 'count', 'max', 'min'])
      .describe('The type of calculation to perform.'),
    field_to_aggregate: z
      .string()
      .optional()
      .describe(
        'The field in the search results to perform the calculation on. Required for all aggregations except "count". Use dot notation for nested fields (e.g., "score").',
      ),
  }),
  outputSchema: z.object({
    result: z.number().describe('The result of the aggregation.'),
    description: z.string().describe('A human-readable summary of the result.'),
  }),
  execute: async ({ context }) => {
    const { search_query, location, aggregation_type, field_to_aggregate } =
      context;
    const apiKey = process.env.TOMTOM_API_KEY;

    if (!apiKey) {
      throw new Error('TomTom API key not found.');
    }

    // --- Step 1: Search for the data using TomTom API ---
    const searchUrl = new URL(
      `${baseURL}/search/${tomtomApiVersion}/search/${encodeURIComponent(search_query)}.json`,
    );
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('query', location); // Use location to constrain the search
    searchUrl.searchParams.append('limit', '100'); // Get a good number of results to analyze

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      throw new Error(
        `TomTom search request failed with status ${searchResponse.status}`,
      );
    }
    const searchData = await searchResponse.json();
    const data = searchData.results || [];

    // --- Step 2: Aggregate the results ---
    if (aggregation_type === 'count') {
      return {
        result: data.length,
        description: `Found a total of ${data.length} ${search_query} in ${location}.`,
      };
    }

    if (!field_to_aggregate) {
      throw new Error(
        'The `field_to_aggregate` parameter is required for this type of aggregation.',
      );
    }

    const validValues: number[] = [];
    for (const item of data) {
      const value = getNestedValue(item, field_to_aggregate);
      if (value !== undefined) {
        validValues.push(value);
      }
    }

    if (validValues.length === 0) {
      return {
        result: 0,
        description: `Could not find any valid data for the field '${field_to_aggregate}' in the search results.`,
      };
    }

    let result: number;
    switch (aggregation_type) {
      case 'sum':
        result = validValues.reduce((acc, val) => acc + val, 0);
        break;
      case 'average':
        result =
          validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
        break;
      case 'max':
        result = Math.max(...validValues);
        break;
      case 'min':
        result = Math.min(...validValues);
        break;
      default:
        throw new Error(`Unsupported aggregation type: ${aggregation_type}`);
    }

    return {
      result,
      description: `The ${aggregation_type} of '${field_to_aggregate}' for ${validValues.length} ${search_query} in ${location} is ${result}.`,
    };
  },
});
