// mcp-server/src/browser/profiles.ts
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { BrowserProfile } from './types.js';

function resolveWorkspaceRoot(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(moduleDir, '..', '..'), // mcp-server/
    path.resolve(moduleDir, '..', '..', '..'), // aios/
  ];

  for (const root of candidates) {
    if (existsSync(path.join(root, 'config', 'browser-profiles.json'))) {
      return root;
    }
  }

  return process.cwd();
}

const WORKSPACE_ROOT = resolveWorkspaceRoot();
const PROFILES_DIR = path.join(WORKSPACE_ROOT, '.browser-profiles');
const CONFIG_PATH = path.join(WORKSPACE_ROOT, 'config', 'browser-profiles.json');

export class ProfileManager {
  private profiles: Map<string, BrowserProfile> = new Map();

  async init(): Promise<void> {
    try {
      await fs.mkdir(PROFILES_DIR, { recursive: true });
    } catch {
      // 目录已存在
    }
    await this.loadProfiles();
  }

  private async loadProfiles(): Promise<void> {
    try {
      const data = await fs.readFile(CONFIG_PATH, 'utf-8');
      const config = JSON.parse(data);
      if (config.profiles) {
        for (const [name, profile] of Object.entries(config.profiles)) {
          this.profiles.set(name, profile as BrowserProfile);
        }
      }
    } catch {
      // 配置文件不存在，使用默认
    }
  }

  getProfile(name: string): BrowserProfile | undefined {
    return this.profiles.get(name);
  }

  getAllProfiles(): Map<string, BrowserProfile> {
    return this.profiles;
  }

  setProfile(name: string, profile: BrowserProfile): void {
    this.profiles.set(name, profile);
  }

  getProfileDir(name: string): string {
    return path.join(PROFILES_DIR, name);
  }

  getWorkspaceRoot(): string {
    return WORKSPACE_ROOT;
  }

  resolveWorkspacePath(targetPath: string): string {
    if (path.isAbsolute(targetPath)) return targetPath;
    return path.resolve(WORKSPACE_ROOT, targetPath);
  }
}

export const profileManager = new ProfileManager();
