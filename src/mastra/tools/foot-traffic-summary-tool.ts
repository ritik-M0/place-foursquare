import { createTool, type ToolExecutionContext } from '@mastra/core/tools';
import { z } from 'zod';
import { getFootTrafficTool } from './foot-traffic-tool';

// Define the explicit types for the detailed tool's output
type FootTrafficSuccess = {
  status: 'OK';
  venue_info: { venue_name: string; venue_address: string; [key: string]: any };
  analysis: any[];
};

type FootTrafficError = {
  status: 'Error';
  message: string;
};

type FootTrafficResponse = FootTrafficSuccess | FootTrafficError;

export const getFootTrafficSummaryTool = createTool({
  id: 'get-foot-traffic-summary',
  description:
    'Gets a summarized, high-level foot traffic forecast for a venue. Use this when analyzing many locations to avoid running out of memory.',
  inputSchema: z.object({
    venue_name: z
      .string()
      .describe('The name of the venue (e.g., "McDonalds").'),
    venue_address: z
      .string()
      .describe('The address of the venue (e.g., "Ocean Ave, San Francisco").'),
  }),
  outputSchema: z.object({
    status: z.string(),
    message: z.string().optional(),
    venue_name: z.string().optional(),
    venue_address: z.string().optional(),
    overall_busyness: z
      .number()
      .optional()
      .describe('An overall busyness score from 0 (quiet) to 100 (very busy).'),
    peak_hours_summary: z
      .string()
      .optional()
      .describe('A human-readable summary of the busiest day and hours.'),
  }),
  execute: async (toolExecution) => {
    const detailedData = (await getFootTrafficTool.execute(
      toolExecution,
    )) as FootTrafficResponse;

    if (detailedData.status === 'Error') {
      return {
        status: 'Error',
        message: detailedData.message, // This is now safe
      };
    }

    // TypeScript now knows detailedData is type FootTrafficSuccess
    const analysis = detailedData.analysis;

    const dailyAverages = analysis.map((day: any) => {
      const raw = day.day_raw || [];
      if (raw.length === 0) return 0;
      const sum = raw.reduce((a: number, b: number) => a + b, 0);
      return sum / raw.length;
    });

    let overallBusyness = 0;
    if (dailyAverages.length > 0) {
      const totalAverage =
        dailyAverages.reduce((a: number, b: number) => a + b, 0) /
        dailyAverages.length;
      overallBusyness = Math.round(totalAverage);
    }

    let busiestDay: any = null;
    let maxMean = -1;

    for (const day of analysis) {
      const dayMean = day.day_info?.day_mean ?? 0;
      if (dayMean > maxMean) {
        maxMean = dayMean;
        busiestDay = day;
      }
    }

    let peakHoursSummary = ''; // Default to empty string
    if (
      busiestDay &&
      busiestDay.peak_hours &&
      busiestDay.peak_hours.length > 0
    ) {
      const peak = busiestDay.peak_hours[0];
      if (
        peak.peak_start !== undefined &&
        peak.peak_end !== undefined &&
        peak.peak_start !== null &&
        peak.peak_end !== null
      ) {
        peakHoursSummary = `${busiestDay.day_info.day_text} from ${peak.peak_start}:00 to ${peak.peak_end}:00`;
      }
      // If peak_start or peak_end are missing, peakHoursSummary remains an empty string.
    }

    return {
      status: 'OK',
      venue_name: detailedData.venue_info.venue_name, // This is now safe
      venue_address: detailedData.venue_info.venue_address, // This is now safe
      overall_busyness: overallBusyness,
      peak_hours_summary: peakHoursSummary,
    };
  },
});
