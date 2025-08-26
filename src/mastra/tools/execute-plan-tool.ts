import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
// No need to import Mastra type directly if we're casting to 'any' for getTool/getAgent access
// import { Mastra } from '@mastra/core/mastra';

export const executePlanTool = createTool({
  id: 'execute-plan',
  description: 'Executes a structured plan of tool calls and returns their combined results.',
  inputSchema: z.array(
    z.object({
      tool: z.string().describe('The ID of the tool to call.'),
      args: z.record(z.any()).describe('The arguments for the tool call.'),
    })
  ).describe('A JSON array representing the plan of tool calls to execute.'),
  outputSchema: z.record(z.any()).describe('A JSON object containing the results of all executed tool calls, keyed by tool ID or unique identifier.'),
  execute: async ({ context, mastra }) => { // Receive 'mastra' here
    const plan = context; // The input is directly the plan array
    const results: Record<string, any> = {};

    // Use 'any' to bypass TypeScript's strictness for the 'mastra' object's methods
    const mastraInstance: any = mastra;

    // Basic runtime check for safety
    if (!mastraInstance || typeof mastraInstance.getTool !== 'function') {
      throw new Error("Mastra instance is not properly available or does not have 'getTool' method in tool context.");
    }

    for (const toolCall of plan) {
      const toolId = toolCall.tool;
      const toolArgs = toolCall.args;

      try {
        // Get the tool instance using mastraInstance.getTool()
        const toolInstance = mastraInstance.getTool(toolId);

        if (toolInstance && typeof toolInstance.execute === 'function') {
          // Mastra tools expect a 'context' object for their execute method
          const toolResult = await toolInstance.execute({ context: toolArgs });
          results[toolId] = toolResult; // Store result
        } else {
          results[toolId] = { error: `Tool '${toolId}' not found or not executable via mastra.getTool().` };
        }
      } catch (error: any) {
        results[toolId] = { error: error.message || 'Unknown error during tool execution' };
      }
    }
    return results;
  },
});