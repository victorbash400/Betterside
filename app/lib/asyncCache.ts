export interface CachePolicy<T> {
  ttlMs: number | ((value: T) => number);
  errorTtlMs: number;
  staleIfErrorMs?: number;
}
export interface CacheResult<T> {
  value: T;
  storedAt: number;
  expiresAt: number;
  refreshError?: CachedLoadError;
}
export class CachedLoadError extends Error {
  constructor(
    cause: unknown,
    readonly attemptedAt: number,
    readonly retryAt: number,
  ) {
    super(cause instanceof Error ? cause.message : "Request failed.", {
      cause,
    });
    this.name = "CachedLoadError";
  }
}
type Entry<T> =
  | { result: CacheResult<T>; bytes: number; retainUntil: number }
  | {
      error: CachedLoadError;
      previous?: CacheResult<T>;
      bytes: number;
      retainUntil: number;
    };
export function createAsyncCache<T>({
  maxEntries,
  maxBytes,
  now = Date.now,
}: {
  maxEntries: number;
  maxBytes: number;
  now?: () => number;
}) {
  if (maxEntries < 1 || maxBytes < 1)
    throw new Error("Invalid cache capacity.");
  const entries = new Map<string, Entry<T>>();
  const pending = new Map<string, Promise<CacheResult<T>>>();
  let bytes = 0;
  function remove(key: string) {
    const entry = entries.get(key);
    if (entry) bytes -= entry.bytes;
    entries.delete(key);
  }
  function store(key: string, entry: Entry<T>) {
    remove(key);
    if (entry.bytes > maxBytes) return;
    for (const [oldKey, old] of entries) {
      if (old.retainUntil <= now()) remove(oldKey);
    }
    while (entries.size >= maxEntries || bytes + entry.bytes > maxBytes) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      remove(oldest);
    }
    entries.set(key, entry);
    bytes += entry.bytes;
  }
  return {
    peek(key: string): CacheResult<T> | undefined {
      const entry = entries.get(key);
      return entry && "result" in entry && entry.result.expiresAt > now()
        ? entry.result
        : undefined;
    },
    invalidate(key: string) {
      remove(key);
    },
    async get(
      key: string,
      load: () => Promise<T>,
      policy: CachePolicy<T>,
    ): Promise<CacheResult<T>> {
      if (
        (typeof policy.ttlMs === "number" && policy.ttlMs <= 0) ||
        policy.errorTtlMs < 0
      )
        throw new Error("Invalid cache lifetime.");
      const staleWindow = policy.staleIfErrorMs ?? 0;
      if (!Number.isFinite(staleWindow) || staleWindow < 0)
        throw new Error("Invalid stale retention.");
      const entry = entries.get(key);
      const previous =
        entry && ("result" in entry ? entry.result : entry.previous);
      const canRetain =
        previous && staleWindow > 0 && previous.expiresAt + staleWindow > now();
      if (entry) {
        const expiresAt =
          "result" in entry ? entry.result.expiresAt : entry.error.retryAt;
        if (expiresAt > now()) {
          entries.delete(key);
          entries.set(key, entry);
          if ("error" in entry) {
            if (canRetain) return { ...previous, refreshError: entry.error };
            throw entry.error;
          }
          return entry.result;
        }
        if (!canRetain) remove(key);
      }
      const existing = pending.get(key);
      if (existing) return existing;
      const task = Promise.resolve().then(async () => {
        try {
          const value = await load();
          const storedAt = now();
          const ttlMs =
            typeof policy.ttlMs === "function"
              ? policy.ttlMs(value)
              : policy.ttlMs;
          if (!Number.isFinite(ttlMs) || ttlMs <= 0)
            throw new Error("Invalid cache lifetime.");
          const result = { value, storedAt, expiresAt: storedAt + ttlMs };
          const serialized = JSON.stringify(value);
          if (serialized === undefined)
            throw new Error("Cache value must be JSON serializable.");
          store(key, {
            result,
            bytes: new TextEncoder().encode(serialized).byteLength,
            retainUntil: result.expiresAt + (policy.staleIfErrorMs ?? 0),
          });
          return result;
        } catch (cause) {
          const attemptedAt =
            cause instanceof CachedLoadError ? cause.attemptedAt : now();
          const retryAt =
            cause instanceof CachedLoadError
              ? cause.retryAt
              : now() + policy.errorTtlMs;
          const error =
            cause instanceof CachedLoadError
              ? cause
              : new CachedLoadError(cause, attemptedAt, retryAt);
          if (retryAt > now())
            store(key, {
              error,
              previous: canRetain ? previous : undefined,
              retainUntil: canRetain
                ? Math.max(retryAt, previous.expiresAt + staleWindow)
                : retryAt,
              bytes:
                new TextEncoder().encode(
                  JSON.stringify(canRetain ? previous.value : error.message),
                ).byteLength + 64,
            });
          if (canRetain) return { ...previous, refreshError: error };
          throw error;
        } finally {
          pending.delete(key);
        }
      });
      pending.set(key, task);
      return task;
    },
  };
}
