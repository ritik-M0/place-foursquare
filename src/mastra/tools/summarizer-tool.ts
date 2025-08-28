import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { summarizerAgent } from '../agents/summarizer-agent'; // Import the new summarizer agent

export const summarizeTool = createTool({
  id: 'summarize-results',
  description:
    'Summarizes the results of a query and tool executions into a human-readable format.',
  inputSchema: z.object({
    query: z
      .string()
      .describe('The original natural language query from the user.'),
    data: z
      .record(z.any())
      .describe(
        'A JSON object containing the raw results from executed tool calls.',
      ),
  }),
  outputSchema: z
    .string()
    .describe('A concise, human-readable summary of the findings.'),
  execute: async ({ context }) => {
    const { query, data } = context;
    // The summarizer agent is designed to output only the plain text summary
    // Pass the input as a stringified JSON object within a message
    const response = await summarizerAgent.generate(
      JSON.stringify({ query, data }),
    );

    if (!response.text) {
      throw new Error('Summarizer Agent returned an empty response.');
    }

    return response.text;
  },
});
