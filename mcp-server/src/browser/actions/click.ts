// mcp-server/src/browser/actions/click.ts
import { browserLauncher } from '../launcher.js';
import { applyActionPacing } from '../pacing.js';

export async function click(selector: string, profile: string = 'default', double: boolean = false) {
  const state = browserLauncher.getState(profile);
  if (!state || state.activePageId === null) {
    throw new Error('No active page');
  }

  const page = state.pages.get(state.activePageId);
  if (!page) {
    throw new Error('Page not found');
  }

  const pacingDelayMs = await applyActionPacing();
  await page.click(selector, { clickCount: double ? 2 : 1 });

  return {
    success: true,
    selector,
    action: double ? 'double-click' : 'click',
    profile,
    pacingDelayMs,
  };
}
