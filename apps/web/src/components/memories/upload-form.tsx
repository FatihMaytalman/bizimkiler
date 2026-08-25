'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { OfflineWriteNotice } from '@/components/offline/offline-write-notice';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { uploadMemory } from '@/lib/api';

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-cream-50 placeholder:text-warm-white/40 focus:border-gold-500/60 focus:outline-none';

interface UploadFormProps {
  familyId: string;
}

export function UploadForm({ familyId }: UploadFormProps) {
  const router = useRouter();
  const online = useOnlineStatus();
  const [caption, setCaption] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Choose a photo');
      return uploadMemory(familyId, caption, file, memoryDate || undefined);
    },
    onSuccess: () => {
      router.push(`/family/${familyId}/timeline`);
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <Card>
      <CardTitle>Add a memory</CardTitle>
      <CardDescription>One photo. One caption. Shared with your family.</CardDescription>
      <form
        className="mt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={inputClass}
          disabled={!online}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <textarea
          className={inputClass}
          rows={3}
          maxLength={280}
          placeholder="Caption (max 280 characters)"
          value={caption}
          disabled={!online}
          onChange={(event) => setCaption(event.target.value)}
          required
        />
        <input
          type="date"
          className={inputClass}
          value={memoryDate}
          disabled={!online}
          onChange={(event) => setMemoryDate(event.target.value)}
        />
        <OfflineWriteNotice action="uploading a memory" />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button
          type="submit"
          disabled={!online || mutation.isPending || !file || caption.trim().length < 1}
        >
          {mutation.isPending ? 'Uploading…' : 'Save memory'}
        </Button>
      </form>
    </Card>
  );
}
