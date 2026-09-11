/**
 * Resilient fetch wrapper for external API calls.
 * Provides:
 *  - Strict timeout (default 3500ms)
 *  - Bounded retry with exponential backoff (1-2 retries)
 *  - Consistent error propagation
 *
 * Usage: import fetchWithResilience from this module and replace bare fetch() calls.
 */

export type DataFreshness = 'live' | 'stale' | 'mock_fallback';
export type Confidence = 'HIGH' | 'MEDIUM' | 'ESTIMATED';

export interface FetchResult<T> {
  data: T;
  freshness: DataFreshness;
  confidence: Confidence;
  fetchedAt: string;
  retries: number;
}

export interface ResilienceOptions {
  /** Timeout per attempt in milliseconds (default 3500). */
  timeoutMs?: number;
  /** Max number of retries after initial attempt (0-2). Default 1. */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff between retries. Default 400. */
  baseBackoffMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a URL with timeout, retry, and backoff.
 * Throws on final failure after all retries exhausted.
 */
export async function fetchWithResilience(
  url: string,
  init: RequestInit & { signal?: AbortSignal } = {},
  opts: ResilienceOptions = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? 3500;
  const maxRetries = Math.min(2, Math.max(0, opts.maxRetries ?? 1));
  const baseBackoffMs = opts.baseBackoffMs ?? 400;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await sleep(baseBackoffMs * 2 ** (attempt - 1)); // 400ms, 800ms
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException('fetch timeout', 'TimeoutError')), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      const isAbort = err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError');
      // Only retry on transient network / timeout errors.
      if (!isAbort && !(err instanceof TypeError)) throw err;
    }
  }
  throw lastErr;
}
