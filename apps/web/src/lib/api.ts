import type { FamilySummary, PersonSummary, PersonVisibility } from '@aomlegacy/shared';
import { assertOnline } from '@/lib/offline';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:8080/api';

export interface HealthResponse {
  status: string;
  service: string;
  database?: string;
  ai?: string;
  timestamp: string;
}

export interface AiHealthResponse {
  status: 'ok' | 'unconfigured' | 'error';
  provider: 'anthropic';
  model: string;
  message: string;
}

export interface PlatformHealth {
  api: HealthResponse | null;
  ai: AiHealthResponse | null;
  checkedAt: string;
}

export const TOKEN_KEY = 'bizimkiler.token';
export const USER_KEY = 'bizimkiler.user';

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

function authHeader(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  const token = window.localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<T> {
  const bearer = token ? { Authorization: `Bearer ${token}` } : authHeader();
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...bearer, ...init?.headers },
    });
  } catch {
    throw new Error(
      typeof navigator !== 'undefined' && !navigator.onLine
        ? 'You are offline. Showing cached data when available.'
        : `Network error talking to ${path}. Check your connection and try again.`,
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      detail = Array.isArray(body.message)
        ? body.message.join(', ')
        : (body.message ?? '');
    } catch {
      // response had no JSON body
    }
    throw new Error(
      `Request to ${path} failed with status ${response.status}${detail ? `: ${detail}` : ''}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function fetchJson<T>(path: string, revalidateSeconds = 30): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchApiHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>('/health');
}

export async function fetchAiHealth(): Promise<AiHealthResponse> {
  return fetchJson<AiHealthResponse>('/ai/health');
}

export async function fetchPlatformHealth(): Promise<PlatformHealth> {
  const checkedAt = new Date().toISOString();

  const [apiResult, aiResult] = await Promise.allSettled([
    fetchApiHealth(),
    fetchAiHealth(),
  ]);

  return {
    api: apiResult.status === 'fulfilled' ? apiResult.value : null,
    ai: aiResult.status === 'fulfilled' ? aiResult.value : null,
    checkedAt,
  };
}

export async function login(email: string, password: string): Promise<AuthSession> {
  assertOnline('sign in');
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  displayName: string,
  password: string,
): Promise<AuthSession> {
  assertOnline('create an account');
  return request<AuthSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, displayName, password }),
  });
}

export async function fetchFamilies(): Promise<FamilySummary[]> {
  return request<FamilySummary[]>('/families', { cache: 'no-store' });
}

export async function fetchFamily(id: string, token?: string): Promise<FamilySummary> {
  return request<FamilySummary>(`/families/${id}`, { cache: 'no-store' }, token);
}

export async function createFamily(name: string): Promise<FamilySummary> {
  assertOnline('create a family');
  return request<FamilySummary>('/families', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function fetchPeople(
  familyId: string,
  token?: string,
): Promise<PersonSummary[]> {
  return request<PersonSummary[]>(
    `/people?familyId=${encodeURIComponent(familyId)}`,
    { cache: 'no-store' },
    token,
  );
}

export async function fetchPerson(id: string, token?: string): Promise<PersonSummary> {
  return request<PersonSummary>(`/people/${id}`, { cache: 'no-store' }, token);
}

export interface CreatePersonInput {
  familyId: string;
  displayName: string;
  birthDate?: string | undefined;
  deathDate?: string | undefined;
  visibility?: PersonVisibility | undefined;
}

export async function createPerson(
  input: CreatePersonInput,
): Promise<PersonSummary> {
  assertOnline('add a person');
  return request<PersonSummary>('/people', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export interface MemorySummary {
  id: string;
  familyId: string;
  authorUserId: string;
  authorName: string;
  caption: string;
  memoryDate?: string;
  createdAt: string;
  photoUrl: string;
  reactionCount: number;
  userReacted: boolean;
  commentCount: number;
}

export interface MemoryCommentSummary {
  id: string;
  memoryId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface InviteSummary {
  id: string;
  familyId: string;
  email: string;
  relationship: string;
  inviteToken: string;
  createdAt: string;
}

export interface MemberSummary {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  relationship: string;
  joinedAt: string;
}

export interface RelationshipSummary {
  id: string;
  familyId: string;
  type: 'parent' | 'spouse' | 'partner';
  fromPersonId: string;
  toPersonId: string;
  startDate?: string;
}

export function memoryPhotoUrl(memoryId: string): string {
  return `${apiBaseUrl}/memories/${memoryId}/photo`;
}

export async function fetchMemories(familyId: string): Promise<MemorySummary[]> {
  return request<MemorySummary[]>(
    `/memories?familyId=${encodeURIComponent(familyId)}`,
    { cache: 'no-store' },
  );
}

export async function fetchMemory(id: string): Promise<MemorySummary> {
  return request<MemorySummary>(`/memories/${id}`, { cache: 'no-store' });
}

export async function uploadMemory(
  familyId: string,
  caption: string,
  file: File,
  memoryDate?: string,
): Promise<MemorySummary> {
  assertOnline('upload a memory');
  const form = new FormData();
  form.append('familyId', familyId);
  form.append('caption', caption);
  form.append('photo', file);
  if (memoryDate) form.append('memoryDate', memoryDate);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/memories`, {
      method: 'POST',
      headers: authHeader(),
      body: form,
    });
  } catch {
    throw new Error('Network error during upload. Check your connection and try again.');
  }

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  return response.json() as Promise<MemorySummary>;
}

export async function fetchMembers(familyId: string): Promise<MemberSummary[]> {
  return request<MemberSummary[]>(`/families/${familyId}/members`, { cache: 'no-store' });
}

export async function fetchInvites(familyId: string): Promise<InviteSummary[]> {
  return request<InviteSummary[]>(`/families/${familyId}/invites`, { cache: 'no-store' });
}

export async function createInvite(
  familyId: string,
  email: string,
  relationship: string,
): Promise<InviteSummary> {
  assertOnline('send an invite');
  return request<InviteSummary>('/invites', {
    method: 'POST',
    body: JSON.stringify({ familyId, email, relationship }),
  });
}

export async function cancelInvite(inviteId: string): Promise<void> {
  assertOnline('cancel an invite');
  await request<void>(`/invites/${inviteId}`, { method: 'DELETE' });
}

export async function acceptInvite(token: string): Promise<{ familyId: string }> {
  assertOnline('accept an invite');
  return request<{ familyId: string }>('/invites/accept', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function fetchRelationships(familyId: string): Promise<RelationshipSummary[]> {
  return request<RelationshipSummary[]>(
    `/relationships?familyId=${encodeURIComponent(familyId)}`,
    { cache: 'no-store' },
  );
}

export async function toggleMemoryReaction(memoryId: string): Promise<void> {
  assertOnline('react to a memory');
  await request<void>(`/memories/${memoryId}/reactions/toggle`, { method: 'POST' });
}

export async function fetchMemoryComments(memoryId: string): Promise<MemoryCommentSummary[]> {
  return request<MemoryCommentSummary[]>(`/memories/${memoryId}/comments`, {
    cache: 'no-store',
  });
}

export async function addMemoryComment(memoryId: string, body: string): Promise<void> {
  assertOnline('add a comment');
  await request<void>(`/memories/${memoryId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export { apiBaseUrl };
