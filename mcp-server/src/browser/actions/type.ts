// mcp-server/src/browser/actions/type.ts
import { browserLauncher } from '../launcher.js';
import { applyActionPacing } from '../pacing.js';

export async function type(selector: string, text: string, profile: string = 'default') {
  const state = browserLauncher.getState(profile);
  if (!state || state.activePageId === null) {
    throw new Error('No active page');
  }

  const page = state.pages.get(state.activePageId);
  if (!page) {
    throw new Error('Page not found');
  }

  const pacingDelayMs = await applyActionPacing();
  await page.fill(selector, text);

  return {
    success: true,
    selector,
    textLength: text.length,
    profile,
    pacingDelayMs,
  };
}
