import type { Metadata } from 'next';
import { EchoTapCapture } from '@/components/memories/echo-tap-capture';

export const metadata: Metadata = {
  title: 'EchoTap',
};

interface EchoTapPageProps {
  params: Promise<{ id: string }>;
}

export default async function EchoTapPage({ params }: EchoTapPageProps) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-turquoise-500">EchoTap</p>
        <h2 className="mt-2 font-display text-4xl text-cream-50">Family radio channel</h2>
        <p className="mt-3 text-warm-white/70">
          Radio-style voice capture for quick check-ins, radio checks, and story
          transmissions.
        </p>
      </div>
      <EchoTapCapture familyId={id} />
    </div>
  );
}
