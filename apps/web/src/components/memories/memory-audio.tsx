'use client';

import { useEffect, useState } from 'react';
import { memoryAudioUrl, TOKEN_KEY } from '@/lib/api';

export function MemoryAudio({ memoryId }: { memoryId: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    const token = window.localStorage.getItem(TOKEN_KEY);

    void fetch(memoryAudioUrl(memoryId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => {
        if (!response.ok) throw new Error('Audio load failed');
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => setSrc(null));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [memoryId]);

  return (
    <div className="flex aspect-[4/3] w-full flex-col justify-between rounded-xl border border-turquoise-500/30 bg-[radial-gradient(circle_at_top,_rgba(46,196,182,0.22),_rgba(255,255,255,0.05)_54%,_rgba(13,27,42,0.76))] p-4">
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em]">
        <span className="text-turquoise-500">EchoTap Comms</span>
        <span className="rounded-full bg-turquoise-500/20 px-2 py-1 text-turquoise-300">RX</span>
      </div>
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em] text-warm-white/40">Logged transmission</p>
        <p className="mt-2 font-display text-2xl text-cream-50">Radio message</p>
      </div>
      {src ? (
        <audio src={src} controls className="w-full" preload="metadata" />
      ) : (
        <div className="h-10 rounded-full bg-white/10" />
      )}
    </div>
  );
}
