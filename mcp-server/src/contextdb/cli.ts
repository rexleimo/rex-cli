#!/usr/bin/env node
import path from 'node:path';
import {
  appendEvent,
  buildTimeline,
  buildContextPacket,
  createSession,
  ensureContextDb,
  findLatestSession,
  getEventById,
  rebuildContextIndex,
  resolveWorkspaceRoot,
  searchEvents,
  writeCheckpoint,
} from './core.js';

type Options = Record<string, string | boolean>;

function usage(): string {
  return [
    'Filesystem Context DB CLI',
    '',
    'Usage:',
    '  contextdb init [--workspace <path>]',
    '  contextdb session:new --agent <name> --project <name> --goal <text> [--tags a,b]',
    '  contextdb session:latest --agent <name> [--project <name>]',
    '  contextdb event:add --session <id> --role <user|assistant|tool|system> --text <text> [--kind <kind>] [--refs a,b]',
    '  contextdb checkpoint --session <id> --summary <text> [--status running|blocked|done] [--next a|b] [--artifacts a|b]',
    '  contextdb context:pack --session <id> [--limit 30] [--token-budget 1200] [--kinds prompt,response,error] [--refs a,b] [--no-dedupe] [--out memory/context-db/exports/<id>.md] [--stdout]',
    '  contextdb search [--query <text>] [--project <name>] [--session <id>] [--role <role>] [--kinds a,b] [--refs a,b] [--limit 20] [--semantic]',
    '  contextdb timeline [--project <name> | --session <id>] [--limit 50]',
    '  contextdb event:get --id <sessionId>#<seq>',
    '  contextdb index:rebuild [--workspace <path>]',
    '',
  ].join('\n');
}

function parseArgs(argv: string[]): { command: string; options: Options } {
  const [command = 'help', ...rest] = argv;
  const options: Options = {};

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith('--')) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    i += 1;
  }

  return { command, options };
}

function getOption(options: Options, key: string, fallback?: string): string {
  const value = options[key];
  if (typeof value === 'string') return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required option --${key}`);
}

function getOptionalCsv(options: Options, key: string, separator: string = ','): string[] {
  const value = options[key];
  if (typeof value !== 'string') return [];
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function getWorkspace(options: Options): string {
  const value = options.workspace;
  if (typeof value === 'string') {
    return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
  }
  return resolveWorkspaceRoot(process.cwd());
}

async function main(): Promise<void> {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(usage());
    return;
  }

  const workspaceRoot = getWorkspace(options);

  switch (command) {
    case 'init': {
      const dbRoot = await ensureContextDb(workspaceRoot);
      console.log(JSON.stringify({ ok: true, workspaceRoot, dbRoot }, null, 2));
      return;
    }

    case 'session:new': {
      const session = await createSession({
        workspaceRoot,
        agent: getOption(options, 'agent'),
        project: getOption(options, 'project'),
        goal: getOption(options, 'goal'),
        tags: getOptionalCsv(options, 'tags'),
        sessionId: typeof options['session-id'] === 'string' ? options['session-id'] : undefined,
      });
      console.log(JSON.stringify(session, null, 2));
      return;
    }

    case 'session:latest': {
      const latest = await findLatestSession(
        workspaceRoot,
        getOption(options, 'agent'),
        typeof options.project === 'string' ? options.project : undefined
      );
      console.log(JSON.stringify({ session: latest }, null, 2));
      return;
    }

    case 'event:add': {
      const event = await appendEvent({
        workspaceRoot,
        sessionId: getOption(options, 'session'),
        role: getOption(options, 'role') as 'system' | 'user' | 'assistant' | 'tool',
        text: getOption(options, 'text'),
        kind: typeof options.kind === 'string' ? options.kind : undefined,
        refs: getOptionalCsv(options, 'refs'),
      });
      console.log(JSON.stringify(event, null, 2));
      return;
    }

    case 'checkpoint': {
      const checkpoint = await writeCheckpoint({
        workspaceRoot,
        sessionId: getOption(options, 'session'),
        summary: getOption(options, 'summary'),
        status: typeof options.status === 'string' ? (options.status as 'running' | 'blocked' | 'done') : undefined,
        nextActions: getOptionalCsv(options, 'next', '|'),
        artifacts: getOptionalCsv(options, 'artifacts', '|'),
      });
      console.log(JSON.stringify(checkpoint, null, 2));
      return;
    }

    case 'context:pack': {
      const sessionId = getOption(options, 'session');
      const limit = typeof options.limit === 'string' ? Number(options.limit) : 30;
      const tokenBudget = typeof options['token-budget'] === 'string' ? Number(options['token-budget']) : undefined;
      const out = typeof options.out === 'string'
        ? options.out
        : path.join('memory', 'context-db', 'exports', `${sessionId}-context.md`);

      const result = await buildContextPacket({
        workspaceRoot,
        sessionId,
        eventLimit: Number.isFinite(limit) ? limit : 30,
        tokenBudget: tokenBudget !== undefined && Number.isFinite(tokenBudget) ? tokenBudget : undefined,
        kinds: getOptionalCsv(options, 'kinds'),
        refs: getOptionalCsv(options, 'refs'),
        dedupeEvents: options['no-dedupe'] === true ? false : true,
        outputPath: out,
      });

      if (options.stdout === true) {
        process.stdout.write(result.markdown);
      } else {
        console.log(JSON.stringify({ outputPath: result.outputPath, sessionId }, null, 2));
      }
      return;
    }

    case 'search': {
      const limit = typeof options.limit === 'string' ? Number(options.limit) : 20;
      const result = await searchEvents({
        workspaceRoot,
        query: typeof options.query === 'string' ? options.query : undefined,
        project: typeof options.project === 'string' ? options.project : undefined,
        sessionId: typeof options.session === 'string' ? options.session : undefined,
        role: typeof options.role === 'string' ? (options.role as 'system' | 'user' | 'assistant' | 'tool') : undefined,
        kinds: getOptionalCsv(options, 'kinds'),
        refs: getOptionalCsv(options, 'refs'),
        limit: Number.isFinite(limit) ? limit : 20,
        semantic: options.semantic === true,
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    case 'timeline': {
      const limit = typeof options.limit === 'string' ? Number(options.limit) : 50;
      const result = await buildTimeline({
        workspaceRoot,
        project: typeof options.project === 'string' ? options.project : undefined,
        sessionId: typeof options.session === 'string' ? options.session : undefined,
        limit: Number.isFinite(limit) ? limit : 50,
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    case 'event:get': {
      const result = await getEventById({
        workspaceRoot,
        eventId: getOption(options, 'id'),
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    case 'index:rebuild': {
      const result = await rebuildContextIndex(workspaceRoot);
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    default:
      throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
