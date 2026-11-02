import { z } from 'zod';
export type Presentation = 'boy' | 'girl';
export type DecisionActor = 'caregiver' | 'child' | 'player';
export interface HouseholdPosting {
  id: string;
  month: number;
  label: string;
  cash: number;
  personal: number;
}
export interface ChildhoodFinance {
  owner: string;
  cash: number;
  settledThrough: number;
  adultAccess: boolean;
  transactions: HouseholdPosting[];
}
export const minorActionSchema = z
  .object({
    type: z.literal('minor-finance'),
    operation: z.enum(['save', 'spend']),
    amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    expected: z.number().int().min(0).max(511),
  })
  .strict();
export type MinorAction = z.infer<typeof minorActionSchema>;
export type ChildMoneyOperation = 'gift' | 'earn' | 'save' | 'spend' | 'household-cost';
