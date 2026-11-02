import { z } from 'zod';
export const ART_DISCIPLINES = ['music', 'dance', 'acting'] as const;
export type ArtDiscipline = (typeof ART_DISCIPLINES)[number];
export const ART_POLICIES = ['technique', 'stage', 'community', 'rest'] as const;
export type ArtPolicy = (typeof ART_POLICIES)[number];
export const AGENCY_TERMS = ['balanced', 'fast-track'] as const;
export type AgencyTerms = (typeof AGENCY_TERMS)[number];
export interface ArtAudition {
  id: string;
  appliedMonth: number;
  dueMonth: number;
  resolvedMonth: number | null;
  terms: AgencyTerms;
  result: 'pending' | 'offered' | 'rejected' | 'accepted' | 'declined' | 'expired';
}
export interface ArtShow {
  id: string;
  month: number;
  quality: number;
  gross: number;
  agencyCut: number;
  received: number;
  cost: number;
  fansDelta: number;
}
export interface ArtisticCareer {
  id: 'artist:0';
  owner: string;
  discipline: ArtDiscipline;
  startedMonth: number;
  settledThrough: number;
  readyMonth: number;
  status: 'training' | 'audition' | 'offered' | 'active' | 'resting' | 'retired';
  policy: ArtPolicy;
  management: 'independent' | 'agency' | null;
  agencyTerms: AgencyTerms | null;
  agencyThroughMonth: number | null;
  skill: number;
  presence: number;
  fans: number;
  reputation: number;
  burnout: number;
  trainingMonths: number;
  endedMonth: number | null;
  comebackUsed: boolean;
  showCount: number;
  auditions: ArtAudition[];
  invoices: ArtShow[];
  recent: ArtShow[];
  totals: {
    training: number;
    stage: number;
    audition: number;
    comeback: number;
    gross: number;
    agencyCut: number;
    received: number;
    shows: number;
  };
}
export const artisticActionSchema = z
  .object({
    type: z.literal('artistic'),
    operation: z.enum([
      'start',
      'policy',
      'audition',
      'accept',
      'decline',
      'independent',
      'retire',
      'comeback',
    ]),
    expected: z.number().int().min(0).max(511),
    discipline: z.enum(ART_DISCIPLINES).optional(),
    policy: z.enum(ART_POLICIES).optional(),
    terms: z.enum(AGENCY_TERMS).optional(),
  })
  .strict()
  .superRefine((a, ctx) => {
    const field =
      a.operation === 'start'
        ? 'discipline'
        : a.operation === 'policy'
          ? 'policy'
          : a.operation === 'audition'
            ? 'terms'
            : null;
    for (const key of ['discipline', 'policy', 'terms'] as const)
      if ((key === field) !== (a[key] !== undefined))
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'Thông số không đúng thao tác biểu diễn.',
        });
  });
export type ArtisticAction = z.infer<typeof artisticActionSchema>;
export const ART_STORY_OPERATIONS = [
  'technique',
  'stage',
  'community',
  'rest',
  'audition-balanced',
  'audition-fast-track',
  'accept',
  'decline',
  'independent',
  'retire',
  'comeback',
  'credit',
  'apologize',
  'reflect',
] as const;
export type ArtStoryOperation = (typeof ART_STORY_OPERATIONS)[number];
