/** Detect browser online state. Safe on the server (assumes online). */
export function isBrowserOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
}

export class OfflineError extends Error {
  readonly isOffline = true as const;

  constructor(message = 'You are offline. Reconnect to make changes.') {
    super(message);
    this.name = 'OfflineError';
  }
}

export function isOfflineError(error: unknown): error is OfflineError {
  return (
    error instanceof OfflineError ||
    (typeof error === 'object' &&
      error !== null &&
      'isOffline' in error &&
      (error as { isOffline?: unknown }).isOffline === true)
  );
}

export function assertOnline(action = 'make changes'): void {
  if (!isBrowserOnline()) {
    throw new OfflineError(`You are offline. Reconnect to ${action}.`);
  }
}

/** Cache Storage bucket for authenticated memory photo blobs. */
export const MEMORY_PHOTO_CACHE = 'bizimkiler-memory-photos-v1';

/** localStorage key for the persisted TanStack Query cache. */
export const QUERY_CACHE_KEY = 'bizimkiler.query-cache';

/** Keep hydrated query data available for a week of offline browsing. */
export const QUERY_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
