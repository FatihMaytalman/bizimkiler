'use client';

import { useEffect, useState } from 'react';
import { isBrowserOnline } from '@/lib/offline';

/**
 * Tracks `navigator.onLine` plus `online` / `offline` window events.
 * Starts optimistic (online) to avoid a flash of the offline banner on SSR/hydration.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isBrowserOnline());

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return online;
}
