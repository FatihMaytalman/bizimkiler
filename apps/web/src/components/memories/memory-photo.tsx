'use client';

import { useEffect, useState } from 'react';
import { memoryPhotoUrl, TOKEN_KEY } from '@/lib/api';
import { MEMORY_PHOTO_CACHE } from '@/lib/offline';

async function loadPhotoBlob(
  memoryId: string,
  token: string | null,
): Promise<Blob | null> {
  const url = memoryPhotoUrl(memoryId);
  const cacheAvailable = typeof caches !== 'undefined';
  const cache = cacheAvailable ? await caches.open(MEMORY_PHOTO_CACHE) : null;

  if (cache) {
    const cached = await cache.match(url);
    if (cached) {
      return cached.blob();
    }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error('Photo load failed');
  }

  const blob = await response.blob();

  if (cache) {
    try {
      await cache.put(
        url,
        new Response(blob.slice(), {
          headers: {
            'Content-Type': blob.type || 'image/jpeg',
            'Cache-Control': 'max-age=604800',
          },
        }),
      );
    } catch {
      // Quota or opaque failures — still show the photo this session.
    }
  }

  return blob;
}

export function MemoryPhoto({ memoryId }: { memoryId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [offlineMissing, setOfflineMissing] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const token = window.localStorage.getItem(TOKEN_KEY);

    void loadPhotoBlob(memoryId, token)
      .then((blob) => {
        if (cancelled || !blob) {
          if (!cancelled && !blob) setOfflineMissing(true);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
        setOfflineMissing(false);
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(null);
          setOfflineMissing(typeof navigator !== 'undefined' && !navigator.onLine);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [memoryId]);

  if (!src) {
    return (
      <div className="aspect-[4/3] flex w-full items-center justify-center rounded-xl bg-white/5 text-xs text-warm-white/40">
        {offlineMissing ? 'Photo unavailable offline' : null}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
  );
}
