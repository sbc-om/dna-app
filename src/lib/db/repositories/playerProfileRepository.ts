import { getDatabase, generateId } from '../lmdb';
import type { PlayerBadgeId } from '@/lib/player/badges';

export type PlayerAssessmentStatus =
  | 'new'
  | 'first_assessment_completed'
  | 'reassessment'
  | 'due_for_reassessment';

export type PlayerBadgeGrant = {
  badgeId: PlayerBadgeId;
  grantedAt: string;
  grantedBy: string;
  notes?: string;
};

export type PlayerPointsEventType = 'first_assessment' | 'reassessment' | 'badge_granted';

export type PlayerPointsEvent = {
  id: string;
  type: PlayerPointsEventType;
  points: number;
  createdAt: string;
  createdBy?: string;
  meta?: Record<string, unknown>;
};

export interface PlayerProfile {
  id: string;
  academyId: string;
  userId: string;

  assessmentStatus: PlayerAssessmentStatus;
  lastAssessmentAt?: string;

  identityKey?: string;

  /** Total points earned by the player (motivational / achievements). */
  pointsTotal: number;
  /** Points history (motivational / achievements). */
  pointsEvents: PlayerPointsEvent[];

  badges: PlayerBadgeGrant[];

  createdAt: string;
  updatedAt: string;
}

const PROFILE_PREFIX = 'player_profile:'; // player_profile:{academyId}:{userId}

function profileKey(academyId: string, userId: string) {
  return `${PROFILE_PREFIX}${academyId}:${userId}`;
}

export async function getPlayerProfile(academyId: string, userId: string): Promise<PlayerProfile | null> {
  const db = getDatabase();
  const key = profileKey(academyId, userId);
  const existing = await db.get(key);
  if (!existing) return null;
  return normalizeProfile(existing as Record<string, unknown>, key);
}

export async function putPlayerProfile(profile: PlayerProfile): Promise<PlayerProfile> {
  const db = getDatabase();
  await db.put(profileKey(profile.academyId, profile.userId), profile);
  return profile;
}

function normalizeProfile(input: Record<string, unknown>, key?: string): PlayerProfile {
  // Backward-compat: older records used xpTotal/xpEvents.
  const legacyTotal = typeof (input as any).xpTotal === 'number' ? (input as any).xpTotal : undefined;
  const legacyEvents = Array.isArray((input as any).xpEvents) ? (input as any).xpEvents : undefined;

  const pointsTotal = typeof (input as any).pointsTotal === 'number'
    ? (input as any).pointsTotal
    : (typeof legacyTotal === 'number' ? legacyTotal : 0);
  const pointsEventsRaw = Array.isArray((input as any).pointsEvents)
    ? (input as any).pointsEvents
    : (Array.isArray(legacyEvents) ? legacyEvents : []);

  const pointsEvents: PlayerPointsEvent[] = pointsEventsRaw
    .filter((e: any) => e && typeof e === 'object')
    .map((e: any) => ({
      id: typeof e.id === 'string' ? e.id : generateId(),
      type: e.type as PlayerPointsEventType,
      points: typeof e.points === 'number' ? e.points : 0,
      createdAt: typeof e.createdAt === 'string' ? e.createdAt : new Date().toISOString(),
      createdBy: typeof e.createdBy === 'string' ? e.createdBy : undefined,
      meta: e.meta && typeof e.meta === 'object' ? e.meta : undefined,
    }));

  const normalized: PlayerProfile = {
    ...(input as any),
    pointsTotal,
    pointsEvents,
  };

  // Strip legacy fields if present.
  delete (normalized as any).xpTotal;
  delete (normalized as any).xpEvents;

  const changed =
    pointsTotal !== (input as any).pointsTotal ||
    JSON.stringify(pointsEventsRaw) !== JSON.stringify((input as any).pointsEvents) ||
    'xpTotal' in input ||
    'xpEvents' in input;

  if (changed && key) {
    const db = getDatabase();
    db.put(key, normalized);
  }

  return normalized;
}

export async function createDefaultPlayerProfile(params: {
  academyId: string;
  userId: string;
  nowIso?: string;
}): Promise<PlayerProfile> {
  const now = params.nowIso ?? new Date().toISOString();

  const profile: PlayerProfile = {
    id: generateId(),
    academyId: params.academyId,
    userId: params.userId,

    assessmentStatus: 'new',
    lastAssessmentAt: undefined,

    identityKey: undefined,

    pointsTotal: 0,
    pointsEvents: [],

    badges: [],

    createdAt: now,
    updatedAt: now,
  };

  return putPlayerProfile(profile);
}

export async function ensurePlayerProfile(params: {
  academyId: string;
  userId: string;
}): Promise<PlayerProfile> {
  const existing = await getPlayerProfile(params.academyId, params.userId);
  if (existing) return existing;
  return createDefaultPlayerProfile({ academyId: params.academyId, userId: params.userId });
}

export async function updatePlayerProfile(
  academyId: string,
  userId: string,
  updates: Partial<Omit<PlayerProfile, 'id' | 'academyId' | 'userId' | 'createdAt'>>
): Promise<PlayerProfile> {
  const current = await ensurePlayerProfile({ academyId, userId });
  const updated: PlayerProfile = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return putPlayerProfile(updated);
}

export async function appendPointsEvent(params: {
  academyId: string;
  userId: string;
  event: Omit<PlayerPointsEvent, 'id' | 'createdAt'> & { id?: string; createdAt?: string };
  maxEvents?: number;
}): Promise<PlayerProfile> {
  const current = await ensurePlayerProfile({ academyId: params.academyId, userId: params.userId });
  const createdAt = params.event.createdAt ?? new Date().toISOString();
  const id = params.event.id ?? generateId();
  const nextEvent: PlayerPointsEvent = { ...params.event, id, createdAt };

  const max = params.maxEvents ?? 100;
  const nextEvents = [nextEvent, ...current.pointsEvents].slice(0, max);

  const nextTotal = current.pointsTotal + nextEvent.points;

  return putPlayerProfile({
    ...current,
    pointsTotal: nextTotal,
    pointsEvents: nextEvents,
    updatedAt: new Date().toISOString(),
  });
}

export async function grantBadge(params: {
  academyId: string;
  userId: string;
  badgeId: PlayerBadgeId;
  grantedBy: string;
  notes?: string;
}): Promise<PlayerProfile> {
  const current = await ensurePlayerProfile({ academyId: params.academyId, userId: params.userId });
  const already = current.badges.some((b) => b.badgeId === params.badgeId);
  if (already) return current;

  const nextBadges: PlayerBadgeGrant[] = [
    {
      badgeId: params.badgeId,
      grantedAt: new Date().toISOString(),
      grantedBy: params.grantedBy,
      notes: params.notes,
    },
    ...current.badges,
  ];

  const updated = await putPlayerProfile({
    ...current,
    badges: nextBadges,
    updatedAt: new Date().toISOString(),
  });

  return updated;
}
