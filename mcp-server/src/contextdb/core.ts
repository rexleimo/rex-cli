import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export type SessionStatus = 'running' | 'blocked' | 'done';
export type EventRole = 'system' | 'user' | 'assistant' | 'tool';

export interface SessionMeta {
  schemaVersion: 1;
  sessionId: string;
  agent: string;
  project: string;
  goal: string;
  tags: string[];
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContextEvent {
  ts: string;
  role: EventRole;
  kind: string;
  text: string;
  refs: string[];
}

export interface Checkpoint {
  ts: string;
  status: SessionStatus;
  summary: string;
  nextActions: string[];
  artifacts: string[];
}

interface SessionPaths {
  dir: string;
  meta: string;
  summary: string;
  checkpoints: string;
  events: string;
  state: string;
}

const DB_RELATIVE_PATH = path.join('memory', 'context-db');
const MANIFEST_NAME = 'manifest.json';
const INDEX_SESSIONS_NAME = 'sessions.jsonl';

function nowIso(): string {
  return new Date().toISOString();
}

function sessionTimestamp(): string {
  return nowIso().replace(/[-:.]/g, '').slice(0, 15);
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'session';
}

function toJsonLine(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

async function ensureFile(filePath: string, content: string = ''): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, content, 'utf8');
  }
}

async function appendJsonLine(filePath: string, value: unknown): Promise<void> {
  await fs.appendFile(filePath, toJsonLine(value), 'utf8');
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function readJsonLines<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as T);
  } catch {
    return [];
  }
}

function getDbRoot(workspaceRoot: string): string {
  return path.join(workspaceRoot, DB_RELATIVE_PATH);
}

function getSessionsIndexPath(workspaceRoot: string): string {
  return path.join(getDbRoot(workspaceRoot), 'index', INDEX_SESSIONS_NAME);
}

function getSessionPaths(workspaceRoot: string, sessionId: string): SessionPaths {
  const dir = path.join(getDbRoot(workspaceRoot), 'sessions', sessionId);
  return {
    dir,
    meta: path.join(dir, 'meta.json'),
    summary: path.join(dir, 'l0-summary.md'),
    checkpoints: path.join(dir, 'l1-checkpoints.jsonl'),
    events: path.join(dir, 'l2-events.jsonl'),
    state: path.join(dir, 'state.json'),
  };
}

async function touchSessionMeta(workspaceRoot: string, sessionId: string, mutate?: (meta: SessionMeta) => SessionMeta): Promise<SessionMeta> {
  const paths = getSessionPaths(workspaceRoot, sessionId);
  const meta = await readJson<SessionMeta>(paths.meta);
  const updated = mutate ? mutate(meta) : meta;
  updated.updatedAt = nowIso();
  await writeJson(paths.meta, updated);
  return updated;
}

function formatSummaryMarkdown(meta: SessionMeta, checkpoint: Checkpoint): string {
  const nextActions = checkpoint.nextActions.length > 0
    ? checkpoint.nextActions.map((item) => `- ${item}`).join('\n')
    : '- (none)';
  const artifacts = checkpoint.artifacts.length > 0
    ? checkpoint.artifacts.map((item) => `- ${item}`).join('\n')
    : '- (none)';

  return [
    `# Session ${meta.sessionId}`,
    '',
    `- Agent: ${meta.agent}`,
    `- Project: ${meta.project}`,
    `- Goal: ${meta.goal}`,
    `- Status: ${checkpoint.status}`,
    `- Updated: ${checkpoint.ts}`,
    '',
    '## Summary',
    checkpoint.summary,
    '',
    '## Next Actions',
    nextActions,
    '',
    '## Artifacts',
    artifacts,
    '',
  ].join('\n');
}

export function resolveWorkspaceRoot(cwd: string = process.cwd()): string {
  const candidates = [
    cwd,
    path.resolve(cwd, '..'),
    path.resolve(cwd, '..', '..'),
    path.resolve(cwd, '..', '..', '..'),
  ];

  for (const candidate of candidates) {
    const hasConfig = existsSync(path.join(candidate, 'config', 'browser-profiles.json'));
    const hasMemory = existsSync(path.join(candidate, 'memory'));
    if (hasConfig && hasMemory) {
      return candidate;
    }
  }

  return cwd;
}

export async function ensureContextDb(workspaceRoot: string): Promise<string> {
  const dbRoot = getDbRoot(workspaceRoot);
  await Promise.all([
    fs.mkdir(path.join(dbRoot, 'sessions'), { recursive: true }),
    fs.mkdir(path.join(dbRoot, 'index'), { recursive: true }),
    fs.mkdir(path.join(dbRoot, 'exports'), { recursive: true }),
  ]);

  const manifestPath = path.join(dbRoot, MANIFEST_NAME);
  if (!existsSync(manifestPath)) {
    await writeJson(manifestPath, {
      version: 1,
      layout: 'l0-l1-l2',
      description: 'Filesystem context database for multi-CLI agent memory',
      createdAt: nowIso(),
    });
  }

  await ensureFile(getSessionsIndexPath(workspaceRoot), '');
  return dbRoot;
}

export interface CreateSessionInput {
  workspaceRoot: string;
  agent: string;
  project: string;
  goal: string;
  tags?: string[];
  sessionId?: string;
}

export async function createSession(input: CreateSessionInput): Promise<SessionMeta> {
  if (!input.agent || !input.project || !input.goal) {
    throw new Error('createSession requires agent, project, and goal');
  }

  await ensureContextDb(input.workspaceRoot);
  const sessionId = input.sessionId || `${slugify(input.agent)}-${sessionTimestamp()}-${crypto.randomUUID().slice(0, 8)}`;
  const paths = getSessionPaths(input.workspaceRoot, sessionId);
  await fs.mkdir(paths.dir, { recursive: false });

  const ts = nowIso();
  const meta: SessionMeta = {
    schemaVersion: 1,
    sessionId,
    agent: input.agent,
    project: input.project,
    goal: input.goal,
    tags: input.tags ?? [],
    status: 'running',
    createdAt: ts,
    updatedAt: ts,
  };

  await Promise.all([
    writeJson(paths.meta, meta),
    fs.writeFile(
      paths.summary,
      `# Session ${sessionId}\n\nPending first checkpoint.\n`,
      'utf8'
    ),
    ensureFile(paths.checkpoints, ''),
    ensureFile(paths.events, ''),
    writeJson(paths.state, {
      sessionId,
      lastEventAt: null,
      lastCheckpointAt: null,
    }),
  ]);

  await appendJsonLine(getSessionsIndexPath(input.workspaceRoot), {
    sessionId,
    agent: input.agent,
    project: input.project,
    goal: input.goal,
    tags: input.tags ?? [],
    createdAt: ts,
  });

  return meta;
}

export interface AppendEventInput {
  workspaceRoot: string;
  sessionId: string;
  role: EventRole;
  text: string;
  kind?: string;
  refs?: string[];
}

export async function appendEvent(input: AppendEventInput): Promise<ContextEvent> {
  if (!input.sessionId || !input.role || !input.text) {
    throw new Error('appendEvent requires sessionId, role, and text');
  }

  await ensureContextDb(input.workspaceRoot);
  const paths = getSessionPaths(input.workspaceRoot, input.sessionId);

  const event: ContextEvent = {
    ts: nowIso(),
    role: input.role,
    kind: input.kind || 'message',
    text: input.text,
    refs: input.refs ?? [],
  };

  await appendJsonLine(paths.events, event);
  await touchSessionMeta(input.workspaceRoot, input.sessionId);

  const state = await readJson<Record<string, unknown>>(paths.state);
  state.lastEventAt = event.ts;
  await writeJson(paths.state, state);

  return event;
}

export interface WriteCheckpointInput {
  workspaceRoot: string;
  sessionId: string;
  summary: string;
  status?: SessionStatus;
  nextActions?: string[];
  artifacts?: string[];
}

export async function writeCheckpoint(input: WriteCheckpointInput): Promise<Checkpoint> {
  if (!input.sessionId || !input.summary) {
    throw new Error('writeCheckpoint requires sessionId and summary');
  }

  await ensureContextDb(input.workspaceRoot);
  const paths = getSessionPaths(input.workspaceRoot, input.sessionId);
  const status = input.status ?? 'running';
  const checkpoint: Checkpoint = {
    ts: nowIso(),
    status,
    summary: input.summary,
    nextActions: input.nextActions ?? [],
    artifacts: input.artifacts ?? [],
  };

  await appendJsonLine(paths.checkpoints, checkpoint);
  const meta = await touchSessionMeta(input.workspaceRoot, input.sessionId, (prev) => ({
    ...prev,
    status,
  }));
  await fs.writeFile(paths.summary, formatSummaryMarkdown(meta, checkpoint), 'utf8');

  const state = await readJson<Record<string, unknown>>(paths.state);
  state.lastCheckpointAt = checkpoint.ts;
  state.status = status;
  state.nextActions = checkpoint.nextActions;
  await writeJson(paths.state, state);

  return checkpoint;
}

export async function getSessionMeta(workspaceRoot: string, sessionId: string): Promise<SessionMeta> {
  return await readJson<SessionMeta>(getSessionPaths(workspaceRoot, sessionId).meta);
}

export async function findLatestSession(workspaceRoot: string, agent: string, project?: string): Promise<SessionMeta | null> {
  await ensureContextDb(workspaceRoot);
  const sessionsRoot = path.join(getDbRoot(workspaceRoot), 'sessions');
  const entries = await fs.readdir(sessionsRoot, { withFileTypes: true });
  const metas: SessionMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const metaPath = path.join(sessionsRoot, entry.name, 'meta.json');
    if (!existsSync(metaPath)) continue;
    const meta = await readJson<SessionMeta>(metaPath);
    if (meta.agent !== agent) continue;
    if (project && meta.project !== project) continue;
    metas.push(meta);
  }

  metas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return metas[0] ?? null;
}

export interface BuildPacketInput {
  workspaceRoot: string;
  sessionId: string;
  eventLimit?: number;
  outputPath?: string;
}

export interface BuildPacketOutput {
  markdown: string;
  outputPath?: string;
}

export async function buildContextPacket(input: BuildPacketInput): Promise<BuildPacketOutput> {
  await ensureContextDb(input.workspaceRoot);
  const paths = getSessionPaths(input.workspaceRoot, input.sessionId);
  const eventLimit = input.eventLimit ?? 30;

  const [meta, summaryRaw, checkpoints, events] = await Promise.all([
    readJson<SessionMeta>(paths.meta),
    fs.readFile(paths.summary, 'utf8'),
    readJsonLines<Checkpoint>(paths.checkpoints),
    readJsonLines<ContextEvent>(paths.events),
  ]);

  const latestCheckpoint = checkpoints[checkpoints.length - 1] ?? null;
  const tailEvents = events.slice(Math.max(0, events.length - eventLimit));

  const checkpointBlock = latestCheckpoint
    ? [
      `- Status: ${latestCheckpoint.status}`,
      `- Time: ${latestCheckpoint.ts}`,
      '',
      latestCheckpoint.summary,
      '',
      'Next Actions:',
      ...(latestCheckpoint.nextActions.length > 0
        ? latestCheckpoint.nextActions.map((item) => `- ${item}`)
        : ['- (none)']),
      '',
      'Artifacts:',
      ...(latestCheckpoint.artifacts.length > 0
        ? latestCheckpoint.artifacts.map((item) => `- ${item}`)
        : ['- (none)']),
    ].join('\n')
    : 'No checkpoint yet.';

  const eventBlock = tailEvents.length > 0
    ? tailEvents
      .map((item, index) => `${index + 1}. [${item.ts}] ${item.role}/${item.kind}: ${item.text}`)
      .join('\n')
    : '1. (no events yet)';

  const markdown = [
    '# Context Packet',
    '',
    `- Generated: ${nowIso()}`,
    `- Session: ${meta.sessionId}`,
    `- Agent: ${meta.agent}`,
    `- Project: ${meta.project}`,
    `- Goal: ${meta.goal}`,
    `- Status: ${meta.status}`,
    '',
    '## L0 Summary',
    summaryRaw.trim(),
    '',
    '## Latest Checkpoint (L1)',
    checkpointBlock,
    '',
    `## Recent Events (L2, last ${eventLimit})`,
    eventBlock,
    '',
    '## Handoff Prompt',
    'Continue from this state. Preserve constraints, avoid repeating completed work, and update the next checkpoint when done.',
    '',
  ].join('\n');

  if (!input.outputPath) {
    return { markdown };
  }

  const outputPath = path.isAbsolute(input.outputPath)
    ? input.outputPath
    : path.resolve(input.workspaceRoot, input.outputPath);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, markdown, 'utf8');
  return { markdown, outputPath };
}
