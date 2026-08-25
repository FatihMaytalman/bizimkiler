'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { OfflineWriteNotice } from '@/components/offline/offline-write-notice';
import { useAuth } from '@/components/providers/auth-provider';
import { useOnlineStatus } from '@/hooks/use-online-status';

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-cream-50 placeholder:text-warm-white/40 focus:border-gold-500/60 focus:outline-none';

export default function LoginPage() {
  const router = useRouter();
  const online = useOnlineStatus();
  const { login, register, user, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), displayName.trim(), password);
      }
      router.push('/families');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,196,182,0.12),_transparent_40%),linear-gradient(180deg,#0d1b2a_0%,#1a1a2e_100%)]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <p className="text-sm uppercase tracking-[0.28em] text-gold-500">Bizimkiler</p>
        <h1 className="mt-3 font-display text-4xl text-cream-50">
          {mode === 'login' ? 'Sign in to your family' : 'Create your account'}
        </h1>

        {user ? (
          <Card className="mt-8">
            <CardTitle>Signed in</CardTitle>
            <CardDescription>You are signed in as {user.email}.</CardDescription>
            <div className="mt-5 flex gap-3">
              <Link href="/families">
                <Button>Go to families</Button>
              </Link>
              <Button variant="secondary" onClick={logout}>
                Sign out
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="mt-8">
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <input
                aria-label="Email"
                type="email"
                required
                className={inputClass}
                placeholder="you@example.com"
                value={email}
                disabled={!online}
                onChange={(event) => setEmail(event.target.value)}
              />
              {mode === 'register' ? (
                <input
                  aria-label="Display name"
                  required
                  className={inputClass}
                  placeholder="Your name"
                  value={displayName}
                  disabled={!online}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              ) : null}
              <input
                aria-label="Password"
                type="password"
                required
                className={inputClass}
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Password'}
                value={password}
                disabled={!online}
                onChange={(event) => setPassword(event.target.value)}
              />
              <OfflineWriteNotice
                action={mode === 'login' ? 'signing in' : 'creating an account'}
              />
              <Button type="submit" disabled={!online || pending}>
                {pending
                  ? 'Please wait…'
                  : mode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
              </Button>
            </form>
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
            <button
              type="button"
              className="mt-4 text-sm text-turquoise-500 hover:underline"
              onClick={() => {
                setError(null);
                setMode(mode === 'login' ? 'register' : 'login');
              }}
            >
              {mode === 'login'
                ? 'Need an account? Create one'
                : 'Already have an account? Sign in'}
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
