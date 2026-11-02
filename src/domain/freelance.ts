import { z } from 'zod';
export const SERVICES = [
  'programming',
  'design',
  'translation',
  'writing',
  'marketing',
  'support',
] as const;
export type FreelanceService = (typeof SERVICES)[number];
export const PROJECT_POLICIES = ['steady', 'careful', 'rush', 'rest'] as const;
export type ProjectPolicy = (typeof PROJECT_POLICIES)[number];
export type ProjectTerms = 'modest' | 'standard' | 'premium';
export type ProjectStatus =
  'inquiry' | 'offered' | 'working' | 'ready' | 'review' | 'rework' | 'payment' | 'closed';
export type ProjectEnding =
  'paid' | 'partial' | 'rejected' | 'declined' | 'failed' | 'expired' | 'unpaid' | 'death';
export interface ClientProject {
  id: string;
  owner: string;
  client: string;
  service: FreelanceService;
  createdMonth: number;
  acceptedMonth: number | null;
  closedMonth: number | null;
  paidMonth: number | null;
  status: ProjectStatus;
  ending: ProjectEnding | null;
  terms: ProjectTerms | null;
  policy: ProjectPolicy;
  fee: number;
  amountDue: number;
  progress: number;
  requiredMonths: number;
  workMonths: number;
  stalledMonths: number;
  quality: number;
  reviewAttempts: number;
  reworkUsed: boolean;
  lateUsed: boolean;
  deadlineMonth: number;
  reviewDue: number | null;
  paymentDue: number | null;
  totals: { cost: number; received: number };
  milestones: { month: number; status: ProjectStatus; text: string }[];
}
export interface FreelanceState {
  owner: string;
  settledThrough: number;
  reputation: number;
  projects: ClientProject[];
}
export const FREELANCE_OPERATIONS = [
  'inquire',
  'negotiate',
  'accept',
  'policy',
  'deliver',
  'revise',
  'settle',
  'close',
] as const;
export const freelanceActionSchema = z
  .object({
    type: z.literal('freelance'),
    operation: z.enum(FREELANCE_OPERATIONS),
    expected: z.number().int().min(0).max(511),
    id: z
      .string()
      .regex(/^freelance:[0-3]$/)
      .optional(),
    service: z.enum(SERVICES).optional(),
    terms: z.enum(['modest', 'standard', 'premium']).optional(),
    policy: z.enum(PROJECT_POLICIES).optional(),
  })
  .strict()
  .refine((a) => {
    const fields = [
      a.id !== undefined,
      a.service !== undefined,
      a.terms !== undefined,
      a.policy !== undefined,
    ];
    const expected =
      a.operation === 'inquire'
        ? [false, true, false, false]
        : a.operation === 'negotiate'
          ? [true, false, true, false]
          : a.operation === 'policy'
            ? [true, false, false, true]
            : [true, false, false, false];
    return fields.every((v, i) => v === expected[i]);
  }, 'Thông số không khớp thao tác hợp đồng.');
export type FreelanceAction = z.infer<typeof freelanceActionSchema>;
export const FREELANCE_STORY_OPERATIONS = [
  'quote-modest',
  'quote-standard',
  'quote-premium',
  'accept-careful',
  'accept-rush',
  'polish',
  'wait',
  'steady',
  'careful',
  'rush',
  'rest',
  'accept',
  'deliver',
  'revise',
  'settle',
  'close',
] as const;
export type FreelanceStoryOperation = (typeof FREELANCE_STORY_OPERATIONS)[number];
