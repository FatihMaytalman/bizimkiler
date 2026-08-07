const DEFAULT_PRODUCTION_CORS_ORIGINS =
  'https://bizimkiler.aomlegacy.com,https://aomlegacy.com,*.vercel.app,*.pages.dev';

const DEFAULT_DEVELOPMENT_CORS_ORIGINS =
  'http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:8080';

export function defaultCorsOrigins(): string {
  if (process.env.CORS_ORIGINS?.trim()) {
    return process.env.CORS_ORIGINS;
  }

  if (process.env.NODE_ENV === 'production') {
    return DEFAULT_PRODUCTION_CORS_ORIGINS;
  }

  return DEFAULT_DEVELOPMENT_CORS_ORIGINS;
}

export function parseCorsOrigins(value?: string): string[] {
  return (value?.trim() || defaultCorsOrigins())
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isCorsOriginAllowed(origin: string, allowed: string[]): boolean {
  for (const pattern of allowed) {
    if (pattern === origin) {
      return true;
    }

    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1);
      try {
        const { protocol, hostname } = new URL(origin);
        if (protocol !== 'https:') {
          continue;
        }
        if (hostname.endsWith(suffix) && hostname.length > suffix.length) {
          return true;
        }
      } catch {
        continue;
      }
    }
  }

  return false;
}
