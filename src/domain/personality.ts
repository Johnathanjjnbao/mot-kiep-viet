import { z } from 'zod';

export const PLAYER_PERSONALITIES = [
  'Hay tò mò',
  'Kiên trì',
  'Dễ gần',
  'Ưa yên tĩnh',
  'Thích giúp đỡ',
  'Khéo tay',
] as const;
export type PlayerPersonality = (typeof PLAYER_PERSONALITIES)[number];
export const playerPersonalitySchema = z
  .array(z.enum(PLAYER_PERSONALITIES))
  .min(1)
  .max(3)
  .refine(
    (traits) =>
      new Set(traits).size === traits.length &&
      !(traits.includes('Dễ gần') && traits.includes('Ưa yên tĩnh')),
    'Chọn 1–3 tính cách; Dễ gần và Ưa yên tĩnh không kết hợp.',
  );
