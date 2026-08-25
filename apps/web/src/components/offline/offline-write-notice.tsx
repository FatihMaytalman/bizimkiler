'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';

interface OfflineWriteNoticeProps {
  action?: string;
}

/** Inline notice for forms that require a network connection. */
export function OfflineWriteNotice({
  action = 'saving changes',
}: OfflineWriteNoticeProps) {
  const online = useOnlineStatus();

  if (online) {
    return null;
  }

  return (
    <p className="text-sm text-gold-500/90" role="status">
      Offline — reconnect before {action}.
    </p>
  );
}
