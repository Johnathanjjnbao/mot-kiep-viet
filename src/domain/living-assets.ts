import { z } from 'zod';

export const PART_SLOTS = [
  'cpu',
  'board',
  'ram',
  'gpu',
  'storage',
  'psu',
  'case',
  'cooling',
  'display',
] as const;
export type PartSlot = (typeof PART_SLOTS)[number];
export type PcParts = Record<PartSlot, string>;
export type Locality = 'quiet' | 'connected' | 'central';
export type AssetCategory = 'home' | 'vehicle' | 'phone' | 'laptop' | 'pc';
export interface OwnedLivingAsset {
  id: string;
  catalogId: string;
  category: AssetCategory;
  owner: string;
  acquiredMonth: number;
  acquisitionPrice: number;
  condition: number;
  lastRepairMonth: number;
  upkeep: 'essential' | 'careful';
  region: string;
  locality: Locality;
  parts?: PcParts;
  partPrices?: Record<PartSlot, number>;
  partMonths?: Record<PartSlot, number>;
}
export interface AssetLoan {
  id: string;
  assetId: string;
  owner: string;
  original: number;
  principal: number;
  rateBps: number;
  months: number;
  startMonth: number;
  lateMonths: number;
  status: 'active' | 'paid' | 'shortfall';
  disposedMonth: number | null;
}
export interface RentalLease {
  id: string;
  catalogId: string;
  owner: string;
  region: string;
  locality: Locality;
  startMonth: number;
  rent: number;
  deposit: number;
  damage: number;
  reviewMonth: number;
  lastRenewMonth: number;
}
export interface LivingAssets {
  owned: OwnedLivingAsset[];
  loans: AssetLoan[];
  lease: RentalLease | null;
  residence: string | null;
  sequence: number;
  disposed: number;
  settledThrough: number;
  firsts: AssetCategory[];
}
const identifier = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9:_-]+$/);
const parts = z
  .object({
    cpu: identifier,
    board: identifier,
    ram: identifier,
    gpu: identifier,
    storage: identifier,
    psu: identifier,
    case: identifier,
    cooling: identifier,
    display: identifier,
  })
  .strict();
export const livingAssetActionSchema = z
  .object({
    type: z.literal('living-assets'),
    operation: z.enum([
      'repair-rental',
      'rent',
      'renew',
      'leave',
      'buy',
      'sell',
      'move',
      'repair',
      'repay',
      'train',
      'build',
      'upgrade',
      'upkeep',
    ]),
    expected: z.number().int().min(0).max(511),
    item: identifier.optional(),
    assetId: identifier.optional(),
    loanId: identifier.optional(),
    locality: z.enum(['quiet', 'connected', 'central']).optional(),
    payment: z.enum(['cash', 'loan']).optional(),
    parts: parts.optional(),
    slot: z.enum(PART_SLOTS).optional(),
    amount: z.number().int().min(1).max(10_000_000_000).optional(),
    policy: z.enum(['essential', 'careful']).optional(),
  })
  .strict()
  .superRefine((a, ctx) => {
    const fields: Record<typeof a.operation, string[]> = {
      'repair-rental': [],
      rent: ['item', 'locality'],
      renew: [],
      leave: [],
      buy: ['item', 'locality', 'payment'],
      sell: ['assetId'],
      move: ['assetId'],
      repair: ['assetId'],
      repay: ['loanId', 'amount'],
      train: ['item'],
      build: ['parts', 'payment'],
      upgrade: ['assetId', 'slot', 'item'],
      upkeep: ['assetId', 'policy'],
    };
    const optional = ['locality', 'payment'];
    for (const key of Object.keys(a))
      if (!['type', 'operation', 'expected'].includes(key) && !fields[a.operation].includes(key))
        ctx.addIssue({
          code: 'custom',
          message: 'Trường không thuộc thao tác tài sản.',
          path: [key],
        });
    for (const key of fields[a.operation])
      if (!optional.includes(key) && a[key as keyof typeof a] === undefined)
        ctx.addIssue({ code: 'custom', message: 'Thiếu dữ liệu thao tác tài sản.', path: [key] });
  });
export type LivingAssetAction = z.infer<typeof livingAssetActionSchema>;

export const LIVING_STORY_OPERATIONS = [
  'plan',
  'rental-pay',
  'rental-diy',
  'rental-note',
  'rental-defer',
  'care-home',
  'defer-home',
  'care-vehicle',
  'defer-vehicle',
  'care-phone',
  'defer-phone',
  'care-pc',
  'defer-pc',
  'extra-payment',
  'power-save',
  'power-normal',
] as const;
export type LivingStoryOperation = (typeof LIVING_STORY_OPERATIONS)[number];
