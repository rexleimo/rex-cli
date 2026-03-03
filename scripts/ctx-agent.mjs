#!/usr/bin/env node
import { runCtxAgent } from './ctx-agent-core.mjs';

runCtxAgent(process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
