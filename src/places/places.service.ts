import { Injectable, Logger } from '@nestjs/common';
import { mastra } from '../mastra';

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);

  async chatWithAgent(
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sessionId?: string,
  ): Promise<string> {
    try {
      this.logger.log(
        `Processing chat message: ${message.substring(0, 100)}...`,
      );

      const agent = mastra.getAgent('tomtomAgent');
      if (!agent) {
        throw new Error('TomTom agent not found');
      }

      const result = await agent.generate(message);

      this.logger.log('Chat message processed successfully');
      return result.text;
    } catch (error) {
      this.logger.error('Error in chat service:', error);
      throw error;
    }
  }

  async *chatWithAgentStream(
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sessionId?: string,
  ): AsyncGenerator<string, void, unknown> {
    try {
      this.logger.log(
        `Processing streaming chat message: ${message.substring(0, 100)}...`,
      );

      const agent = mastra.getAgent('tomtomAgent');
      if (!agent) {
        throw new Error('TomTom agent not found');
      }

      const streamResult = await agent.stream(message);

      // Handle the stream result properly using textStream
      for await (const chunk of streamResult.textStream) {
        yield chunk;
      }

      this.logger.log('Streaming chat message processed successfully');
    } catch (error) {
      this.logger.error('Error in streaming chat service:', error);
      throw error;
    }
  }

  async searchPlaces(
    query: string,
    lat?: string,
    lon?: string,
    limit?: string,
    radius?: string,
  ): Promise<{ response: string; searchMessage: string }> {
    try {
      this.logger.log(`Processing search: ${query}`);

      // Build a natural language message for the agent
      let message = `Search for "${query}"`;

      if (lat && lon) {
        message += ` near coordinates ${lat}, ${lon}`;
      }

      if (limit) {
        message += ` with a limit of ${limit} results`;
      }

      if (radius) {
        message += ` within ${radius} meters`;
      }

      const agent = mastra.getAgent('tomtomAgent');
      if (!agent) {
        throw new Error('TomTom agent not found');
      }

      const result = await agent.generate(message);

      this.logger.log('Search processed successfully');
      return {
        response: result.text,
        searchMessage: message,
      };
    } catch (error) {
      this.logger.error('Error in search service:', error);
      throw error;
    }
  }

  async getLocationSuggestion(): Promise<string> {
    try {
      this.logger.log('Processing location request');

      const agent = mastra.getAgent('tomtomAgent');
      if (!agent) {
        throw new Error('TomTom agent not found');
      }

      const message = 'Can you help me determine my current location?';
      const result = await agent.generate(message);

      this.logger.log('Location request processed successfully');
      return result.text;
    } catch (error) {
      this.logger.error('Error in location service:', error);
      throw error;
    }
  }
}
