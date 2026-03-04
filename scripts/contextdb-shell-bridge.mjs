#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, realpathSync } from 'node:fs';
import path from 'node:path';

const BLOCKED_SUBCOMMANDS = {
  codex: new Set([
    'exec', 'review', 'login', 'logout', 'mcp', 'mcp-server', 'app-server', 'app',
    'completion', 'sandbox', 'debug', 'apply', 'resume', 'fork', 'cloud', 'features',
    'help', '-h', '--help', '-V', '--version',
  ]),
  claude: new Set([
    'agents', 'auth', 'doctor', 'install', 'mcp', 'plugin', 'setup-token', 'update',
    'upgrade', '-h', '--help', '-v', '--version',
  ]),
  gemini: new Set([
    'mcp', 'extensions', 'skills', 'hooks', '-h', '--help', '-v', '--version',
  ]),
};

function usage() {
  console.log(`Usage:
  node scripts/contextdb-shell-bridge.mjs --agent <codex-cli|claude-code|gemini-cli> --command <codex|claude|gemini> [--cwd <path>] [-- <args...>]

Environment:
  ROOTPATH               Repo root containing scripts/ctx-agent.mjs
  CTXDB_RUNNER           Explicit runner path (overrides ROOTPATH discovery)
  CTXDB_REPO_NAME        Optional project name override
  CTXDB_WRAP_MODE        all|repo-only|opt-in|off (default: repo-only)
  CTXDB_MARKER_FILE      Marker filename for opt-in mode (default: .contextdb-enable)
  CTXDB_DEBUG            1/true/yes/on to print bridge decisions`);
}

function parseArgs(argv) {
  const opts = {
    agent: '',
    command: '',
    cwd: process.cwd(),
    passthroughArgs: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--agent':
        opts.agent = argv[++i] || '';
        break;
      case '--command':
        opts.command = argv[++i] || '';
        break;
      case '--cwd':
        opts.cwd = argv[++i] || process.cwd();
        break;
      case '-h':
      case '--help':
        usage();
        process.exit(0);
        break;
      case '--':
        opts.passthroughArgs = argv.slice(i + 1);
        i = argv.length;
        break;
      default:
        opts.passthroughArgs.push(arg);
        break;
    }
  }

  return opts;
}

function normalizeCodeHome(env, cwd) {
  const codexHome = env.CODEX_HOME;
  if (!codexHome) return;

  let normalized = codexHome;
  if (!path.isAbsolute(codexHome)) {
    const home = env.HOME || env.USERPROFILE || cwd;
    normalized = path.join(home, '.codex');
    env.CODEX_HOME = normalized;
  }

  if (!existsSync(normalized)) {
    try {
      mkdirSync(normalized, { recursive: true });
    } catch {
      // non-fatal: fallback to runtime behavior
    }
  }
}

function runGit(cwd, args) {
  return spawnSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function detectWorkspaceRoot(cwd) {
  const result = runGit(cwd, ['rev-parse', '--show-toplevel']);
  if (result.status !== 0) return '';
  return (result.stdout || '').trim();
}

function normalizeForCompare(inputPath) {
  let output = path.resolve(inputPath);
  try {
    output = realpathSync(output);
  } catch {
    // ignore realpath failures and keep resolved absolute path
  }

  if (process.platform === 'win32') {
    return output.toLowerCase();
  }

  return output;
}

function shouldWrapWorkspace(workspace, env) {
  const mode = (env.CTXDB_WRAP_MODE || 'repo-only').trim().toLowerCase();

  switch (mode) {
    case 'all':
      return true;
    case 'repo-only': {
      const rootpath = env.ROOTPATH;
      if (!rootpath) return false;
      return normalizeForCompare(rootpath) === normalizeForCompare(workspace);
    }
    case 'opt-in': {
      const marker = env.CTXDB_MARKER_FILE || '.contextdb-enable';
      return existsSync(path.join(workspace, marker));
    }
    case 'off':
    case 'disabled':
    case 'none':
      return false;
    default:
      // preserve historical behavior for unknown modes
      return true;
  }
}

function isBlockedSubcommand(command, firstArg) {
  if (!firstArg) return false;
  const blocked = BLOCKED_SUBCOMMANDS[command];
  if (!blocked) return false;
  return blocked.has(firstArg);
}

function detectRunner(env) {
  if (env.CTXDB_RUNNER && existsSync(env.CTXDB_RUNNER)) {
    return { command: env.CTXDB_RUNNER, args: [] };
  }

  if (env.ROOTPATH) {
    const candidate = path.join(env.ROOTPATH, 'scripts', 'ctx-agent.mjs');
    if (existsSync(candidate)) {
      return { command: 'node', args: [candidate] };
    }
  }

  return null;
}

function shouldDebug(env) {
  const value = (env.CTXDB_DEBUG || '').trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function spawnInherited(command, args, cwd, env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    const reason = result.error.message || String(result.error);
    console.error(`[contextdb-shell-bridge] failed to run ${command}: ${reason}`);
    return 1;
  }

  return result.status ?? 1;
}

function validateOptions(opts) {
  const validAgents = new Set(['codex-cli', 'claude-code', 'gemini-cli']);
  const validCommands = new Set(['codex', 'claude', 'gemini']);

  if (!validAgents.has(opts.agent)) {
    throw new Error('--agent must be one of: codex-cli, claude-code, gemini-cli');
  }

  if (!validCommands.has(opts.command)) {
    throw new Error('--command must be one of: codex, claude, gemini');
  }
}

function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  try {
    validateOptions(opts);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[contextdb-shell-bridge] ${message}`);
    usage();
    process.exit(2);
  }

  const env = { ...process.env };
  if (opts.command === 'codex') {
    normalizeCodeHome(env, opts.cwd);
  }

  const firstArg = opts.passthroughArgs[0] || '';
  const blockedSubcommand = isBlockedSubcommand(opts.command, firstArg);
  const runner = blockedSubcommand ? null : detectRunner(env);
  const workspace = blockedSubcommand ? '' : detectWorkspaceRoot(opts.cwd);
  const allowedByMode = workspace ? shouldWrapWorkspace(workspace, env) : false;
  const shouldWrap = Boolean(!blockedSubcommand && runner && workspace && allowedByMode);

  if (shouldDebug(env)) {
    const reason = shouldWrap
      ? 'wrap'
      : blockedSubcommand
        ? 'blocked-subcommand'
        : !runner
          ? 'runner-missing'
          : !workspace
            ? 'workspace-missing'
            : 'mode-blocked';
    console.error(
      `[contextdb-shell-bridge] command=${opts.command} agent=${opts.agent} decision=${reason} workspace=${workspace || '-'}`
    );
  }

  if (!shouldWrap) {
    const code = spawnInherited(opts.command, opts.passthroughArgs, opts.cwd, env);
    process.exit(code);
  }

  const project = env.CTXDB_REPO_NAME || path.basename(workspace);
  const args = [
    ...runner.args,
    '--workspace', workspace,
    '--agent', opts.agent,
    '--project', project,
    '--',
    ...opts.passthroughArgs,
  ];

  const code = spawnInherited(runner.command, args, opts.cwd, env);
  process.exit(code);
}

main();
