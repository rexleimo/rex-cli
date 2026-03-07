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

export type ChallengeType = 'none' | 'cloudflare' | 'google-risk' | 'captcha' | 'unknown';

export interface ChallengeCheckResult {
  challengeDetected: boolean;
  challengeType: ChallengeType;
  reason: string;
  signals: string[];
  host: string;
  url: string;
  title: string;
  requiresHumanVerification: boolean;
  humanActionHint?: string;
  recommendedPath: 'continue' | 'manual-handoff' | 'api-preferred';
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

const AUTH_TEXT_PATTERNS_HIGH_CONFIDENCE: RegExp[] = [
  /continue with google/i,
  /login to/i,
  /two-factor|2fa/i,
  /验证码/,
  /请先登录/,
  /扫码登录/,
  /\bpassword\b/i,
  /密码/,
];

const AUTH_TEXT_PATTERNS_LOW_CONFIDENCE: RegExp[] = [
  /sign in/i,
  /log in/i,
  /登录/,
  /账号/,
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

const CHALLENGE_URL_PATTERNS = {
  cloudflare: [
    /\/cdn-cgi\/challenge-platform/i,
    /\/cdn-cgi\/l\/chk_jschl/i,
  ],
  googleRisk: [
    /google\.[^/]+\/sorry\//i,
    /google\.[^/]+\/sorry\/index/i,
  ],
} as const;

const CHALLENGE_TEXT_PATTERNS = {
  cloudflare: [
    /just a moment/i,
    /checking your browser before accessing/i,
    /ddos protection by cloudflare/i,
    /please stand by, while we are checking your browser/i,
    /attention required/i,
    /please unblock challenges\.cloudflare\.com/i,
  ],
  googleRisk: [
    /our systems have detected unusual traffic/i,
    /this browser or app may not be secure/i,
    /couldn['’]t sign you in/i,
    /verify it['’]s you/i,
  ],
  captcha: [
    /i['’]?m not a robot/i,
    /\bcaptcha\b/i,
    /\brecaptcha\b/i,
    /\bhcaptcha\b/i,
    /\bturnstile\b/i,
  ],
} as const;

const CHALLENGE_SELECTORS: string[] = [
  'iframe[src*="challenges.cloudflare.com" i]',
  'iframe[src*="recaptcha" i]',
  'iframe[src*="hcaptcha" i]',
  '.cf-turnstile',
  '[class*="cf-turnstile" i]',
  '[id*="cf-chl" i]',
  '[data-sitekey][data-callback]',
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

function hasAnyPattern(input: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(input));
}

function buildChallengeHint(host: string, challengeType: ChallengeType): string {
  if (challengeType === 'cloudflare') {
    return '检测到 Cloudflare 挑战页。请先人工完成挑战；若是自有站点，建议改用 Cloudflare Access Service Token 或白名单策略。';
  }
  if (challengeType === 'google-risk') {
    return '检测到 Google/YouTube 风控挑战。建议优先使用官方 API（OAuth）并将登录/验证步骤保留为人工接管。';
  }
  if (challengeType === 'captcha') {
    return '检测到 CAPTCHA 挑战。该步骤建议人工完成，自动化流程应在挑战通过后继续。';
  }
  if (/youtube|google/i.test(host)) {
    return '检测到平台风控信号。建议使用官方 API 路径并保留人工验证环节。';
  }
  return '检测到可能的反自动化挑战。请人工确认页面状态后再继续自动化步骤。';
}

function classifyChallenge(signals: string[]): ChallengeType {
  if (signals.some((signal) => signal.startsWith('cloudflare:'))) return 'cloudflare';
  if (signals.some((signal) => signal.startsWith('google-risk:'))) return 'google-risk';
  if (signals.some((signal) => signal.startsWith('captcha:'))) return 'captcha';
  if (signals.length > 0) return 'unknown';
  return 'none';
}

export async function detectChallengeRequired(page: Page): Promise<ChallengeCheckResult> {
  const url = page.url();
  const host = parseHost(url);
  const title = await page.title().catch(() => '');
  const signals: string[] = [];

  if (hasAnyPattern(url, CHALLENGE_URL_PATTERNS.cloudflare)) {
    signals.push('cloudflare:url-pattern');
  }
  if (hasAnyPattern(url, CHALLENGE_URL_PATTERNS.googleRisk)) {
    signals.push('google-risk:url-pattern');
  }

  let textSample = '';
  try {
    textSample = await page.evaluate(() => (document.body?.innerText || '').slice(0, 8000));
  } catch {
    // ignore
  }

  const combined = `${title}\n${textSample}`;
  if (hasAnyPattern(combined, CHALLENGE_TEXT_PATTERNS.cloudflare)) {
    signals.push('cloudflare:text-pattern');
  }
  if (hasAnyPattern(combined, CHALLENGE_TEXT_PATTERNS.googleRisk)) {
    signals.push('google-risk:text-pattern');
  }
  if (hasAnyPattern(combined, CHALLENGE_TEXT_PATTERNS.captcha)) {
    signals.push('captcha:text-pattern');
  }

  for (const selector of CHALLENGE_SELECTORS) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        if (selector.includes('cloudflare') || selector.includes('cf-')) {
          signals.push(`cloudflare:selector:${selector}`);
        } else {
          signals.push(`captcha:selector:${selector}`);
        }
      }
    } catch {
      // ignore selector lookup errors
    }
  }

  const challengeType = classifyChallenge(signals);
  const challengeDetected = challengeType !== 'none';
  const requiresHumanVerification = challengeDetected;
  const recommendedPath =
    challengeType === 'google-risk'
      ? 'api-preferred'
      : challengeDetected
        ? 'manual-handoff'
        : 'continue';

  return {
    challengeDetected,
    challengeType,
    reason: challengeDetected ? 'Potential anti-bot challenge detected' : 'No anti-bot challenge detected',
    signals,
    host,
    url,
    title,
    requiresHumanVerification,
    humanActionHint: challengeDetected ? buildChallengeHint(host, challengeType) : undefined,
    recommendedPath,
  };
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
  const hasHighConfidenceTextSignal = AUTH_TEXT_PATTERNS_HIGH_CONFIDENCE.some((p) => p.test(combined));
  const hasLowConfidenceTextSignal = AUTH_TEXT_PATTERNS_LOW_CONFIDENCE.some((p) => p.test(combined));
  if (hasHighConfidenceTextSignal) {
    signals.push('auth-text-high-pattern');
  } else if (hasLowConfidenceTextSignal) {
    signals.push('auth-text-low-pattern');
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

  const hasUrlSignal = signals.includes('auth-url-pattern');
  const hasSelectorSignal = signals.some((signal) => signal.startsWith('selector:'));
  const requiresHumanLogin = hasUrlSignal || hasSelectorSignal || hasHighConfidenceTextSignal;
  const reason = requiresHumanLogin
    ? 'Potential authentication or session gate detected'
    : hasLowConfidenceTextSignal
      ? 'Login CTA text detected but no hard auth gate signal'
      : 'No auth gate detected';

  return {
    requiresHumanLogin,
    reason,
    signals,
    host,
    url,
    title,
    humanActionHint: requiresHumanLogin ? buildHumanActionHint(host) : undefined,
  };
}
