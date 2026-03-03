# ContextDB SQLite Sidecar and P2 Semantic Retrieval Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a SQLite sidecar index for fast retrieval (`search`, `timeline`, `event:get`), complete P1 dedupe and runner-unification work, then add an optional P2 semantic retrieval layer.

**Architecture:** Keep `memory/context-db/sessions/*` as the only source of truth. Add `memory/context-db/index/context.db` as a rebuildable cache/index. Retrieval reads from SQLite first; if missing/corrupt, rebuild from filesystem and retry once. Semantic retrieval is optional and never replaces lexical retrieval.

**Tech Stack:** TypeScript, Node.js (`tsx`, `node:test`), existing contextdb CLI, SQLite client dependency (selected in Task 1).

---

## Scope and Non-Goals

- In scope (P1): SQLite sidecar index, index rebuild command, dedupe hardening, `ctx-agent.sh` + `ctx-agent.mjs` unification.
- In scope (P2): optional semantic query adapter behind feature flags.
- Non-goals: replacing filesystem canonical data, changing existing packet format, forcing semantic provider by default.

## Task 1: Baseline, Dependency Choice, and Failing Tests

**Files:**
- Modify: `mcp-server/package.json`
- Modify: `mcp-server/tests/contextdb.test.ts`
- Create (if needed): `mcp-server/tests/contextdb-index.test.ts`

**Step 1: Choose SQLite package and add dependency**
- Prefer package that passes current macOS/Linux setup and expected Windows CI/runtime.
- Add one package only (avoid parallel implementations).

**Step 2: Add failing tests for sidecar init and retrieval parity**
- `ensureContextDb` should create SQLite file and tables.
- `search/timeline/event:get` should return same shape as today.

**Step 3: Run failing tests**
- Run: `cd mcp-server && npm test`
- Expected: new tests fail before implementation.

**Step 4: Commit checkpoint**
- Commit message: `test(contextdb): add failing tests for sqlite sidecar index`

## Task 2: SQLite Sidecar Core Module

**Files:**
- Create: `mcp-server/src/contextdb/sqlite.ts`
- Modify: `mcp-server/src/contextdb/core.ts`

**Step 1: Implement sidecar path + schema init**
- DB path: `memory/context-db/index/context.db`
- Tables: `sessions`, `events`, `checkpoints`
- Indexes: project, session, ts, role/kind, refs lookup helper field(s)

**Step 2: Wire init into `ensureContextDb`**
- `ensureContextDb` becomes idempotent for both filesystem and SQLite schema.

**Step 3: Run tests**
- Run: `cd mcp-server && npm test`
- Expected: init tests pass.

**Step 4: Commit checkpoint**
- Commit message: `feat(contextdb): add sqlite sidecar schema and init`

## Task 3: Dual-Write + Dedupe Hardening (P1)

**Files:**
- Modify: `mcp-server/src/contextdb/core.ts`
- Modify: `mcp-server/tests/contextdb.test.ts`

**Step 1: Keep canonical writes unchanged**
- Continue writing `l2-events.jsonl` and `l1-checkpoints.jsonl` first.

**Step 2: Add sidecar upsert in same logical transaction scope**
- On `createSession`, `appendEvent`, `writeCheckpoint`, mirror rows into SQLite.

**Step 3: Harden dedupe**
- Compute stable content signature (`role|kind|normalized_text|refs` hash).
- Use configurable window (default 30s) and prevent duplicate insert for same signature in window.
- Keep returned event deterministic (`existing` event when deduped).

**Step 4: Run tests**
- Add/extend dedupe tests to cover adjacent and retry-like duplicates.

**Step 5: Commit checkpoint**
- Commit message: `feat(contextdb): dual-write sqlite index and harden dedupe`

## Task 4: Retrieval Migration + `index:rebuild`

**Files:**
- Modify: `mcp-server/src/contextdb/core.ts`
- Modify: `mcp-server/src/contextdb/cli.ts`
- Modify: `mcp-server/tests/contextdb.test.ts`

**Step 1: Move retrieval to sidecar queries**
- `searchEvents`, `buildTimeline`, `getEventById` read from SQLite.
- Preserve existing output schema.

**Step 2: Add fallback + rebuild path**
- If sidecar query fails due missing/corrupt DB: rebuild index from sessions and retry once.

**Step 3: Add CLI command**
- `contextdb index:rebuild [--workspace <path>]`
- Output stats: sessions/events/checkpoints indexed, duration.

**Step 4: Run tests**
- Add rebuild test and corruption-recovery test.

**Step 5: Commit checkpoint**
- Commit message: `feat(contextdb): sqlite-backed retrieval with rebuild command`

## Task 5: Unify Runner Implementations (P1)

**Files:**
- Create: `scripts/ctx-agent-core.mjs`
- Modify: `scripts/ctx-agent.mjs`
- Modify: `scripts/ctx-agent.sh`

**Step 1: Move shared behavior into Node core**
- Session resolve/init, packet build, event logging, checkpointing, one-shot/interactive flow.

**Step 2: Thin wrappers**
- `ctx-agent.mjs`: parse args + call core.
- `ctx-agent.sh`: strict wrapper that delegates to Node entry only.

**Step 3: Regression checks**
- Validate `--prompt`, `--session`, `--status`, `--max-log-chars`, `--` extra args.

**Step 4: Commit checkpoint**
- Commit message: `refactor(scripts): unify ctx-agent runner core`

## Task 6: Optional Semantic Retrieval (P2)

**Files:**
- Create: `mcp-server/src/contextdb/semantic.ts`
- Modify: `mcp-server/src/contextdb/core.ts`
- Modify: `mcp-server/src/contextdb/cli.ts`
- Modify: `mcp-server/tests/contextdb.test.ts`

**Step 1: Define semantic provider interface**
- Embed/query methods + health check.
- Load only when env enabled (`CONTEXTDB_SEMANTIC=1`).

**Step 2: Add `search --semantic`**
- Semantic results merged/reranked with lexical fallback.
- If provider unavailable/fails: return lexical path without hard failure.

**Step 3: Add tests**
- Feature-off default behavior, feature-on happy path (mock provider), provider-failure fallback.

**Step 4: Commit checkpoint**
- Commit message: `feat(contextdb): add optional semantic retrieval adapter`

## Task 7: Docs, I18n, Verification, Rollout

**Files:**
- Modify: `README.md`
- Modify: `README-zh.md`
- Modify: `docs-site/contextdb.md`
- Modify: `docs-site/zh/contextdb.md`
- Modify: `docs-site/ja/contextdb.md`
- Modify: `docs-site/ko/contextdb.md`
- Modify: `CHANGELOG.md`
- Update related skills if behavior changed (contextdb/cap workflow skills)

**Step 1: Document runbook**
- Init, rebuild, failure recovery, semantic enable/disable, rollback.

**Step 2: Verification**
- Run: `cd mcp-server && npm run typecheck`
- Run: `cd mcp-server && npm test`
- Smoke CLI:
  - `npm run -s contextdb -- init`
  - `npm run -s contextdb -- index:rebuild`
  - `npm run -s contextdb -- search --query "auth"`
  - `npm run -s contextdb -- timeline --limit 10`

**Step 3: Release notes**
- Add migration notes and expected performance impact.

**Step 4: Final commit**
- Commit message: `docs(contextdb): document sqlite sidecar and semantic retrieval`

---

## Risk Controls

- Keep filesystem writes first; sidecar failure must not block canonical persistence.
- Retrieval fallback to rebuild avoids runtime outage.
- Semantic path is opt-in and can be disabled instantly with env flags.

## Acceptance Criteria

- P1: `search/timeline/event:get` use SQLite path in normal case; rebuild fallback works.
- P1: dedupe prevents duplicate events by signature + time window.
- P1: single source implementation for runner flow (`ctx-agent-core.mjs`), wrappers are thin.
- P2: semantic search can be enabled, and lexical fallback remains available.
