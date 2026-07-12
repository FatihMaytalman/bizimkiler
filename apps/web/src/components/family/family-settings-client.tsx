'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  cancelInvite,
  createInvite,
  fetchInvites,
  fetchMembers,
} from '@/lib/api';
import { getSiteUrl } from '@/lib/urls';

const RELATIONSHIPS = [
  'mother',
  'father',
  'sister',
  'brother',
  'spouse',
  'son',
  'daughter',
  'grandmother',
  'grandfather',
  'aunt',
  'uncle',
  'cousin',
  'in_law',
  'other',
] as const;

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-cream-50 focus:border-gold-500/60 focus:outline-none';

interface FamilySettingsClientProps {
  familyId: string;
}

export function FamilySettingsClient({ familyId }: FamilySettingsClientProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<string>('other');
  const siteUrl = getSiteUrl();

  const membersQuery = useQuery({
    queryKey: ['members', familyId],
    queryFn: () => fetchMembers(familyId),
  });

  const invitesQuery = useQuery({
    queryKey: ['invites', familyId],
    queryFn: () => fetchInvites(familyId),
  });

  const inviteMutation = useMutation({
    mutationFn: () => createInvite(familyId, email.trim(), relationship),
    onSuccess: () => {
      setEmail('');
      void queryClient.invalidateQueries({ queryKey: ['invites', familyId] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (inviteId: string) => cancelInvite(inviteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invites', familyId] });
    },
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardTitle>Invite family</CardTitle>
        <CardDescription>
          Send an email invite with a relationship label. Share the invite link after creating it.
        </CardDescription>
        <form
          className="mt-4 grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            inviteMutation.mutate();
          }}
        >
          <input
            type="email"
            className={inputClass}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            className={inputClass}
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
          >
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {r.replace('_', ' ')}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={inviteMutation.isPending}>
            Send invite
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Members ({membersQuery.data?.length ?? 0})</CardTitle>
        <ul className="mt-4 space-y-2 text-sm text-warm-white/80">
          {(membersQuery.data ?? []).map((member) => (
            <li key={member.id} className="flex justify-between border-b border-white/5 pb-2">
              <span>
                {member.displayName} · {member.relationship}
              </span>
              <span className="text-warm-white/50">{member.role}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Pending invites</CardTitle>
        <ul className="mt-4 space-y-3 text-sm">
          {(invitesQuery.data ?? []).map((invite) => (
            <li key={invite.id} className="rounded-xl border border-white/10 p-3">
              <p className="text-cream-50">
                {invite.email} · {invite.relationship}
              </p>
              <p className="mt-1 break-all text-warm-white/60">
                {siteUrl}/invite/{invite.inviteToken}
              </p>
              <Button
                variant="ghost"
                className="mt-2"
                onClick={() => cancelMutation.mutate(invite.id)}
              >
                Cancel
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
