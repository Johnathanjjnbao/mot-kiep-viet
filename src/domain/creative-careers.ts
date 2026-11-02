import { z } from 'zod';
import type { ArtisticCareer } from './artistic';
import type { CreatorChannel } from './creator-economy';

export const GAMING_POLICIES = ['practice', 'community', 'competition', 'rest'] as const;
export type GamingPolicy = (typeof GAMING_POLICIES)[number];
export const COLLAB_PEERS = ['patient-teacher', 'club-host', 'stage-editor'] as const;
export type CollabPeer = (typeof COLLAB_PEERS)[number];
export const COLLAB_TERMS = ['balanced', 'flexible', 'exclusive'] as const;
export type CollabTerms = (typeof COLLAB_TERMS)[number];
export interface GamingRound {
  id: string;
  enteredMonth: number;
  resolvedMonth: number | null;
  dueMonth: number;
  entryFee: number;
  prize: number;
  result: 'pending' | 'won' | 'placed' | 'lost' | 'cancelled';
}
export interface GamingCareer {
  channelId: string;
  startedMonth: number;
  endedMonth: number | null;
  status: 'active' | 'resting' | 'retired';
  policy: GamingPolicy;
  skill: number;
  community: number;
  retention: number;
  fatigue: number;
  totals: { training: number; entries: number; prizes: number };
  rounds: GamingRound[];
  recent: {
    month: number;
    skill: number;
    community: number;
    retention: number;
    fatigue: number;
    cost: number;
  }[];
}
export interface CreatorCollaboration {
  id: string;
  channelId: string;
  peer: CollabPeer;
  createdMonth: number;
  status: 'proposal' | 'offered' | 'working' | 'settled' | 'rejected' | 'cancelled';
  terms: CollabTerms | null;
  dueMonth: number;
  closedMonth: number | null;
  overlap: number;
  compatibility: number;
  quality: number;
  audienceDelta: number;
  cost: number;
  outcome: string;
}
export interface CreativeCareers {
  artist: ArtisticCareer | null;
  owner: string;
  settledThrough: number;
  gaming: GamingCareer | null;
  collaborations: CreatorCollaboration[];
}
export const creativeActionSchema = z
  .object({
    type: z.literal('creative'),
    operation: z.enum([
      'gaming-start',
      'gaming-policy',
      'gaming-contest',
      'gaming-retire',
      'collab-inquire',
      'collab-negotiate',
      'collab-accept',
      'collab-cancel',
    ]),
    expected: z.number().int().min(0).max(511),
    channelId: z.enum(['creator:0', 'creator:1', 'creator:2', 'creator:3']).optional(),
    id: z
      .string()
      .regex(/^collab:[0-5]$/)
      .optional(),
    policy: z.enum(GAMING_POLICIES).optional(),
    peer: z.enum(COLLAB_PEERS).optional(),
    terms: z.enum(COLLAB_TERMS).optional(),
  })
  .strict()
  .superRefine((a, ctx) => {
    const fields: readonly string[] = {
      'gaming-start': ['channelId'],
      'gaming-policy': ['policy'],
      'gaming-contest': [],
      'gaming-retire': [],
      'collab-inquire': ['channelId', 'peer'],
      'collab-negotiate': ['id', 'terms'],
      'collab-accept': ['id'],
      'collab-cancel': ['id'],
    }[a.operation];
    for (const key of ['channelId', 'id', 'policy', 'peer', 'terms'] as const)
      if (fields.includes(key) !== (a[key] !== undefined))
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'Thông số không đúng thao tác nghề sáng tạo.',
        });
  });
export type CreativeAction = z.infer<typeof creativeActionSchema>;
export const CREATIVE_STORY_OPERATIONS = [
  'gaming-practice',
  'gaming-community',
  'gaming-retention',
  'gaming-rest',
  'gaming-contest',
  'gaming-retire',
  'collab-balanced',
  'collab-flexible',
  'collab-exclusive',
  'collab-accept',
  'collab-cancel',
  'collab-polish',
  'collab-protect',
  'collab-wait',
] as const;
export type CreativeStoryOperation = (typeof CREATIVE_STORY_OPERATIONS)[number];
export type GamingChannel = Pick<CreatorChannel, 'id' | 'status' | 'policy' | 'equipment'>;
