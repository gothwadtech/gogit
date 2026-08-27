/**
 * Safe Storage Utility
 * Provides a resilient, crash-proof key-value storage layer that works seamlessly
 * even inside sandboxed iframes (e.g. Google AI Studio, cross-origin webviews)
 * where window.localStorage access may throw SecurityError / DOMException.
 */

class SafeStorageService {
  private memoryStore: Map<string, string> = new Map();
  private isLocalStorageAvailable: boolean = false;

  constructor() {
    this.checkLocalStorageAvailability();
  }

  private checkLocalStorageAvailability() {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        const testKey = '__storage_test_key__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        this.isLocalStorageAvailable = true;
      } else {
        this.isLocalStorageAvailable = false;
      }
    } catch {
      // localStorage is blocked (e.g. sandboxed iframe, cookies blocked)
      this.isLocalStorageAvailable = false;
    }
  }

  public getItem(key: string): string | null {
    if (this.isLocalStorageAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        // Fallback to memory if runtime error occurs
      }
    }

    // Try sessionStorage as secondary fallback
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const sessionVal = window.sessionStorage.getItem(key);
        if (sessionVal !== null) return sessionVal;
      }
    } catch {
      // ignore
    }

    return this.memoryStore.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    const strVal = String(value);

    // Save in memory store always
    this.memoryStore.set(key, strVal);

    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.setItem(key, strVal);
      } catch {
        // Fallback gracefully without throwing
      }
    }

    // Also mirror to sessionStorage if available
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, strVal);
      }
    } catch {
      // ignore
    }
  }

  public removeItem(key: string): void {
    this.memoryStore.delete(key);

    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }

  public clear(): void {
    this.memoryStore.clear();

    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.clear();
      } catch {
        // ignore
      }
    }

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } catch {
      // ignore
    }
  }

  public isPersistent(): boolean {
    return this.isLocalStorageAvailable;
  }
}

export const safeStorage = new SafeStorageService();
export default safeStorage;
