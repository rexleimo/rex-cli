# Playwright Browser MCP Server

`mcp-server` currently exposes a Playwright-based `browser_*` toolset (not `stealth_*`).

## Quick Start

```bash
cd mcp-server
npm install
npm run build
```

Configure Claude Code:

```json
{
  "mcpServers": {
    "puppeteer-stealth": {
      "command": "node",
      "args": ["/Users/you/path/to/aios/mcp-server/dist/index.js"]
    }
  }
}
```

Then restart Claude Code.

## Available Tools

- `browser_launch` `{ profile?, url?, headless? }`
- `browser_navigate` `{ url, profile?, newTab? }`
- `browser_click` `{ selector, profile?, double? }`
- `browser_type` `{ selector, text, profile? }`
- `browser_snapshot` `{ profile? }`
- `browser_auth_check` `{ profile? }`
- `browser_screenshot` `{ fullPage?, profile?, filePath? }`
- `browser_list_tabs` `{ profile? }`
- `browser_close` `{ profile? }`

## Profile Config

Use `config/browser-profiles.json` (project root):

```json
{
  "profiles": {
    "default": {
      "name": "default",
      "cdpPort": 9222
    },
    "local": {
      "name": "local",
      "userDataDir": ".browser-profiles/local",
      "executablePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    }
  }
}
```

Priority for launch mode:
1. `cdpUrl` / `cdpPort` (connect existing browser/fingerprint browser)
2. local launch with `executablePath` (profile or `BROWSER_EXECUTABLE_PATH`)
3. Playwright default browser executable

## Crash Troubleshooting (Google Chrome for Testing)

If you see `Google Chrome for Testing 意外退出`:

1. Start fingerprint browser with remote debugging on `9222` and keep it running.
2. Use `browser_launch` without profile (now defaults to CDP) or pass `{ "profile": "default" }`.
3. If you need local Playwright launch, explicitly use `{ "profile": "local" }`.
4. Optionally set `BROWSER_HEADLESS=true` for non-GUI environments.

## Notes

- The server auto-detects workspace root by locating `config/browser-profiles.json`.
- `browser_screenshot` returns base64 and can also save to disk via `filePath`.
- `browser_navigate` / `browser_snapshot` / `browser_auth_check` include `requiresHumanAction` and `auth` fields.
- If `requiresHumanAction=true`, complete login manually and then continue automation.
- Recommended policy: keep third-party account sign-in (Google/Meta/Jimeng auth walls) as human-in-the-loop.

## Action Pacing (Reliability)

Use optional pacing to reduce flaky fast-action races:

- `BROWSER_ACTION_PACING=true|false` (default: `true`)
- `BROWSER_ACTION_MIN_MS` (default: `400`)
- `BROWSER_ACTION_MAX_MS` (default: `1200`)

## Filesystem Context DB (for Codex/Claude/Gemini)

This repo now includes a lightweight filesystem context DB under `memory/context-db` to share memory across CLI tools.

### Commands

```bash
cd mcp-server
npm run contextdb -- init
npm run contextdb -- session:new --agent claude-code --project rex-ai-boot --goal "stabilize browser automation"
npm run contextdb -- event:add --session <session_id> --role user --text "Need retry and checkpoint strategy"
npm run contextdb -- checkpoint --session <session_id> --summary "Auth wall found; waiting human login" --status blocked --next "wait-login|resume-run"
npm run contextdb -- context:pack --session <session_id> --out memory/context-db/exports/<session_id>-context.md
```

### Feed context to each CLI

- Claude Code:
  ```bash
  claude --append-system-prompt "$(cat memory/context-db/exports/<session_id>-context.md)"
  ```
- Gemini CLI:
  ```bash
  gemini -i "$(cat memory/context-db/exports/<session_id>-context.md)"
  ```
- Codex CLI (example pattern):
  use the generated context packet as the first prompt in the session.

### One-command launcher (shared context session)

From repository root:

```bash
# Claude interactive (loads latest session context)
scripts/ctx-agent.sh --agent claude-code --project rex-ai-boot

# Gemini one-shot (auto logs prompt/response into context-db)
scripts/ctx-agent.sh --agent gemini-cli --project rex-ai-boot --prompt "继续上一次任务，先给我下一步计划"
```
