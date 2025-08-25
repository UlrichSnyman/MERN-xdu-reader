import { Page } from '../types';
import { pagesAPI } from './api';

// Global in-memory cache that persists across component mounts within the SPA
export const pageCache: Map<string, Page> = new Map();

export function getCachedPage(id: string): Page | undefined {
  return pageCache.get(id);
}

export function setCachedPage(p: Page) {
  pageCache.set(p._id, p);
}

export async function prefetchPages(ids: string[]) {
  const needed = ids.filter(id => !pageCache.has(id));
  if (!needed.length) return;
  const results = await Promise.allSettled(needed.map(id => pagesAPI.getById(id)));
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const p = r.value.data as Page;
      pageCache.set(p._id, p);
    }
  }
}
