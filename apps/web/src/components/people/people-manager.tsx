'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PersonVisibility } from '@aomlegacy/shared';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { OfflineWriteNotice } from '@/components/offline/offline-write-notice';
import { useAuth } from '@/components/providers/auth-provider';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { createPerson, fetchPeople } from '@/lib/api';

interface PeopleManagerProps {
  familyId: string;
}

const inputClass =
  'rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-cream-50 placeholder:text-warm-white/40 focus:border-gold-500/60 focus:outline-none';

export function PeopleManager({ familyId }: PeopleManagerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [visibility, setVisibility] = useState<PersonVisibility>('family');

  const peopleQuery = useQuery({
    queryKey: ['people', familyId],
    queryFn: () => fetchPeople(familyId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createPerson({
        familyId,
        displayName: displayName.trim(),
        birthDate: birthDate || undefined,
        deathDate: deathDate || undefined,
        visibility,
      }),
    onSuccess: () => {
      setDisplayName('');
      setBirthDate('');
      setDeathDate('');
      setVisibility('family');
      void queryClient.invalidateQueries({ queryKey: ['people', familyId] });
    },
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm uppercase tracking-[0.24em] text-gold-500">People directory</p>
        <h2 className="mt-2 font-display text-4xl text-cream-50">Family members</h2>
        <p className="mt-3 max-w-2xl text-warm-white/70">
          Create person profiles and connect them to memories, life events, and relationships.
        </p>
      </section>

      {!user ? (
        <Card>
          <CardTitle>Sign in to add people</CardTitle>
          <CardDescription>
            Adding profiles requires an account.{' '}
            <Link href="/login" className="text-turquoise-500 hover:underline">
              Sign in
            </Link>{' '}
            to continue. Existing people are shown below.
          </CardDescription>
        </Card>
      ) : (
        <Card>
          <CardTitle>Add a person</CardTitle>
          <CardDescription>New profiles are private to this family by default.</CardDescription>
          <form
            className="mt-5 grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (displayName.trim().length >= 1) {
                createMutation.mutate();
              }
            }}
          >
            <input
              aria-label="Full name"
              className={`${inputClass} md:col-span-2`}
              placeholder="Full name (e.g. Fatih Maytalman)"
              value={displayName}
              disabled={!online}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            <label className="text-sm text-warm-white/70">
              Birth date
              <input
                type="date"
                className={`${inputClass} mt-1 w-full`}
                value={birthDate}
                disabled={!online}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </label>
            <label className="text-sm text-warm-white/70">
              Death date (optional)
              <input
                type="date"
                className={`${inputClass} mt-1 w-full`}
                value={deathDate}
                disabled={!online}
                onChange={(event) => setDeathDate(event.target.value)}
              />
            </label>
            <label className="text-sm text-warm-white/70">
              Visibility
              <select
                className={`${inputClass} mt-1 w-full`}
                value={visibility}
                disabled={!online}
                onChange={(event) => setVisibility(event.target.value as PersonVisibility)}
              >
                <option value="family">Family</option>
                <option value="restricted">Restricted</option>
                <option value="private">Private</option>
              </select>
            </label>
            <div className="flex flex-col justify-end gap-2">
              <OfflineWriteNotice action="adding a person" />
              <Button
                type="submit"
                disabled={!online || displayName.trim().length < 1 || createMutation.isPending}
              >
                {createMutation.isPending ? 'Adding…' : 'Add person'}
              </Button>
            </div>
          </form>
          {createMutation.isError ? (
            <p className="mt-3 text-sm text-red-300">
              {(createMutation.error as Error).message}
            </p>
          ) : null}
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {peopleQuery.isLoading && !peopleQuery.data ? (
          <p className="text-warm-white/60">Loading people…</p>
        ) : null}
        {peopleQuery.isError && !peopleQuery.data ? (
          <p className="text-red-300">
            Could not load people
            {!online ? ' while offline' : ''}: {(peopleQuery.error as Error).message}
          </p>
        ) : null}
        {peopleQuery.data?.length === 0 ? (
          <p className="text-warm-white/60">No people yet. Add the first family member above.</p>
        ) : null}
        {peopleQuery.data?.map((person) => (
          <Link key={person.id} href={`/family/${familyId}/people/${person.id}`}>
            <Card className="transition hover:border-gold-500/40 hover:bg-white/5">
              <CardTitle>{person.displayName}</CardTitle>
              <CardDescription>
                {person.isLiving ? 'Living' : 'Deceased'}
                {person.birthDate ? ` · b. ${person.birthDate}` : ''}
                {person.deathDate ? ` · d. ${person.deathDate}` : ''}
              </CardDescription>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-turquoise-500">
                {person.visibility}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
