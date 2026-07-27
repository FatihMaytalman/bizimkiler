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
    <div className="flex aspect-[4/3] w-full flex-col justify-end rounded-xl border border-turquoise-500/20 bg-gradient-to-br from-turquoise-500/20 via-white/5 to-gold-500/10 p-4">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em] text-turquoise-500">EchoTap</p>
        <p className="mt-2 font-display text-2xl text-cream-50">Voice memory</p>
      </div>
      {src ? (
        <audio src={src} controls className="w-full" preload="metadata" />
      ) : (
        <div className="h-10 rounded-full bg-white/10" />
      )}
    </div>
  );
}
