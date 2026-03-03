import { existsSync, unlinkSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export interface SqliteSessionRow {
  sessionId: string;
  agent: string;
  project: string;
  goal: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SqliteEventRow {
  eventId: string;
  sessionId: string;
  seq: number;
  ts: string;
  tsEpoch: number;
  project: string;
  agent: string;
  role: string;
  kind: string;
  text: string;
  refs: string[];
  textHash: string;
  signatureHash: string;
}

export interface SqliteCheckpointRow {
  checkpointId: string;
  sessionId: string;
  seq: number;
  ts: string;
  tsEpoch: number;
  project: string;
  agent: string;
  status: string;
  summary: string;
  nextActions: string[];
  artifacts: string[];
}

export interface SqliteSearchInput {
  project?: string;
  sessionId?: string;
  role?: string;
  kinds?: string[];
  refs?: string[];
  query?: string;
  limit: number;
}

export interface SqliteTimelineInput {
  project?: string;
  sessionId?: string;
  limit: number;
}

interface EventSelectRow {
  event_id: string;
  session_id: string;
  seq: number;
  ts: string;
  ts_epoch: number;
  project: string;
  agent: string;
  role: string;
  kind: string;
  text: string;
  refs_json: string;
  text_hash: string;
  signature_hash: string;
}

interface CheckpointSelectRow {
  checkpoint_id: string;
  session_id: string;
  seq: number;
  ts: string;
  ts_epoch: number;
  project: string;
  agent: string;
  status: string;
  summary: string;
  next_actions_json: string;
  artifacts_json: string;
}

const dbConnections = new Map<string, Database.Database>();

function refsToFlat(refs: string[]): string {
  if (refs.length === 0) return '';
  return `|${refs.join('|')}|`;
}

function parseJsonStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function getConnection(dbPath: string): Database.Database {
  const cached = dbConnections.get(dbPath);
  if (cached) return cached;

  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  dbConnections.set(dbPath, db);
  return db;
}

function closeConnection(dbPath: string): void {
  const cached = dbConnections.get(dbPath);
  if (!cached) return;
  try {
    cached.close();
  } finally {
    dbConnections.delete(dbPath);
  }
}

export function ensureSqliteSidecar(dbPath: string): void {
  const db = getConnection(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      agent TEXT NOT NULL,
      project TEXT NOT NULL,
      goal TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      seq INTEGER NOT NULL,
      ts TEXT NOT NULL,
      ts_epoch INTEGER NOT NULL,
      project TEXT NOT NULL,
      agent TEXT NOT NULL,
      role TEXT NOT NULL,
      kind TEXT NOT NULL,
      text TEXT NOT NULL,
      refs_json TEXT NOT NULL,
      refs_flat TEXT NOT NULL,
      text_hash TEXT NOT NULL,
      signature_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      UNIQUE(session_id, seq)
    );

    CREATE TABLE IF NOT EXISTS checkpoints (
      checkpoint_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      seq INTEGER NOT NULL,
      ts TEXT NOT NULL,
      ts_epoch INTEGER NOT NULL,
      project TEXT NOT NULL,
      agent TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT NOT NULL,
      next_actions_json TEXT NOT NULL,
      artifacts_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      UNIQUE(session_id, seq)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_agent_project_updated
      ON sessions (agent, project, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_events_project_ts
      ON events (project, ts_epoch DESC);
    CREATE INDEX IF NOT EXISTS idx_events_session_ts
      ON events (session_id, ts_epoch DESC);
    CREATE INDEX IF NOT EXISTS idx_events_role_kind_ts
      ON events (role, kind, ts_epoch DESC);
    CREATE INDEX IF NOT EXISTS idx_checkpoints_project_ts
      ON checkpoints (project, ts_epoch DESC);
    CREATE INDEX IF NOT EXISTS idx_checkpoints_session_ts
      ON checkpoints (session_id, ts_epoch DESC);
  `);
}

export function recreateSqliteSidecar(dbPath: string): void {
  closeConnection(dbPath);
  for (const suffix of ['', '-wal', '-shm']) {
    const file = `${dbPath}${suffix}`;
    if (!existsSync(file)) continue;
    unlinkSync(file);
  }
  ensureSqliteSidecar(dbPath);
}

export function upsertSessionRow(dbPath: string, row: SqliteSessionRow): void {
  ensureSqliteSidecar(dbPath);
  const db = getConnection(dbPath);
  db.prepare(`
    INSERT INTO sessions (
      session_id, agent, project, goal, tags_json, created_at, updated_at
    ) VALUES (
      @session_id, @agent, @project, @goal, @tags_json, @created_at, @updated_at
    )
    ON CONFLICT(session_id) DO UPDATE SET
      agent=excluded.agent,
      project=excluded.project,
      goal=excluded.goal,
      tags_json=excluded.tags_json,
      updated_at=excluded.updated_at;
  `).run({
    session_id: row.sessionId,
    agent: row.agent,
    project: row.project,
    goal: row.goal,
    tags_json: JSON.stringify(row.tags),
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  });
}

export function upsertEventRow(dbPath: string, row: SqliteEventRow): void {
  ensureSqliteSidecar(dbPath);
  const db = getConnection(dbPath);
  db.prepare(`
    INSERT INTO events (
      event_id, session_id, seq, ts, ts_epoch, project, agent, role, kind, text, refs_json, refs_flat, text_hash, signature_hash
    ) VALUES (
      @event_id, @session_id, @seq, @ts, @ts_epoch, @project, @agent, @role, @kind, @text, @refs_json, @refs_flat, @text_hash, @signature_hash
    )
    ON CONFLICT(event_id) DO UPDATE SET
      ts=excluded.ts,
      ts_epoch=excluded.ts_epoch,
      project=excluded.project,
      agent=excluded.agent,
      role=excluded.role,
      kind=excluded.kind,
      text=excluded.text,
      refs_json=excluded.refs_json,
      refs_flat=excluded.refs_flat,
      text_hash=excluded.text_hash,
      signature_hash=excluded.signature_hash;
  `).run({
    event_id: row.eventId,
    session_id: row.sessionId,
    seq: row.seq,
    ts: row.ts,
    ts_epoch: row.tsEpoch,
    project: row.project,
    agent: row.agent,
    role: row.role,
    kind: row.kind,
    text: row.text,
    refs_json: JSON.stringify(row.refs),
    refs_flat: refsToFlat(row.refs),
    text_hash: row.textHash,
    signature_hash: row.signatureHash,
  });
}

export function upsertCheckpointRow(dbPath: string, row: SqliteCheckpointRow): void {
  ensureSqliteSidecar(dbPath);
  const db = getConnection(dbPath);
  db.prepare(`
    INSERT INTO checkpoints (
      checkpoint_id, session_id, seq, ts, ts_epoch, project, agent, status, summary, next_actions_json, artifacts_json
    ) VALUES (
      @checkpoint_id, @session_id, @seq, @ts, @ts_epoch, @project, @agent, @status, @summary, @next_actions_json, @artifacts_json
    )
    ON CONFLICT(checkpoint_id) DO UPDATE SET
      ts=excluded.ts,
      ts_epoch=excluded.ts_epoch,
      project=excluded.project,
      agent=excluded.agent,
      status=excluded.status,
      summary=excluded.summary,
      next_actions_json=excluded.next_actions_json,
      artifacts_json=excluded.artifacts_json;
  `).run({
    checkpoint_id: row.checkpointId,
    session_id: row.sessionId,
    seq: row.seq,
    ts: row.ts,
    ts_epoch: row.tsEpoch,
    project: row.project,
    agent: row.agent,
    status: row.status,
    summary: row.summary,
    next_actions_json: JSON.stringify(row.nextActions),
    artifacts_json: JSON.stringify(row.artifacts),
  });
}

export function searchEventRows(dbPath: string, input: SqliteSearchInput): SqliteEventRow[] {
  ensureSqliteSidecar(dbPath);
  const db = getConnection(dbPath);
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (input.project) {
    clauses.push('project = ?');
    params.push(input.project);
  }
  if (input.sessionId) {
    clauses.push('session_id = ?');
    params.push(input.sessionId);
  }
  if (input.role) {
    clauses.push('role = ?');
    params.push(input.role);
  }
  if (input.kinds && input.kinds.length > 0) {
    clauses.push(`kind IN (${input.kinds.map(() => '?').join(', ')})`);
    params.push(...input.kinds);
  }
  if (input.refs && input.refs.length > 0) {
    const refClauses = input.refs.map(() => 'refs_flat LIKE ?');
    clauses.push(`(${refClauses.join(' OR ')})`);
    params.push(...input.refs.map((ref) => `%|${ref}|%`));
  }
  if (input.query && input.query.trim().length > 0) {
    clauses.push('LOWER(text) LIKE ?');
    params.push(`%${input.query.trim().toLowerCase()}%`);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = Number.isFinite(input.limit) ? Math.max(1, Math.floor(input.limit)) : 20;
  params.push(limit);

  const rows = db.prepare(`
    SELECT
      event_id, session_id, seq, ts, ts_epoch, project, agent, role, kind, text, refs_json, text_hash, signature_hash
    FROM events
    ${where}
    ORDER BY ts_epoch DESC
    LIMIT ?;
  `).all(...params) as EventSelectRow[];

  return rows.map((row) => ({
    eventId: row.event_id,
    sessionId: row.session_id,
    seq: row.seq,
    ts: row.ts,
    tsEpoch: row.ts_epoch,
    project: row.project,
    agent: row.agent,
    role: row.role,
    kind: row.kind,
    text: row.text,
    refs: parseJsonStringArray(row.refs_json),
    textHash: row.text_hash,
    signatureHash: row.signature_hash,
  }));
}

export function getEventRowById(dbPath: string, eventId: string): SqliteEventRow | null {
  ensureSqliteSidecar(dbPath);
  const db = getConnection(dbPath);
  const row = db.prepare(`
    SELECT
      event_id, session_id, seq, ts, ts_epoch, project, agent, role, kind, text, refs_json, text_hash, signature_hash
    FROM events
    WHERE event_id = ?;
  `).get(eventId) as EventSelectRow | undefined;

  if (!row) return null;
  return {
    eventId: row.event_id,
    sessionId: row.session_id,
    seq: row.seq,
    ts: row.ts,
    tsEpoch: row.ts_epoch,
    project: row.project,
    agent: row.agent,
    role: row.role,
    kind: row.kind,
    text: row.text,
    refs: parseJsonStringArray(row.refs_json),
    textHash: row.text_hash,
    signatureHash: row.signature_hash,
  };
}

export function timelineEventRows(dbPath: string, input: SqliteTimelineInput): SqliteEventRow[] {
  return searchEventRows(dbPath, {
    project: input.project,
    sessionId: input.sessionId,
    limit: input.limit,
  });
}

export function timelineCheckpointRows(dbPath: string, input: SqliteTimelineInput): SqliteCheckpointRow[] {
  ensureSqliteSidecar(dbPath);
  const db = getConnection(dbPath);
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (input.project) {
    clauses.push('project = ?');
    params.push(input.project);
  }
  if (input.sessionId) {
    clauses.push('session_id = ?');
    params.push(input.sessionId);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = Number.isFinite(input.limit) ? Math.max(1, Math.floor(input.limit)) : 50;
  params.push(limit);

  const rows = db.prepare(`
    SELECT
      checkpoint_id, session_id, seq, ts, ts_epoch, project, agent, status, summary, next_actions_json, artifacts_json
    FROM checkpoints
    ${where}
    ORDER BY ts_epoch DESC
    LIMIT ?;
  `).all(...params) as CheckpointSelectRow[];

  return rows.map((row) => ({
    checkpointId: row.checkpoint_id,
    sessionId: row.session_id,
    seq: row.seq,
    ts: row.ts,
    tsEpoch: row.ts_epoch,
    project: row.project,
    agent: row.agent,
    status: row.status,
    summary: row.summary,
    nextActions: parseJsonStringArray(row.next_actions_json),
    artifacts: parseJsonStringArray(row.artifacts_json),
  }));
}

export function countSqliteRows(dbPath: string): { sessions: number; events: number; checkpoints: number } {
  ensureSqliteSidecar(dbPath);
  const db = getConnection(dbPath);
  const sessions = db.prepare('SELECT COUNT(*) AS count FROM sessions').get() as { count: number };
  const events = db.prepare('SELECT COUNT(*) AS count FROM events').get() as { count: number };
  const checkpoints = db.prepare('SELECT COUNT(*) AS count FROM checkpoints').get() as { count: number };
  return {
    sessions: sessions.count,
    events: events.count,
    checkpoints: checkpoints.count,
  };
}
