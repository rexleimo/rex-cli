import { browserLauncher } from '../launcher.js';
import { detectAuthRequired } from '../auth.js';

export async function authCheck(profile: string = 'default') {
  const state = browserLauncher.getState(profile);
  if (!state || state.activePageId === null) {
    throw new Error('No active page');
  }

  const page = state.pages.get(state.activePageId);
  if (!page) {
    throw new Error('Page not found');
  }

  const auth = await detectAuthRequired(page);
  return {
    success: true,
    profile,
    auth,
    requiresHumanAction: auth.requiresHumanLogin,
  };
}
