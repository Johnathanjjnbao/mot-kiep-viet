import { z } from 'zod';
export const CREATOR_PLATFORMS = ['youtube', 'tiktok'] as const;
export const CREATOR_NICHES = [
  'education',
  'entertainment',
  'conversation',
  'gaming',
  'performance',
  'selling',
] as const;
export const creatorPolicySchema = z
  .object({
    format: z.enum(['video', 'live']),
    rhythm: z.enum(['light', 'steady', 'intense']),
    focus: z.enum(['craft', 'community', 'reach']),
    niche: z.enum(CREATOR_NICHES),
  })
  .strict();
export type CreatorPolicy = z.infer<typeof creatorPolicySchema>;
export const creatorActionSchema = z
  .object({
    type: z.literal('creator'),
    operation: z.enum(['start', 'policy', 'equipment', 'apply', 'pause', 'resume', 'close']),
    expected: z.number().int().min(0).max(511),
    id: z.enum(['creator:0', 'creator:1', 'creator:2', 'creator:3']).optional(),
    platform: z.enum(CREATOR_PLATFORMS).optional(),
    policy: creatorPolicySchema.optional(),
  })
  .strict()
  .superRefine((a, ctx) => {
    const fields =
      a.operation === 'start'
        ? ['platform', 'policy']
        : a.operation === 'policy'
          ? ['id', 'policy']
          : ['id'];
    for (const key of ['id', 'platform', 'policy'] as const)
      if (fields.includes(key) !== (a[key] !== undefined))
        ctx.addIssue({
          code: 'custom',
          message: 'Thông số không đúng thao tác kênh.',
          path: [key],
        });
  });
export type CreatorAction = z.infer<typeof creatorActionSchema>;
export const CREATOR_OPERATIONS = [
  'craft',
  'community',
  'reach',
  'rest',
  'apply',
  'accept',
  'decline',
  'reflect',
] as const;
export type CreatorOperation = (typeof CREATOR_OPERATIONS)[number];
export interface CreatorMonth {
  month: number;
  audience: number;
  gained: number;
  lost: number;
  published: number;
  viral: boolean;
  platformIncome: number;
  sponsorIncome: number;
  cost: number;
  profit: number;
}
export interface CreatorChannel {
  id: string;
  owner: string;
  platform: (typeof CREATOR_PLATFORMS)[number];
  startedMonth: number;
  settledThrough: number;
  closedMonth: number | null;
  status: 'active' | 'paused' | 'closed';
  pauseReason: 'manual' | 'funds' | 'burnout' | 'eligibility' | null;
  audience: number;
  engagement: number;
  reputation: number;
  quality: number;
  skill: number;
  equipment: number;
  burnout: number;
  policy: CreatorPolicy;
  monetization: 'none' | 'pending' | 'approved' | 'rejected';
  appliedMonth: number | null;
  sponsor: { remaining: number; fee: number } | null;
  totals: { platformIncome: number; sponsorIncome: number; cost: number; published: number };
  recent: CreatorMonth[];
}
export interface CreatorEconomy {
  channels: CreatorChannel[];
  lastSceneMonth: number;
}
