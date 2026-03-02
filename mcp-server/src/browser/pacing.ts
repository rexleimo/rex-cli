function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function parseBoolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return fallback;
}

export function getActionPacingConfig() {
  const enabled = parseBoolEnv('BROWSER_ACTION_PACING', true);
  const minMs = parseIntEnv('BROWSER_ACTION_MIN_MS', 400);
  const maxMs = parseIntEnv('BROWSER_ACTION_MAX_MS', 1200);
  const normalizedMin = Math.min(minMs, maxMs);
  const normalizedMax = Math.max(minMs, maxMs);
  return { enabled, minMs: normalizedMin, maxMs: normalizedMax };
}

export async function applyActionPacing(): Promise<number> {
  const { enabled, minMs, maxMs } = getActionPacingConfig();
  if (!enabled) return 0;
  const span = maxMs - minMs;
  const waitMs = minMs + Math.floor(Math.random() * (span + 1));
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  return waitMs;
}
