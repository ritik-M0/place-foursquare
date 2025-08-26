import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { plannerAgent } from '../agents/planner-agent'; // Import the new planner agent

export const planTool = createTool({
  id: 'plan-query',
  description: 'Generates a step-by-step plan of tool calls to fulfill a user query. This tool should be used first to determine what actions are needed.',
  inputSchema: z.object({
    query: z.string().describe('The natural language query from the user that needs to be planned.'),
  }),
  outputSchema: z.array(
    z.object({
      tool: z.string().describe('The ID of the tool to call.'),
      args: z.record(z.any()).describe('The arguments for the tool call.'),
    })
  ).describe('A JSON array representing the plan of tool calls.'),
  execute: async ({ context }) => {
    const { query } = context;
    // The planner agent is designed to output only the JSON array of tool calls
    const response = await plannerAgent.generate(query);

    if (!response.text || !response.text.trim().startsWith('[')) {
      throw new Error(
        'Planner Agent returned an empty or invalid response. Expected a JSON array of tool calls.',
      );
    }

    try {
      return JSON.parse(response.text);
    } catch (e) {
      throw new Error(
        'Planner Agent failed to generate valid JSON. The response was: ' +
          response.text,
      );
    }
  },
});
