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
      "userDataDir": ".browser-profiles/default"
    },
    "fingerprint": {
      "name": "fingerprint",
      "cdpUrl": "http://127.0.0.1:9222"
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

1. Prefer CDP mode (`cdpUrl`/`cdpPort`) to reuse your fingerprint browser.
2. Or set `executablePath` to a stable system browser in profile config.
3. Optionally set `BROWSER_HEADLESS=true` for non-GUI environments.

## Notes

- The server auto-detects workspace root by locating `config/browser-profiles.json`.
- `browser_screenshot` returns base64 and can also save to disk via `filePath`.
