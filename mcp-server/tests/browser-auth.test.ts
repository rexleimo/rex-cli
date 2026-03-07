import test from 'node:test';
import assert from 'node:assert/strict';
import type { Page } from 'playwright';

import { detectAuthRequired, detectChallengeRequired } from '../src/browser/auth.js';

interface MockPageOptions {
  url: string;
  title?: string;
  bodyText?: string;
  selectorCounts?: Record<string, number>;
}

function makePage(options: MockPageOptions): Page {
  const selectorCounts = options.selectorCounts ?? {};

  const page = {
    url: () => options.url,
    title: async () => options.title ?? '',
    evaluate: async () => options.bodyText ?? '',
    locator: (selector: string) => ({
      count: async () => selectorCounts[selector] ?? 0,
    }),
  };

  return page as unknown as Page;
}

test('detectChallengeRequired flags Cloudflare challenge pages', async () => {
  const page = makePage({
    url: 'https://example.com/cdn-cgi/challenge-platform/h/b/orchestrate/jsch/v1',
    title: 'Just a moment...',
    bodyText: 'Checking your browser before accessing example.com',
  });

  const result = await detectChallengeRequired(page);

  assert.equal(result.challengeDetected, true);
  assert.equal(result.challengeType, 'cloudflare');
  assert.equal(result.requiresHumanVerification, true);
  assert.match(result.reason, /challenge/i);
});

test('detectChallengeRequired flags Google unusual traffic gates', async () => {
  const page = makePage({
    url: 'https://www.google.com/sorry/index?continue=https://www.google.com/',
    title: 'About this page',
    bodyText: 'Our systems have detected unusual traffic from your computer network.',
  });

  const result = await detectChallengeRequired(page);

  assert.equal(result.challengeDetected, true);
  assert.equal(result.challengeType, 'google-risk');
  assert.equal(result.requiresHumanVerification, true);
  assert.equal(result.signals.length > 0, true);
});

test('detectChallengeRequired flags captcha widgets', async () => {
  const page = makePage({
    url: 'https://target.example/form',
    title: 'Submit form',
    selectorCounts: {
      'iframe[src*="recaptcha" i]': 1,
    },
  });

  const result = await detectChallengeRequired(page);

  assert.equal(result.challengeDetected, true);
  assert.equal(result.challengeType, 'captcha');
});

test('detectChallengeRequired returns no challenge on normal pages', async () => {
  const page = makePage({
    url: 'https://docs.example.com/home',
    title: 'Home',
    bodyText: 'Welcome to docs.',
  });

  const result = await detectChallengeRequired(page);

  assert.equal(result.challengeDetected, false);
  assert.equal(result.challengeType, 'none');
  assert.equal(result.requiresHumanVerification, false);
});

test('detectAuthRequired ignores generic login CTA text without hard signals', async () => {
  const page = makePage({
    url: 'https://www.bilibili.com/',
    title: '哔哩哔哩 (゜-゜)つロ 干杯~-bilibili',
    bodyText: '首页 番剧 直播 游戏中心 登录 登录后你可以：免费看高清视频 立即登录 点我注册',
  });

  const result = await detectAuthRequired(page);

  assert.equal(result.requiresHumanLogin, false);
  assert.equal(result.signals.includes('auth-text-low-pattern'), true);
  assert.match(result.reason, /no hard auth gate/i);
});

test('detectAuthRequired flags high-confidence auth text gates', async () => {
  const page = makePage({
    url: 'https://example.com/home',
    title: 'Welcome',
    bodyText: '请先登录后继续操作，输入验证码完成验证。',
  });

  const result = await detectAuthRequired(page);

  assert.equal(result.requiresHumanLogin, true);
  assert.equal(result.signals.includes('auth-text-high-pattern'), true);
});

test('detectAuthRequired flags auth form selectors even with neutral copy', async () => {
  const page = makePage({
    url: 'https://portal.example.com/welcome',
    title: 'Portal',
    bodyText: 'Welcome to the portal.',
    selectorCounts: {
      'input[type="password"]': 1,
    },
  });

  const result = await detectAuthRequired(page);

  assert.equal(result.requiresHumanLogin, true);
  assert.equal(result.signals.some((signal) => signal.startsWith('selector:')), true);
});
