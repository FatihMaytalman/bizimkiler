import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Media library',
};

/**
 * Public entry for "Open media library".
 *
 * On the self-hosted Docker stack, nginx may proxy `/photos/` to Immich before
 * this Next.js route is hit. On the public Next.js deployment (and when Immich
 * is not in front), this page guides visitors into the family workspace flow —
 * media lives under `/family/[id]/media` after sign-in.
 */
export default function PhotosEntryPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,196,182,0.12),_transparent_40%),linear-gradient(180deg,#0d1b2a_0%,#1a1a2e_100%)]">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <p className="text-sm uppercase tracking-[0.28em] text-gold-500">Media library</p>
        <h1 className="mt-3 font-display text-4xl text-cream-50">Choose a family first</h1>
        <p className="mt-4 text-warm-white/70">
          Photos and memories live inside a private family workspace. Sign in, pick a family,
          then open Media from the sidebar.
        </p>

        <Card className="mt-8">
          <CardTitle>Where to go</CardTitle>
          <CardDescription>
            Use the family switcher if you already have an account, or sign in to continue.
          </CardDescription>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/login">
              <Button>Sign in</Button>
            </Link>
            <Link href="/families">
              <Button variant="secondary">Choose a family</Button>
            </Link>
          </div>
        </Card>

        <Link href="/" className="mt-8 text-sm text-warm-white/50 hover:text-warm-white/80">
          ← Back to Bizimkiler home
        </Link>
      </div>
    </div>
  );
}
