'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 border-b border-gold-500/30 bg-navy-950/95 px-4 py-2.5 text-center text-sm text-cream-50 backdrop-blur-sm"
    >
      You are offline. Browse previously loaded families, people, and memories.
      Uploads and edits will resume when you reconnect.
    </div>
  );
}
