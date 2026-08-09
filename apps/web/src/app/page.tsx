import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { PlatformHealthPanel } from '@/components/landing/platform-health-panel';
import { fetchPlatformHealth } from '@/lib/api';

export default async function LandingPage() {
  const platformHealth = await fetchPlatformHealth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,196,182,0.12),_transparent_40%),linear-gradient(180deg,#0d1b2a_0%,#1a1a2e_100%)]">
      <header className="border-b border-white/10 bg-navy-950/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <p className="font-display text-lg text-cream-50">Bizimkiler</p>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/families" className="text-warm-white/70 hover:text-warm-white">
              Families
            </Link>
            <Link href="/login">
              <Button variant="secondary">Sign in</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col px-6 py-16">
        <p className="text-sm uppercase tracking-[0.28em] text-gold-500">Bizimkiler — One Photo. One Memory. One Family.</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl text-balance text-cream-50 md:text-6xl">
          A private museum for your family&apos;s story
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-warm-white/75">
          Bizimkiler combines self-hosted media preservation, genealogy, collaborative
          storytelling, and careful Claude AI assistance in one calm, respectful archive.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/login">
            <Button>Sign in to your family</Button>
          </Link>
          <Link href="/families">
            <Button variant="secondary">Choose a family</Button>
          </Link>
          <Link href="/photos">
            <Button variant="ghost">Open media library</Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <Card>
              <CardTitle>Preserve</CardTitle>
              <CardDescription>
                Keep photos, videos, documents, and stories safe with exportable metadata.
              </CardDescription>
            </Card>
            <Card>
              <CardTitle>Connect</CardTitle>
              <CardDescription>
                Build a living family graph with people, events, and shared memories.
              </CardDescription>
            </Card>
            <Card>
              <CardTitle>Protect</CardTitle>
              <CardDescription>
                Stay private by default with audit trails, permissions, and backup health.
              </CardDescription>
            </Card>
          </div>

          <PlatformHealthPanel health={platformHealth} />
        </div>

        <section className="mt-16">
          <Card className="border-gold-500/20">
            <CardTitle>Claude heritage assistant</CardTitle>
            <CardDescription>
              Ask respectful questions about your archive, draft family story summaries, and get
              help organizing memories — with humans always in control of sensitive changes.
            </CardDescription>
            <p className="mt-4 text-sm text-warm-white/70">
              The API exposes <code className="text-turquoise-400">/api/ai/assist</code> once{' '}
              <code className="text-turquoise-400">ANTHROPIC_API_KEY</code> is configured on the
              server. AI suggestions are advisory only and never auto-apply to your family graph.
            </p>
          </Card>
        </section>

        <footer className="mt-20 border-t border-white/10 pt-8 text-sm text-warm-white/50">
          <p>
            Hosted on Cloudflare for AOMLegacy.com · API and media can run on your private home
            server via Tailscale or Cloudflare Tunnel.
          </p>
        </footer>
      </div>
    </div>
  );
}
