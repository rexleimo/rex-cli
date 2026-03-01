// mcp-server/src/browser.ts
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createCursor, GhostCursor } from 'ghost-cursor';
import type { Browser, Page } from 'puppeteer';

// 启用反检测插件
puppeteer.use(StealthPlugin());

export interface BrowserState {
  browser: Browser | null;
  pages: Map<number, Page>;
  cursors: Map<number, GhostCursor>;
  activePageId: number | null;
}

const state: BrowserState = {
  browser: null,
  pages: new Map(),
  cursors: new Map(),
  activePageId: null,
};

let pageIdCounter = 0;

export async function launchBrowser(): Promise<Browser> {
  if (state.browser) {
    return state.browser;
  }

  try {
    state.browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      defaultViewport: { width: 1280, height: 800 },
    });
    return state.browser;
  } catch (error) {
    state.browser = null;
    throw new Error(`Failed to launch browser: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function createNewPage(url?: string): Promise<{ pageId: number; page: Page }> {
  const browser = await launchBrowser();

  let page: Page;
  try {
    page = await browser.newPage();
  } catch (error) {
    throw new Error(`Failed to create new page: ${error instanceof Error ? error.message : String(error)}`);
  }

  const pageId = ++pageIdCounter;
  state.pages.set(pageId, page);

  // 为页面创建 cursor
  let cursor: GhostCursor | undefined;
  try {
    cursor = await createCursor(page);
    state.cursors.set(pageId, cursor);
  } catch (error) {
    // cursor 创建失败不影响页面使用
    console.error('Failed to create cursor:', error);
  }

  // 监听页面关闭事件
  page.on('close', () => {
    state.pages.delete(pageId);
    state.cursors.delete(pageId);
    if (state.activePageId === pageId) {
      const remainingIds = Array.from(state.pages.keys());
      state.activePageId = remainingIds.length > 0 ? remainingIds[remainingIds.length - 1] : null;
    }
  });

  // 监听页面错误事件
  page.on('error', (error) => {
    console.error('Page error:', error);
    state.pages.delete(pageId);
    state.cursors.delete(pageId);
  });

  state.activePageId = pageId;

  if (url) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
    } catch (error) {
      console.error('Failed to navigate to URL:', error);
    }
  }

  return { pageId, page };
}

export function getActivePage(): Page | null {
  if (state.activePageId === null) return null;
  return state.pages.get(state.activePageId) || null;
}

export function getPage(pageId: number): Page | null {
  return state.pages.get(pageId) || null;
}

export function getCursor(pageId: number): GhostCursor | null {
  return state.cursors.get(pageId) || null;
}

export function setActivePage(pageId: number): boolean {
  if (!state.pages.has(pageId)) return false;
  state.activePageId = pageId;
  return true;
}

export async function closePage(pageId: number): Promise<boolean> {
  const page = state.pages.get(pageId);
  if (!page) return false;

  await page.close();
  state.pages.delete(pageId);
  state.cursors.delete(pageId);

  if (state.activePageId === pageId) {
    const remainingIds = Array.from(state.pages.keys());
    state.activePageId = remainingIds.length > 0 ? remainingIds[remainingIds.length - 1] : null;
  }

  return true;
}

export async function closeBrowser(): Promise<void> {
  if (state.browser) {
    await state.browser.close();
    state.browser = null;
    state.pages.clear();
    state.cursors.clear();
    state.activePageId = null;
  }
}

export async function getPageList(): Promise<Array<{ id: number; url: string; title: string }>> {
  const list: Array<{ id: number; url: string; title: string }> = [];
  for (const [id, page] of state.pages) {
    try {
      list.push({
        id,
        url: await page.url(),
        title: await page.title(),
      });
    } catch {
      // 页面可能已关闭
    }
  }
  return list;
}
