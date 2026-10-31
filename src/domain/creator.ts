import { z } from 'zod';
import type { GameRun, ParentTrait } from './model';
import { playerPersonalitySchema } from './personality';
export const PARENT_TRAITS: Record<ParentTrait, string> = {
  gentle: 'Dịu dàng',
  strict: 'Nghiêm khắc',
  easygoing: 'Dễ tính',
  ambitious: 'Tham vọng',
  frugal: 'Tiết kiệm',
  generous: 'Phóng khoáng',
  anxious: 'Hay lo lắng',
  adventurous: 'Thích phiêu lưu',
  distant: 'Khó gần',
  academic: 'Quan tâm việc học',
};
export const WEALTH = ['Nghèo khó', 'Thu nhập thấp', 'Trung lưu', 'Khá giả', 'Giàu có'];
export const FAMILIES = {
  both: 'Có cả cha và mẹ cùng chăm sóc',
  'father-only': 'Chỉ có cha',
  'mother-only': 'Chỉ có mẹ',
  'with-father': 'Cha mẹ ly thân/ly hôn, sống với cha',
  'with-mother': 'Cha mẹ ly thân/ly hôn, sống với mẹ',
};
const traits = z
  .array(
    z.enum([
      'gentle',
      'strict',
      'easygoing',
      'ambitious',
      'frugal',
      'generous',
      'anxious',
      'adventurous',
      'distant',
      'academic',
    ]),
  )
  .max(3)
  .refine(
    (t) =>
      new Set(t).size === t.length &&
      !['strict,easygoing', 'frugal,generous', 'gentle,distant'].some((pair) =>
        pair.split(',').every((x) => t.includes(x as ParentTrait)),
      ),
    'Chọn tối đa 3 tính cách tương thích; nghiêm khắc/dễ tính, tiết kiệm/phóng khoáng, dịu dàng/khó gần không kết hợp.',
  );
const label = z
  .string()
  .trim()
  .normalize()
  .min(1)
  .max(80)
  .refine(
    (s) =>
      !Array.from(s).some(
        (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 || c === '<' || c === '>',
      ),
    'Không dùng ký tự điều khiển hoặc dấu < >.',
  );
export const setupSchema = z
  .object({
    lifeRules: z.enum(['dynamic-v1', 'education-v1', 'career-v1']).optional(),
    expansion: z.enum(['wardrobe', 'social', 'family']).optional(),
    cohort: z.number().int().min(1975).max(2026),
    region: z.enum(['southern-city', 'northern-village', 'central-coast']),
    name: label.optional(),
    birthplace: label.optional(),
    environment: z.enum(['urban', 'rural']).optional(),
    wealth: z
      .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .optional(),
    family: z.enum(['both', 'father-only', 'mother-only', 'with-father', 'with-mother']).optional(),
    motherTraits: traits.optional(),
    fatherTraits: traits.optional(),
    playerTraits: playerPersonalitySchema.optional(),
  })
  .strict();
export const birthplaceOf = (r: GameRun) =>
  r.setup.birthplace ??
  {
    'southern-city': 'Đô thị phía Nam',
    'northern-village': 'Nông thôn phía Bắc',
    'central-coast': 'Duyên hải miền Trung',
  }[r.player.region];
export function parentAvailable(r: GameRun, id: string) {
  return r.npcs.some(
    (n) => n.id === id && n.alive && n.presence !== 'unknown' && n.presence !== 'deceased',
  );
}
export function residentParents(r: GameRun) {
  return r.npcs.filter(
    (n) => ['father', 'mother'].includes(n.id) && n.alive && n.presence === 'resident',
  );
}
export function familyText(r: GameRun) {
  return r.setup.family ? FAMILIES[r.setup.family] : 'Có cả cha và mẹ cùng chăm sóc';
}
