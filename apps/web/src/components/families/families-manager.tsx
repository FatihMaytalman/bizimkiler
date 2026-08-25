'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { OfflineWriteNotice } from '@/components/offline/offline-write-notice';
import { useAuth } from '@/components/providers/auth-provider';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { createFamily, fetchFamilies } from '@/lib/api';

export function FamiliesManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const [name, setName] = useState('');

  const familiesQuery = useQuery({
    queryKey: ['families'],
    queryFn: fetchFamilies,
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (familyName: string) => createFamily(familyName),
    onSuccess: () => {
      setName('');
      void queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });

  const trimmed = name.trim();

  return (
    <div className="mt-10 space-y-8">
      {!user ? (
        <Card>
          <CardTitle>Sign in to view your families</CardTitle>
          <CardDescription>
            Family workspaces are private. Sign in to see the families you belong to and create
            new ones.
          </CardDescription>
          <div className="mt-5">
            <Link href="/login">
              <Button>Sign in or create account</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <CardTitle>Create a family workspace</CardTitle>
          <CardDescription>
            Each workspace is a private space for a family&apos;s people, media, and history.
          </CardDescription>
          <form
            className="mt-5 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (trimmed.length >= 2) {
                createMutation.mutate(trimmed);
              }
            }}
          >
            <input
              aria-label="Family name"
              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-cream-50 placeholder:text-warm-white/40 focus:border-gold-500/60 focus:outline-none"
              placeholder="e.g. Maytalman Family Archive"
              value={name}
              disabled={!online}
              onChange={(event) => setName(event.target.value)}
            />
            <Button
              type="submit"
              disabled={!online || trimmed.length < 2 || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating…' : 'Create family'}
            </Button>
          </form>
          <div className="mt-3 space-y-2">
            <OfflineWriteNotice action="creating a family" />
            {createMutation.isError ? (
              <p className="text-sm text-red-300">
                {(createMutation.error as Error).message}
              </p>
            ) : null}
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {familiesQuery.isLoading && !familiesQuery.data ? (
          <p className="text-warm-white/60">Loading families…</p>
        ) : null}

        {familiesQuery.isError && !familiesQuery.data ? (
          <p className="text-red-300">
            Could not load families
            {!online ? ' while offline' : ''}: {(familiesQuery.error as Error).message}
          </p>
        ) : null}

        {familiesQuery.data?.length === 0 ? (
          <p className="text-warm-white/60">
            No families yet. Create your first family workspace above.
          </p>
        ) : null}

        {familiesQuery.data?.map((family) => (
          <Link key={family.id} href={`/family/${family.id}`}>
            <Card className="transition hover:border-gold-500/40 hover:bg-white/5">
              <CardTitle>{family.name}</CardTitle>
              <CardDescription>
                {family.memberCount} member{family.memberCount === 1 ? '' : 's'} ·{' '}
                {family.mediaAssetCount} media asset
                {family.mediaAssetCount === 1 ? '' : 's'}
              </CardDescription>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
