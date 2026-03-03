#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_DIR="$ROOT_DIR/mcp-server"

AGENT=""
PROJECT="$(basename "$ROOT_DIR")"
GOAL=""
SESSION_ID=""
PROMPT=""
EVENT_LIMIT="30"
EXTRA_ARGS=()

usage() {
  cat <<'EOF'
Usage:
  scripts/ctx-agent.sh --agent <claude-code|gemini-cli> [options] [-- <extra agent args>]

Options:
  --agent <name>      Agent name: claude-code | gemini-cli
  --project <name>    Project name (default: current directory name)
  --goal <text>       Session goal (used when creating a new session)
  --session <id>      Reuse a specific session id
  --prompt <text>     Run in headless mode with one prompt and auto-log request/response
  --limit <n>         Number of recent events in context packet (default: 30)
  -h, --help          Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent)
      AGENT="${2:-}"; shift 2 ;;
    --project)
      PROJECT="${2:-}"; shift 2 ;;
    --goal)
      GOAL="${2:-}"; shift 2 ;;
    --session)
      SESSION_ID="${2:-}"; shift 2 ;;
    --prompt)
      PROMPT="${2:-}"; shift 2 ;;
    --limit)
      EVENT_LIMIT="${2:-30}"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    --)
      shift
      EXTRA_ARGS=("$@")
      break ;;
    *)
      EXTRA_ARGS+=("$1")
      shift ;;
  esac
done

if [[ -z "$AGENT" ]]; then
  echo "Missing required --agent"
  exit 1
fi

if [[ "$AGENT" != "claude-code" && "$AGENT" != "gemini-cli" ]]; then
  echo "--agent must be one of: claude-code, gemini-cli"
  exit 1
fi

ctx() {
  (
    cd "$MCP_DIR"
    npm run -s contextdb -- "$@"
  )
}

json_get() {
  node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync(0,'utf8'));const v=$1;process.stdout.write(v==null?'':String(v));"
}

if [[ -z "$SESSION_ID" ]]; then
  LATEST_JSON="$(ctx session:latest --agent "$AGENT" --project "$PROJECT")"
  SESSION_ID="$(printf '%s' "$LATEST_JSON" | json_get 'data.session && data.session.sessionId')"

  if [[ -z "$SESSION_ID" ]]; then
    if [[ -z "$GOAL" ]]; then
      GOAL="Shared context session for $AGENT on $PROJECT"
    fi
    CREATE_JSON="$(ctx session:new --agent "$AGENT" --project "$PROJECT" --goal "$GOAL")"
    SESSION_ID="$(printf '%s' "$CREATE_JSON" | json_get 'data.sessionId')"
  fi
fi

PACK_PATH="memory/context-db/exports/${SESSION_ID}-context.md"
ctx context:pack --session "$SESSION_ID" --limit "$EVENT_LIMIT" --out "$PACK_PATH" >/dev/null
PACK_ABS="$ROOT_DIR/$PACK_PATH"
CONTEXT_TEXT="$(cat "$PACK_ABS")"

echo "Session: $SESSION_ID"
echo "Context packet: $PACK_ABS"

if [[ -n "$PROMPT" ]]; then
  ctx event:add --session "$SESSION_ID" --role user --kind prompt --text "$PROMPT" >/dev/null
fi

if [[ "$AGENT" == "claude-code" ]]; then
  if [[ -n "$PROMPT" ]]; then
    OUTPUT="$(claude --print --append-system-prompt "$CONTEXT_TEXT" "$PROMPT" "${EXTRA_ARGS[@]}")"
    printf '%s\n' "$OUTPUT"
    LOG_OUTPUT="$(printf '%s' "$OUTPUT" | head -c 8000)"
    ctx event:add --session "$SESSION_ID" --role assistant --kind response --text "$LOG_OUTPUT" >/dev/null
  else
    exec claude --append-system-prompt "$CONTEXT_TEXT" "${EXTRA_ARGS[@]}"
  fi
elif [[ "$AGENT" == "gemini-cli" ]]; then
  if [[ -n "$PROMPT" ]]; then
    FULL_PROMPT="${CONTEXT_TEXT}"$'\n\n'"## New User Request"$'\n'"${PROMPT}"
    OUTPUT="$(gemini -p "$FULL_PROMPT" "${EXTRA_ARGS[@]}")"
    printf '%s\n' "$OUTPUT"
    LOG_OUTPUT="$(printf '%s' "$OUTPUT" | head -c 8000)"
    ctx event:add --session "$SESSION_ID" --role assistant --kind response --text "$LOG_OUTPUT" >/dev/null
  else
    exec gemini -i "$CONTEXT_TEXT" "${EXTRA_ARGS[@]}"
  fi
fi
