// Cache management utility for XDU Collection
interface CacheData<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export class CacheManager {
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static set<T>(key: string, data: T, customDuration?: number): void {
    const duration = customDuration || this.CACHE_DURATION;
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + duration
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheData: CacheData<T> = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() > cacheData.expiry) {
        this.remove(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Failed to read from cache:', error);
      this.remove(key);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from cache:', error);
    }
  }

  static clear(): void {
    try {
      // Only clear XDU-related cache items
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('xdu_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  static isExpired(key: string): boolean {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return true;

      const cacheData: CacheData<any> = JSON.parse(cached);
      return Date.now() > cacheData.expiry;
    } catch (error) {
      return true;
    }
  }

  static getTimestamp(key: string): number | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheData: CacheData<any> = JSON.parse(cached);
      return cacheData.timestamp;
    } catch (error) {
      return null;
    }
  }
}

// Cache keys constants
export const CACHE_KEYS = {
  WORKS: 'xdu_works_cache',
  LORE: 'xdu_lore_cache',
  USER_PREFERENCES: 'xdu_user_preferences',
  READING_PROGRESS: 'xdu_reading_progress'
} as const;