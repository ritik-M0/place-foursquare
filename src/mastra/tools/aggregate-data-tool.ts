import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Helper function to safely access nested properties using dot notation
const getNestedValue = (obj: any, path: string): number | undefined => {
  const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

export const aggregateDataTool = createTool({
  id: 'aggregate-data',
  description: 'Analyzes an array of JSON objects to perform a calculation (average, sum, count, max, min) on a specific numerical field.',
  inputSchema: z.object({
    data: z.array(z.any()).describe('The JSON array of data to analyze. This usually comes from the output of another tool.'),
    aggregation_type: z.enum(['average', 'sum', 'count', 'max', 'min']).describe('The type of calculation to perform.'),
    field_to_aggregate: z.string().describe('The field to perform the calculation on. Use dot notation for nested fields (e.g., "properties.relevance" or "venue_info.rating").'),
  }),
  outputSchema: z.object({
    result: z.number().describe('The result of the aggregation.'),
    aggregation_type: z.string(),
    records_processed: z.number().describe('The number of records that had a valid numerical value for the specified field.'),
    records_total: z.number().describe('The total number of records in the input data.'),
  }),
  execute: async ({ context }) => {
    const { data, aggregation_type, field_to_aggregate } = context;

    if (!data || data.length === 0) {
      return {
        result: 0,
        aggregation_type,
        records_processed: 0,
        records_total: 0,
      };
    }

    if (aggregation_type === 'count') {
      return {
        result: data.length,
        aggregation_type: 'count',
        records_processed: data.length,
        records_total: data.length,
      };
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
        aggregation_type,
        records_processed: 0,
        records_total: data.length,
      };
    }

    let result: number;
    switch (aggregation_type) {
      case 'sum':
        result = validValues.reduce((acc, val) => acc + val, 0);
        break;
      case 'average':
        result = validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
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
      aggregation_type,
      records_processed: validValues.length,
      records_total: data.length,
    };
  },
});
