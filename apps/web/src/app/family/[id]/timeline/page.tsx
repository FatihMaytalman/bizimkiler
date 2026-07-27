import type { Metadata } from 'next';
import { TimelineClient } from '@/components/memories/timeline-client';

export const metadata: Metadata = {
  title: 'Timeline',
};

interface TimelinePageProps {
  params: Promise<{ id: string }>;
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { id } = await params;
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-gold-500">Timeline</p>
        <h2 className="mt-2 font-display text-4xl text-cream-50">Family memories</h2>
        <p className="mt-3 max-w-2xl text-warm-white/70">
          Bizimkiler — one photo, one voice note, one memory, one family.
        </p>
      </section>
      <TimelineClient familyId={id} />
    </div>
  );
}
