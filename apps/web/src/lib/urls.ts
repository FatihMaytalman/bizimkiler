function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/** Public site origin for invite links and absolute URLs in the browser. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return trimTrailingSlash(fromEnv);
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}
