import type { Page } from 'playwright';

export interface AuthCheckResult {
  requiresHumanLogin: boolean;
  reason: string;
  signals: string[];
  host: string;
  url: string;
  title: string;
  humanActionHint?: string;
}

const AUTH_URL_PATTERNS: RegExp[] = [
  /accounts\.google\.com/i,
  /\/signin/i,
  /\/login/i,
  /\/checkpoint/i,
  /\/challenge/i,
  /\/oauth/i,
  /\/auth/i,
  /passport/i,
];

const AUTH_TEXT_PATTERNS: RegExp[] = [
  /sign in/i,
  /log in/i,
  /continue with google/i,
  /login to/i,
  /verify/i,
  /two-factor/i,
  /验证码/,
  /登录/,
  /请先登录/,
  /扫码登录/,
  /账号/,
  /密码/,
];

const AUTH_SELECTORS: string[] = [
  'input[type="password"]',
  'input[type="email"]',
  'input[name*="password" i]',
  'input[name*="email" i]',
  'input[autocomplete="current-password"]',
  'form[action*="login" i]',
  'form[action*="signin" i]',
];

function parseHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function buildHumanActionHint(host: string): string {
  if (/google/i.test(host)) {
    return 'Google 登录需人工完成（含 2FA）。完成后请回复“已登录”，再继续自动化步骤。';
  }
  if (/meta|facebook|instagram/i.test(host)) {
    return 'Meta/Facebook/Instagram 登录需人工完成。完成后请回复“已登录”，再继续自动化步骤。';
  }
  if (/jimeng\.jianying\.com/i.test(host)) {
    return '即梦会话失效，请人工完成登录。完成后请回复“已登录”，再继续生成流程。';
  }
  return '检测到可能登录态缺失，请人工确认并完成登录后再继续。';
}

export async function detectAuthRequired(page: Page): Promise<AuthCheckResult> {
  const url = page.url();
  const host = parseHost(url);
  const title = await page.title().catch(() => '');
  const signals: string[] = [];

  if (AUTH_URL_PATTERNS.some((p) => p.test(url))) {
    signals.push('auth-url-pattern');
  }

  let textSample = '';
  try {
    textSample = await page.evaluate(() => (document.body?.innerText || '').slice(0, 5000));
  } catch {
    // ignore
  }

  const combined = `${title}\n${textSample}`;
  if (AUTH_TEXT_PATTERNS.some((p) => p.test(combined))) {
    signals.push('auth-text-pattern');
  }

  for (const selector of AUTH_SELECTORS) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        signals.push(`selector:${selector}`);
        break;
      }
    } catch {
      // ignore invalid selector in current document context
    }
  }

  const requiresHumanLogin = signals.length > 0;
  return {
    requiresHumanLogin,
    reason: requiresHumanLogin ? 'Potential authentication or session gate detected' : 'No auth gate detected',
    signals,
    host,
    url,
    title,
    humanActionHint: requiresHumanLogin ? buildHumanActionHint(host) : undefined,
  };
}
