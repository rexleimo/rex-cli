#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  cat <<'USAGE'
AIOS unified entry (TUI + wrapper)

Usage:
  scripts/aios.sh                     # interactive TUI
  scripts/aios.sh <cmd> [--] [args]   # non-interactive wrapper

Commands:
  setup       -> scripts/setup-all.sh
  update      -> scripts/update-all.sh
  uninstall   -> scripts/uninstall-all.sh
  doctor      -> scripts/verify-aios.sh

Examples:
  scripts/aios.sh setup --components all --mode opt-in
  scripts/aios.sh update --components shell,skills --skip-doctor
  scripts/aios.sh doctor --strict
USAGE
}

run_wrapped() {
  local cmd="$1"
  shift

  local script=""
  case "$cmd" in
    setup) script="$SCRIPT_DIR/setup-all.sh" ;;
    update) script="$SCRIPT_DIR/update-all.sh" ;;
    uninstall) script="$SCRIPT_DIR/uninstall-all.sh" ;;
    doctor) script="$SCRIPT_DIR/verify-aios.sh" ;;
    *)
      echo "Unknown command: $cmd" >&2
      usage >&2
      return 1
      ;;
  esac

  if [[ "${1:-}" == "--" ]]; then
    shift
  fi

  echo "+ $script $*"
  "$script" "$@"
}

if [[ $# -gt 0 ]]; then
  case "${1:-}" in
    -h|--help|help)
      usage
      exit 0
      ;;
    setup|update|uninstall|doctor)
      cmd="$1"
      shift
      run_wrapped "$cmd" "$@"
      exit $?
      ;;
    *)
      echo "Unknown command: ${1:-}" >&2
      usage >&2
      exit 1
      ;;
  esac
fi

if [[ ! -t 0 || ! -t 1 ]]; then
  echo "[warn] interactive TUI requires a TTY" >&2
  usage >&2
  exit 1
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
WHITE='\033[1;37m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'
BOLD='\033[1m'

orig_stty=""
in_tui="false"

cleanup() {
  if [[ "$in_tui" == "true" ]]; then
    if [[ -n "$orig_stty" ]]; then
      stty "$orig_stty" 2>/dev/null || true
    fi
    tput cnorm 2>/dev/null || true
    in_tui="false"
  fi
}

enter_tui() {
  orig_stty="$(stty -g 2>/dev/null || echo "")"
  stty -echo -icanon min 1 time 0 2>/dev/null || true
  tput civis 2>/dev/null || true
  in_tui="true"
}

leave_tui() {
  cleanup
  tput clear 2>/dev/null || true
}

trap cleanup EXIT INT TERM

read_key() {
  local key=""
  IFS= read -rsn1 key 2>/dev/null || true
  if [[ "$key" == $'\x1b' ]]; then
    local k2=""
    local k3=""
    IFS= read -rsn1 k2 2>/dev/null || true
    if [[ "$k2" == "[" ]]; then
      IFS= read -rsn1 k3 2>/dev/null || true
      printf '%s' "[$k3"
      return 0
    fi
    printf '%s' "$k2"
    return 0
  fi
  printf '%s' "$key"
}

draw_header() {
  printf '%b\n' "${BOLD}${BLUE}AIOS — Unified Entry (TUI)${NC}"
  printf '%b\n' "${GRAY}Repo: ${ROOT_DIR}${NC}"
  printf '%b\n' "${GRAY}Use ↑/↓ to navigate, SPACE to toggle, ENTER to confirm, B to back, Q to quit${NC}"
  printf '\n'
}

render_item() {
  local label="$1"
  local active="$2"
  local hint="${3:-}"

  if [[ "$active" == "true" ]]; then
    printf '%b' "${WHITE}${BOLD}▸ ${label}${NC}"
  else
    printf '%b' "${GRAY}  ${label}${NC}"
  fi
  if [[ -n "$hint" ]]; then
    printf ' %b' "${GRAY}${hint}${NC}"
  fi
  printf '\n'
}

render_checkbox() {
  local label="$1"
  local checked="$2"
  local active="$3"

  local mark="[ ]"
  if [[ "$checked" == "true" ]]; then
    mark="[x]"
  fi

  if [[ "$active" == "true" ]]; then
    printf '%b\n' "${WHITE}${BOLD}▸ ${mark} ${label}${NC}"
  else
    if [[ "$checked" == "true" ]]; then
      printf '%b\n' "${GREEN}  ${mark} ${label}${NC}"
    else
      printf '%b\n' "${GRAY}  ${mark} ${label}${NC}"
    fi
  fi
}

render_cycle() {
  local label="$1"
  local value="$2"
  local active="$3"

  if [[ "$active" == "true" ]]; then
    printf '%b\n' "${WHITE}${BOLD}▸ ${label}: ${value}${NC}"
  else
    printf '%b\n' "${GRAY}  ${label}: ${WHITE}${value}${NC}"
  fi
}

join_components() {
  local parts=()
  [[ "$COMP_BROWSER" == "true" ]] && parts+=("browser")
  [[ "$COMP_SHELL" == "true" ]] && parts+=("shell")
  [[ "$COMP_SKILLS" == "true" ]] && parts+=("skills")
  [[ "$COMP_SUPERPOWERS" == "true" ]] && parts+=("superpowers")
  if [[ ${#parts[@]} -eq 0 ]]; then
    printf '%s' ""
    return 0
  fi
  local out=""
  local item=""
  for item in "${parts[@]}"; do
    if [[ -z "$out" ]]; then
      out="$item"
    else
      out="$out,$item"
    fi
  done
  printf '%s' "$out"
}

ensure_any_setup_component() {
  if [[ "$COMP_BROWSER" != "true" && "$COMP_SHELL" != "true" && "$COMP_SKILLS" != "true" && "$COMP_SUPERPOWERS" != "true" ]]; then
    COMP_SHELL="true"
  fi
}

ensure_any_uninstall_component() {
  if [[ "$UNINSTALL_BROWSER" != "true" && "$UNINSTALL_SHELL" != "true" && "$UNINSTALL_SKILLS" != "true" && "$UNINSTALL_SUPERPOWERS" != "true" ]]; then
    UNINSTALL_SHELL="true"
  fi
}

MODE_OPTS=("all" "repo-only" "opt-in" "off")
CLIENT_OPTS=("all" "codex" "claude" "gemini" "opencode")

MODE_IDX=2
CLIENT_IDX=0

COMP_BROWSER="true"
COMP_SHELL="true"
COMP_SKILLS="true"
COMP_SUPERPOWERS="true"

SETUP_SKIP_PLAYWRIGHT="false"
SETUP_SKIP_DOCTOR="false"

UPDATE_WITH_PLAYWRIGHT="false"
UPDATE_SKIP_DOCTOR="false"

UNINSTALL_BROWSER="false"
UNINSTALL_SHELL="true"
UNINSTALL_SKILLS="true"
UNINSTALL_SUPERPOWERS="false"

DOCTOR_STRICT="false"
DOCTOR_GLOBAL_SECURITY="false"

screen="main"
cursor=0
confirm_action=""

build_command_display() {
  local action="$1"
  local mode="${MODE_OPTS[$MODE_IDX]}"
  local client="${CLIENT_OPTS[$CLIENT_IDX]}"

  case "$action" in
    setup)
      local comps
      comps="$(join_components)"
      local cmd=("scripts/setup-all.sh" "--components" "$comps" "--mode" "$mode" "--client" "$client")
      [[ "$SETUP_SKIP_PLAYWRIGHT" == "true" ]] && cmd+=("--skip-playwright-install")
      [[ "$SETUP_SKIP_DOCTOR" == "true" ]] && cmd+=("--skip-doctor")
      printf '%s' "${cmd[*]}"
      ;;
    update)
      local comps
      comps="$(join_components)"
      local cmd=("scripts/update-all.sh" "--components" "$comps" "--mode" "$mode" "--client" "$client")
      [[ "$UPDATE_WITH_PLAYWRIGHT" == "true" ]] && cmd+=("--with-playwright-install")
      [[ "$UPDATE_SKIP_DOCTOR" == "true" ]] && cmd+=("--skip-doctor")
      printf '%s' "${cmd[*]}"
      ;;
    uninstall)
      local parts=()
      [[ "$UNINSTALL_BROWSER" == "true" ]] && parts+=("browser")
      [[ "$UNINSTALL_SHELL" == "true" ]] && parts+=("shell")
      [[ "$UNINSTALL_SKILLS" == "true" ]] && parts+=("skills")
      [[ "$UNINSTALL_SUPERPOWERS" == "true" ]] && parts+=("superpowers")
      local comps=""
      local item=""
      for item in "${parts[@]}"; do
        if [[ -z "$comps" ]]; then
          comps="$item"
        else
          comps="$comps,$item"
        fi
      done
      local cmd=("scripts/uninstall-all.sh" "--components" "$comps" "--client" "$client")
      printf '%s' "${cmd[*]}"
      ;;
    doctor)
      local cmd=("scripts/verify-aios.sh")
      [[ "$DOCTOR_STRICT" == "true" ]] && cmd+=("--strict")
      [[ "$DOCTOR_GLOBAL_SECURITY" == "true" ]] && cmd+=("--global-security")
      printf '%s' "${cmd[*]}"
      ;;
  esac
}

run_command() {
  local action="$1"
  local mode="${MODE_OPTS[$MODE_IDX]}"
  local client="${CLIENT_OPTS[$CLIENT_IDX]}"

  leave_tui

  local status=0
  set +e
  case "$action" in
    setup)
      local comps
      comps="$(join_components)"
      args=("--components" "$comps" "--mode" "$mode" "--client" "$client")
      [[ "$SETUP_SKIP_PLAYWRIGHT" == "true" ]] && args+=("--skip-playwright-install")
      [[ "$SETUP_SKIP_DOCTOR" == "true" ]] && args+=("--skip-doctor")
      echo "+ scripts/setup-all.sh ${args[*]}"
      "$SCRIPT_DIR/setup-all.sh" "${args[@]}"
      status=$?
      ;;
    update)
      local comps
      comps="$(join_components)"
      args=("--components" "$comps" "--mode" "$mode" "--client" "$client")
      [[ "$UPDATE_WITH_PLAYWRIGHT" == "true" ]] && args+=("--with-playwright-install")
      [[ "$UPDATE_SKIP_DOCTOR" == "true" ]] && args+=("--skip-doctor")
      echo "+ scripts/update-all.sh ${args[*]}"
      "$SCRIPT_DIR/update-all.sh" "${args[@]}"
      status=$?
      ;;
    uninstall)
      local parts=()
      [[ "$UNINSTALL_BROWSER" == "true" ]] && parts+=("browser")
      [[ "$UNINSTALL_SHELL" == "true" ]] && parts+=("shell")
      [[ "$UNINSTALL_SKILLS" == "true" ]] && parts+=("skills")
      [[ "$UNINSTALL_SUPERPOWERS" == "true" ]] && parts+=("superpowers")
      local comps=""
      local item=""
      for item in "${parts[@]}"; do
        if [[ -z "$comps" ]]; then
          comps="$item"
        else
          comps="$comps,$item"
        fi
      done
      args=("--components" "$comps" "--client" "$client")
      echo "+ scripts/uninstall-all.sh ${args[*]}"
      "$SCRIPT_DIR/uninstall-all.sh" "${args[@]}"
      status=$?
      ;;
    doctor)
      args=()
      [[ "$DOCTOR_STRICT" == "true" ]] && args+=("--strict")
      [[ "$DOCTOR_GLOBAL_SECURITY" == "true" ]] && args+=("--global-security")
      echo "+ scripts/verify-aios.sh ${args[*]}"
      "$SCRIPT_DIR/verify-aios.sh" "${args[@]}"
      status=$?
      ;;
  esac
  set -e

  echo ""
  if [[ $status -eq 0 ]]; then
    echo "[ok] exit code: 0"
  else
    echo "[fail] exit code: $status"
  fi
  echo ""
  read -r -p "Press Enter to return to menu..."

  enter_tui
}

enter_tui

while true; do
  tput clear 2>/dev/null || true
  draw_header

  case "$screen" in
    main)
      main_items=("Setup" "Update" "Uninstall" "Doctor" "Exit")
      idx=0
      for label in "${main_items[@]}"; do
        active="false"
        [[ $idx -eq $cursor ]] && active="true"
        render_item "$label" "$active"
        idx=$((idx + 1))
      done
      ;;
    setup)
      printf '%b\n' "${BOLD}Setup (wraps scripts/setup-all.sh)${NC}"
      printf '\n'
      render_checkbox "browser" "$COMP_BROWSER" "$([[ $cursor -eq 0 ]] && echo true || echo false)"
      render_checkbox "shell" "$COMP_SHELL" "$([[ $cursor -eq 1 ]] && echo true || echo false)"
      render_checkbox "skills" "$COMP_SKILLS" "$([[ $cursor -eq 2 ]] && echo true || echo false)"
      render_checkbox "superpowers" "$COMP_SUPERPOWERS" "$([[ $cursor -eq 3 ]] && echo true || echo false)"
      render_cycle "mode" "${MODE_OPTS[$MODE_IDX]}" "$([[ $cursor -eq 4 ]] && echo true || echo false)"
      render_cycle "client" "${CLIENT_OPTS[$CLIENT_IDX]}" "$([[ $cursor -eq 5 ]] && echo true || echo false)"
      render_checkbox "skip playwright install" "$SETUP_SKIP_PLAYWRIGHT" "$([[ $cursor -eq 6 ]] && echo true || echo false)"
      render_checkbox "skip doctor" "$SETUP_SKIP_DOCTOR" "$([[ $cursor -eq 7 ]] && echo true || echo false)"
      render_item "Continue" "$([[ $cursor -eq 8 ]] && echo true || echo false)"
      render_item "Back" "$([[ $cursor -eq 9 ]] && echo true || echo false)"
      ;;
    update)
      printf '%b\n' "${BOLD}Update (wraps scripts/update-all.sh)${NC}"
      printf '\n'
      render_checkbox "browser" "$COMP_BROWSER" "$([[ $cursor -eq 0 ]] && echo true || echo false)"
      render_checkbox "shell" "$COMP_SHELL" "$([[ $cursor -eq 1 ]] && echo true || echo false)"
      render_checkbox "skills" "$COMP_SKILLS" "$([[ $cursor -eq 2 ]] && echo true || echo false)"
      render_checkbox "superpowers" "$COMP_SUPERPOWERS" "$([[ $cursor -eq 3 ]] && echo true || echo false)"
      render_cycle "mode" "${MODE_OPTS[$MODE_IDX]}" "$([[ $cursor -eq 4 ]] && echo true || echo false)"
      render_cycle "client" "${CLIENT_OPTS[$CLIENT_IDX]}" "$([[ $cursor -eq 5 ]] && echo true || echo false)"
      render_checkbox "with playwright install" "$UPDATE_WITH_PLAYWRIGHT" "$([[ $cursor -eq 6 ]] && echo true || echo false)"
      render_checkbox "skip doctor" "$UPDATE_SKIP_DOCTOR" "$([[ $cursor -eq 7 ]] && echo true || echo false)"
      render_item "Continue" "$([[ $cursor -eq 8 ]] && echo true || echo false)"
      render_item "Back" "$([[ $cursor -eq 9 ]] && echo true || echo false)"
      ;;
    uninstall)
      printf '%b\n' "${BOLD}Uninstall (wraps scripts/uninstall-all.sh)${NC}"
      printf '%b\n' "${GRAY}Note: browser/superpowers have no destructive auto-uninstall by default.${NC}"
      printf '\n'
      render_checkbox "browser" "$UNINSTALL_BROWSER" "$([[ $cursor -eq 0 ]] && echo true || echo false)"
      render_checkbox "shell" "$UNINSTALL_SHELL" "$([[ $cursor -eq 1 ]] && echo true || echo false)"
      render_checkbox "skills" "$UNINSTALL_SKILLS" "$([[ $cursor -eq 2 ]] && echo true || echo false)"
      render_checkbox "superpowers" "$UNINSTALL_SUPERPOWERS" "$([[ $cursor -eq 3 ]] && echo true || echo false)"
      render_cycle "client" "${CLIENT_OPTS[$CLIENT_IDX]}" "$([[ $cursor -eq 4 ]] && echo true || echo false)"
      render_item "Continue" "$([[ $cursor -eq 5 ]] && echo true || echo false)"
      render_item "Back" "$([[ $cursor -eq 6 ]] && echo true || echo false)"
      ;;
    doctor)
      printf '%b\n' "${BOLD}Doctor (wraps scripts/verify-aios.sh)${NC}"
      printf '\n'
      render_checkbox "strict" "$DOCTOR_STRICT" "$([[ $cursor -eq 0 ]] && echo true || echo false)"
      render_checkbox "global security scan" "$DOCTOR_GLOBAL_SECURITY" "$([[ $cursor -eq 1 ]] && echo true || echo false)"
      render_item "Continue" "$([[ $cursor -eq 2 ]] && echo true || echo false)"
      render_item "Back" "$([[ $cursor -eq 3 ]] && echo true || echo false)"
      ;;
    confirm)
      printf '%b\n' "${BOLD}Confirm${NC}"
      printf '\n'
      printf '%b\n' "${GRAY}Command:${NC}"
      printf '%b\n' "${WHITE}$(build_command_display "$confirm_action")${NC}"
      printf '\n'
      render_item "Run" "$([[ $cursor -eq 0 ]] && echo true || echo false)"
      render_item "Back" "$([[ $cursor -eq 1 ]] && echo true || echo false)"
      ;;
  esac

  key="$(read_key)"

  if [[ "$key" == "q" || "$key" == "Q" ]]; then
    leave_tui
    exit 0
  fi

  if [[ "$key" == "b" || "$key" == "B" ]]; then
    case "$screen" in
      main) ;;
      setup|update|uninstall|doctor)
        screen="main"
        cursor=0
        ;;
      confirm)
        screen="$confirm_action"
        cursor=0
        ;;
    esac
    continue
  fi

  case "$key" in
    "[A") # up
      cursor=$((cursor - 1))
      ;;
    "[B") # down
      cursor=$((cursor + 1))
      ;;
  esac

  case "$screen" in
    main)
      if [[ $cursor -lt 0 ]]; then cursor=4; fi
      if [[ $cursor -gt 4 ]]; then cursor=0; fi
      if [[ "$key" == $'\n' || "$key" == $'\r' ]]; then
        case "$cursor" in
          0) screen="setup"; cursor=0 ;;
          1) screen="update"; cursor=0 ;;
          2) screen="uninstall"; cursor=0 ;;
          3) screen="doctor"; cursor=0 ;;
          4) leave_tui; exit 0 ;;
        esac
      fi
      ;;
    setup)
      if [[ $cursor -lt 0 ]]; then cursor=9; fi
      if [[ $cursor -gt 9 ]]; then cursor=0; fi
      if [[ "$key" == " " ]]; then
        case "$cursor" in
          0) COMP_BROWSER=$([[ "$COMP_BROWSER" == "true" ]] && echo false || echo true) ;;
          1) COMP_SHELL=$([[ "$COMP_SHELL" == "true" ]] && echo false || echo true) ;;
          2) COMP_SKILLS=$([[ "$COMP_SKILLS" == "true" ]] && echo false || echo true) ;;
          3) COMP_SUPERPOWERS=$([[ "$COMP_SUPERPOWERS" == "true" ]] && echo false || echo true) ;;
          4) MODE_IDX=$(((MODE_IDX + 1) % ${#MODE_OPTS[@]})) ;;
          5) CLIENT_IDX=$(((CLIENT_IDX + 1) % ${#CLIENT_OPTS[@]})) ;;
          6) SETUP_SKIP_PLAYWRIGHT=$([[ "$SETUP_SKIP_PLAYWRIGHT" == "true" ]] && echo false || echo true) ;;
          7) SETUP_SKIP_DOCTOR=$([[ "$SETUP_SKIP_DOCTOR" == "true" ]] && echo false || echo true) ;;
        esac
        ensure_any_setup_component
      fi
      if [[ "$key" == $'\n' || "$key" == $'\r' ]]; then
        case "$cursor" in
          8)
            confirm_action="setup"
            screen="confirm"
            cursor=0
            ;;
          9)
            screen="main"
            cursor=0
            ;;
        esac
      fi
      ;;
    update)
      if [[ $cursor -lt 0 ]]; then cursor=9; fi
      if [[ $cursor -gt 9 ]]; then cursor=0; fi
      if [[ "$key" == " " ]]; then
        case "$cursor" in
          0) COMP_BROWSER=$([[ "$COMP_BROWSER" == "true" ]] && echo false || echo true) ;;
          1) COMP_SHELL=$([[ "$COMP_SHELL" == "true" ]] && echo false || echo true) ;;
          2) COMP_SKILLS=$([[ "$COMP_SKILLS" == "true" ]] && echo false || echo true) ;;
          3) COMP_SUPERPOWERS=$([[ "$COMP_SUPERPOWERS" == "true" ]] && echo false || echo true) ;;
          4) MODE_IDX=$(((MODE_IDX + 1) % ${#MODE_OPTS[@]})) ;;
          5) CLIENT_IDX=$(((CLIENT_IDX + 1) % ${#CLIENT_OPTS[@]})) ;;
          6) UPDATE_WITH_PLAYWRIGHT=$([[ "$UPDATE_WITH_PLAYWRIGHT" == "true" ]] && echo false || echo true) ;;
          7) UPDATE_SKIP_DOCTOR=$([[ "$UPDATE_SKIP_DOCTOR" == "true" ]] && echo false || echo true) ;;
        esac
        ensure_any_setup_component
      fi
      if [[ "$key" == $'\n' || "$key" == $'\r' ]]; then
        case "$cursor" in
          8)
            confirm_action="update"
            screen="confirm"
            cursor=0
            ;;
          9)
            screen="main"
            cursor=0
            ;;
        esac
      fi
      ;;
    uninstall)
      if [[ $cursor -lt 0 ]]; then cursor=6; fi
      if [[ $cursor -gt 6 ]]; then cursor=0; fi
      if [[ "$key" == " " ]]; then
        case "$cursor" in
          0) UNINSTALL_BROWSER=$([[ "$UNINSTALL_BROWSER" == "true" ]] && echo false || echo true) ;;
          1) UNINSTALL_SHELL=$([[ "$UNINSTALL_SHELL" == "true" ]] && echo false || echo true) ;;
          2) UNINSTALL_SKILLS=$([[ "$UNINSTALL_SKILLS" == "true" ]] && echo false || echo true) ;;
          3) UNINSTALL_SUPERPOWERS=$([[ "$UNINSTALL_SUPERPOWERS" == "true" ]] && echo false || echo true) ;;
          4) CLIENT_IDX=$(((CLIENT_IDX + 1) % ${#CLIENT_OPTS[@]})) ;;
        esac
        ensure_any_uninstall_component
      fi
      if [[ "$key" == $'\n' || "$key" == $'\r' ]]; then
        case "$cursor" in
          5)
            confirm_action="uninstall"
            screen="confirm"
            cursor=0
            ;;
          6)
            screen="main"
            cursor=0
            ;;
        esac
      fi
      ;;
    doctor)
      if [[ $cursor -lt 0 ]]; then cursor=3; fi
      if [[ $cursor -gt 3 ]]; then cursor=0; fi
      if [[ "$key" == " " ]]; then
        case "$cursor" in
          0) DOCTOR_STRICT=$([[ "$DOCTOR_STRICT" == "true" ]] && echo false || echo true) ;;
          1) DOCTOR_GLOBAL_SECURITY=$([[ "$DOCTOR_GLOBAL_SECURITY" == "true" ]] && echo false || echo true) ;;
        esac
      fi
      if [[ "$key" == $'\n' || "$key" == $'\r' ]]; then
        case "$cursor" in
          2)
            confirm_action="doctor"
            screen="confirm"
            cursor=0
            ;;
          3)
            screen="main"
            cursor=0
            ;;
        esac
      fi
      ;;
    confirm)
      if [[ $cursor -lt 0 ]]; then cursor=1; fi
      if [[ $cursor -gt 1 ]]; then cursor=0; fi
      if [[ "$key" == $'\n' || "$key" == $'\r' ]]; then
        case "$cursor" in
          0)
            run_command "$confirm_action"
            screen="main"
            cursor=0
            ;;
          1)
            screen="$confirm_action"
            cursor=0
            ;;
        esac
      fi
      ;;
  esac
done
