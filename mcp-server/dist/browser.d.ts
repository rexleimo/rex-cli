import { GhostCursor } from 'ghost-cursor';
import type { Browser, Page } from 'puppeteer';
export interface BrowserState {
    browser: Browser | null;
    pages: Map<number, Page>;
    cursors: Map<number, GhostCursor>;
    activePageId: number | null;
}
export declare function launchBrowser(): Promise<Browser>;
export declare function createNewPage(url?: string): Promise<{
    pageId: number;
    page: Page;
}>;
export declare function getActivePage(): Page | null;
export declare function getPage(pageId: number): Page | null;
export declare function getCursor(pageId: number): GhostCursor | null;
export declare function setActivePage(pageId: number): boolean;
export declare function closePage(pageId: number): Promise<boolean>;
export declare function closeBrowser(): Promise<void>;
export declare function getPageList(): Promise<Array<{
    id: number;
    url: string;
    title: string;
}>>;
//# sourceMappingURL=browser.d.ts.map