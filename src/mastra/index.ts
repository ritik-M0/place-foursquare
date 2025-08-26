import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';

import { orchestratorAgent } from './agents/orchestrator-agent';
import { mapDataAgent } from './agents/map-data-agent';
import { plannerAgent } from './agents/planner-agent';
import { summarizerAgent } from './agents/summarizer-agent';

export const mastra: Mastra = new Mastra({
  agents: { 
    orchestratorAgent,
    mapDataAgent,
    plannerAgent,
    summarizerAgent,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ':memory:',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
