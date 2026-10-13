import { useState, useEffect, useCallback, DependencyList } from 'react';

type Listener = (storeName: string) => void;

class DatabaseEventEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(storeName: string, listener: Listener): () => void {
    if (!this.listeners.has(storeName)) {
      this.listeners.set(storeName, new Set());
    }
    this.listeners.get(storeName)!.add(listener);

    return () => {
      const set = this.listeners.get(storeName);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(storeName);
        }
      }
    };
  }

  notify(storeName: string) {
    // Notify specific store listeners
    const storeListeners = this.listeners.get(storeName);
    if (storeListeners) {
      storeListeners.forEach((fn) => fn(storeName));
    }
    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((fn) => fn(storeName));
    }
  }
}

export const dbEvents = new DatabaseEventEmitter();

export function notifyStoreChange(storeName: string) {
  dbEvents.notify(storeName);
}

/**
 * Custom React hook that subscribes to IndexedDB store change events
 * and automatically re-fetches live data.
 */
export function useLiveData<T>(
  fetcher: () => Promise<T>,
  storeNames: string | string[],
  deps: DependencyList = []
): {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
} {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const executeFetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err) {
      console.error('[useLiveData] Fetch error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    executeFetch();

    const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
    const unsubscribes = stores.map((store) =>
      dbEvents.subscribe(store, () => {
        executeFetch();
      })
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [executeFetch, Array.isArray(storeNames) ? storeNames.join(',') : storeNames]);

  return { data, loading, error, reload: executeFetch };
}
