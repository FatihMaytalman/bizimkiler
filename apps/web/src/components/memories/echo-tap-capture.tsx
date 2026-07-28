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
  const audioContextRef = useRef<AudioContext | null>(null);
  const pressActiveRef = useRef(false);

  const [channel, setChannel] = useState('CH-01 Family Net');
  const [callSign, setCallSign] = useState('FAMILY-1');
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
      if (!recordingFile) throw new Error('Transmit or load an audio clip first.');
      return uploadVoiceMemory(
        familyId,
        recordingFile,
        buildTransmissionCaption(),
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
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void audioContextRef.current?.close();
    };
  }, []);

  function stopTimer(): void {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function buildTransmissionCaption(): string {
    const message = caption.trim() || 'Radio check';
    return `${callSign.trim() || 'FAMILY-1'} ${channel.trim() || 'CH-01'}: ${message}`;
  }

  function playTone(frequency: number, durationMs: number): void {
    try {
      const context = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = context;

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = 'square';
      gain.gain.setValueAtTime(0.04, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + durationMs / 1000);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + durationMs / 1000);
    } catch {
      // Audio cues are progressive enhancement; recording must still work without them.
    }
  }

  async function startRecording(): Promise<void> {
    setError(null);
    setRecordingFile(null);
    setRecordedDurationMs(undefined);
    setElapsedMs(0);
    setIsRecording(true);
    startedAtRef.current = Date.now();

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser cannot record audio here. Choose an audio file instead.');
      setIsRecording(false);
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
        playTone(520, 90);
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

      playTone(920, 80);
      recorder.start();
      intervalRef.current = window.setInterval(() => {
        if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current);
      }, 250);
    } catch {
      setError('Microphone access was blocked. Choose an audio file instead.');
      setIsRecording(false);
      stopTimer();
    }
  }

  function stopRecording(): void {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }

  function keyMicrophone(): void {
    if (pressActiveRef.current || mutation.isPending) {
      return;
    }
    pressActiveRef.current = true;
    void startRecording();
  }

  function releaseMicrophone(): void {
    pressActiveRef.current = false;
    stopRecording();
  }

  function toggleTransmission(): void {
    if (isRecording) {
      releaseMicrophone();
    } else {
      keyMicrophone();
    }
  }

  return (
    <Card>
      <CardTitle>EchoTap Radio</CardTitle>
      <CardDescription>
        Key the mic to transmit. End the transmission when the family-net message is done.
      </CardDescription>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <div className="rounded-3xl border border-turquoise-500/30 bg-[radial-gradient(circle_at_top,_rgba(46,196,182,0.22),_rgba(255,255,255,0.04)_52%,_rgba(13,27,42,0.7))] p-5 shadow-card">
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em]">
            <span className="text-turquoise-500">{channel}</span>
            <span
              className={
                isRecording
                  ? 'rounded-full bg-red-500/20 px-3 py-1 text-red-300'
                  : recordingFile
                    ? 'rounded-full bg-turquoise-500/20 px-3 py-1 text-turquoise-300'
                    : 'rounded-full bg-white/10 px-3 py-1 text-warm-white/60'
              }
            >
              {isRecording ? 'TX live' : recordingFile ? 'RX captured' : 'Standby'}
            </span>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-sm text-turquoise-200 sm:grid-cols-3">
            <div>
              <p className="text-warm-white/40">CALLSIGN</p>
              <p>{callSign || 'FAMILY-1'}</p>
            </div>
            <div>
              <p className="text-warm-white/40">SQUELCH</p>
              <p>FAMILY ONLY</p>
            </div>
            <div>
              <p className="text-warm-white/40">SIGNAL</p>
              <p>{isRecording ? '|||||' : recordingFile ? '||||' : '|||'}</p>
            </div>
          </div>

          <p className="mt-6 text-center font-mono text-5xl text-cream-50">
            {formatElapsed(elapsedMs)}
          </p>
          <p className="mt-2 text-center text-xs uppercase tracking-[0.3em] text-warm-white/50">
            {isRecording ? 'Transmitting' : recordingFile ? 'Transmission ready' : 'Channel open'}
          </p>

          <Button
            className={
              isRecording
                ? 'mx-auto mt-5 flex min-h-32 min-w-32 rounded-full bg-red-500 text-white hover:bg-red-500/90'
                : 'mx-auto mt-5 flex min-h-32 min-w-32 rounded-full text-base'
            }
            type="button"
            onClick={toggleTransmission}
            onKeyDown={(event) => {
              if ((event.key === ' ' || event.key === 'Enter') && !isRecording) {
                event.preventDefault();
                keyMicrophone();
              }
            }}
            onKeyUp={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                releaseMicrophone();
              }
            }}
            disabled={mutation.isPending}
          >
            {isRecording ? 'End transmission' : 'Key mic'}
          </Button>
          <p className="mt-4 text-center text-sm text-warm-white/60">
            {isRecording
              ? 'Live mic is hot. Click again or release the key to close the transmission.'
              : 'Radio mode: click to key the mic, then click again to release.'}
          </p>
        </div>

        {previewUrl ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.24em] text-turquoise-500">
              Received transmission preview
            </p>
            <audio src={previewUrl} controls className="w-full" preload="metadata" />
          </div>
        ) : null}

        <label className="block space-y-2 text-sm text-warm-white/70">
          <span>Load recorded transmission</span>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm text-warm-white/70">
            <span>Channel</span>
            <input
              className={inputClass}
              maxLength={32}
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
            />
          </label>
          <label className="block space-y-2 text-sm text-warm-white/70">
            <span>Callsign</span>
            <input
              className={inputClass}
              maxLength={16}
              value={callSign}
              onChange={(event) => setCallSign(event.target.value.toUpperCase())}
            />
          </label>
        </div>

        <textarea
          className={inputClass}
          rows={3}
          maxLength={280}
          placeholder="Transmission note, location, or radio check"
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
          {mutation.isPending ? 'Logging…' : 'Log transmission'}
        </Button>
      </form>
    </Card>
  );
}
