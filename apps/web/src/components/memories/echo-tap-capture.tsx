'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { uploadVoiceMemory } from '@/lib/api';

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-cream-50 placeholder:text-warm-white/40 focus:border-gold-500/60 focus:outline-none';

const preferredMimeTypes = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

interface EchoTapCaptureProps {
  familyId: string;
}

function chooseMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }

  return preferredMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

function filenameForMimeType(mimeType: string): string {
  if (mimeType.includes('ogg')) return 'echotap.ogg';
  if (mimeType.includes('mp4')) return 'echotap.m4a';
  return 'echotap.webm';
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function EchoTapCapture({ familyId }: EchoTapCaptureProps) {
  const router = useRouter();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const [caption, setCaption] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [recordedDurationMs, setRecordedDurationMs] = useState<number | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!recordingFile) throw new Error('Record or choose an audio clip first.');
      return uploadVoiceMemory(
        familyId,
        recordingFile,
        caption || undefined,
        memoryDate || undefined,
        recordedDurationMs,
      );
    },
    onSuccess: () => {
      router.push(`/family/${familyId}/timeline`);
    },
    onError: (err: Error) => setError(err.message),
  });

  useEffect(() => {
    if (!recordingFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(recordingFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [recordingFile]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function stopTimer(): void {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  async function startRecording(): Promise<void> {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser cannot record audio here. Choose an audio file instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = chooseMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopTimer();
        const finalDurationMs = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
        const finalMimeType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        const file = new File([blob], filenameForMimeType(finalMimeType), {
          type: finalMimeType,
        });
        setRecordingFile(file);
        setRecordedDurationMs(finalDurationMs);
        setElapsedMs(finalDurationMs);
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
      };

      recorder.start();
      setRecordingFile(null);
      setRecordedDurationMs(undefined);
      setElapsedMs(0);
      setIsRecording(true);
      intervalRef.current = window.setInterval(() => {
        if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current);
      }, 250);
    } catch {
      setError('Microphone access was blocked. Choose an audio file instead.');
    }
  }

  function stopRecording(): void {
    recorderRef.current?.stop();
  }

  return (
    <Card>
      <CardTitle>EchoTap</CardTitle>
      <CardDescription>
        Tap once to record a family story. Add context later, or let the voice carry it.
      </CardDescription>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <div className="rounded-3xl border border-turquoise-500/20 bg-turquoise-500/10 p-5 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-turquoise-500">
            {isRecording ? 'Recording' : recordingFile ? 'Ready to save' : 'Ready'}
          </p>
          <p className="mt-3 font-mono text-4xl text-cream-50">{formatElapsed(elapsedMs)}</p>
          <Button
            className="mt-5 min-h-28 min-w-28 rounded-full text-base"
            type="button"
            onClick={() => {
              if (isRecording) {
                stopRecording();
              } else {
                void startRecording();
              }
            }}
            disabled={mutation.isPending}
          >
            {isRecording ? 'Stop' : 'Tap to record'}
          </Button>
        </div>

        {previewUrl ? (
          <audio src={previewUrl} controls className="w-full" preload="metadata" />
        ) : null}

        <label className="block space-y-2 text-sm text-warm-white/70">
          <span>Or choose an existing audio clip</span>
          <input
            type="file"
            accept="audio/webm,audio/mp4,audio/mpeg,audio/ogg,audio/wav,audio/aac"
            className={inputClass}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setRecordingFile(file);
              setRecordedDurationMs(undefined);
              setElapsedMs(0);
            }}
          />
        </label>

        <textarea
          className={inputClass}
          rows={3}
          maxLength={280}
          placeholder="Optional caption, name, or place"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
        <input
          type="date"
          className={inputClass}
          value={memoryDate}
          onChange={(event) => setMemoryDate(event.target.value)}
        />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button type="submit" disabled={mutation.isPending || isRecording || !recordingFile}>
          {mutation.isPending ? 'Saving…' : 'Save voice memory'}
        </Button>
      </form>
    </Card>
  );
}
