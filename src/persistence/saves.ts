import { parseSave as parseV2 } from '../legacy/v2/persistence/saves';
import { parseSave as parseLegacy } from '../legacy/v1/persistence/saves';
import { setupSchema } from '../domain/creator';
import { PROGRAM_IDS } from '../domain/academics';
import { openDB } from 'idb';
import { z } from 'zod';
import {
  CONTENT_VERSION,
  ENGINE_VERSION,
  SAVE_VERSION,
  type GameRun,
  type RunAction,
  type SaveSnapshot,
} from '../domain/model';
import { replay } from '../engine/engine';
import { assertRun } from '../engine/invariants';
export const MAX_SAVE_BYTES = 5 * 1024 * 1024;
const career = z.enum([
  'farm',
  'labor',
  'trade',
  'retail',
  'service',
  'office',
  'teacher',
  'tech',
  'freelance',
  'business',
]);
const action: z.ZodType<RunAction> = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('academic'),
      operation: z.enum(['apply', 'pause', 'resume', 'dropout', 'switch', 'term']),
      program: z.enum(PROGRAM_IDS).optional(),
      expected: z.number().int().min(0).max(511),
    })
    .strict()
    .refine((a) => (a.operation === 'apply' || a.operation === 'switch') === !!a.program),
  z.object({ type: z.literal('advance') }).strict(),
  z
    .object({
      type: z.literal('family-talk'),
      templateId: z.string().min(1).max(60),
      childId: z.string().min(1).max(60),
      expected: z.number().int().min(0).max(511),
    })
    .strict(),
  z
    .object({
      type: z.literal('social'),
      templateId: z.string().min(1).max(60),
      npcId: z.string().min(1).max(60),
      expected: z.number().int().min(0).max(511),
    })
    .strict(),
  z
    .object({
      type: z.literal('wardrobe'),
      operation: z.enum(['buy', 'equip', 'unequip', 'save-outfit', 'wear-outfit']),
      item: z.string().min(1).max(60),
      expected: z.number().int().min(0).max(511),
    })
    .strict(),
  z
    .object({
      type: z.literal('choose'),
      eventId: z.string().max(100),
      choiceId: z.string().max(100),
    })
    .strict(),
  z
    .object({
      type: z.literal('manage'),
      action: z.enum([
        'train-job',
        'temporary-job',
        'save-money',
        'withdraw-money',
        'borrow',
        'repay',
        'buy-home',
        'move-home',
        'apply-job',
        'quit-job',
      ]),
      career: career.optional(),
    })
    .strict(),
]);
const runHeader = z
  .object({
    seed: z.string().min(1).max(100),
    setup: setupSchema,
    actions: z.array(action).max(512),
    engineVersion: z.literal(ENGINE_VERSION),
    contentVersion: z.literal(CONTENT_VERSION),
  })
  .passthrough();
const envelope = z
  .object({
    identity: z.uuid().optional(),
    schemaVersion: z.literal(SAVE_VERSION),
    engineVersion: z.literal(ENGINE_VERSION),
    contentVersion: z.literal(CONTENT_VERSION),
    savedAt: z.iso.datetime(),
    run: runHeader,
  })
  .strict();
export function canonical(value: unknown, depth = 0): string {
  if (depth > 24) throw new Error('Cấu trúc tệp lưu quá sâu.');
  if (Array.isArray(value)) return `[${value.map((v) => canonical(v, depth + 1)).join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v, depth + 1)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
export function snapshot(run: GameRun, identity?: string): SaveSnapshot {
  return {
    schemaVersion:
      run.engineVersion === '1.0.0' ? 2 : run.engineVersion === '2.0.0' ? 3 : SAVE_VERSION,
    engineVersion: run.engineVersion,
    contentVersion: run.contentVersion,
    ...(identity ? { identity } : {}),
    savedAt: new Date().toISOString(),
    run: structuredClone(run),
  };
}
export function parseSave(text: string): SaveSnapshot {
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES)
    throw new Error('Tệp lưu vượt giới hạn 5 MiB.');
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Tệp không phải JSON hợp lệ.');
  }
  if (
    raw &&
    typeof raw === 'object' &&
    'schemaVersion' in raw &&
    [1, 2].includes(Number(raw.schemaVersion))
  ) {
    const { identity, ...legacy } = raw as Record<string, unknown>;
    if (identity !== undefined && !z.uuid().safeParse(identity).success)
      throw new Error('Mã bản lưu không hợp lệ.');
    return {
      ...parseLegacy(JSON.stringify(legacy)),
      ...(identity ? { identity: String(identity) } : {}),
    };
  }
  if (raw && typeof raw === 'object' && 'schemaVersion' in raw && raw.schemaVersion === 3)
    return parseV2(text);
  const parsed = envelope.safeParse(raw);
  if (!parsed.success)
    throw new Error('Tệp lưu bị thiếu dữ liệu hoặc không tương thích phiên bản hiện tại.');
  const header = parsed.data.run;
  let run: GameRun;
  try {
    run = replay(header.seed, header.setup, header.actions);
    assertRun(run);
  } catch {
    throw new Error('Không thể tái hiện chuỗi quyết định trong tệp lưu.');
  }
  if (canonical(run) !== canonical(header))
    throw new Error(
      'Trạng thái lưu không khớp lịch sử quyết định. Tệp có thể đã hỏng hoặc bị chỉnh sửa.',
    );
  return { ...parsed.data, run };
}
export type SaveKey = 'autosave' | 'slot-1' | 'slot-2' | 'slot-3';
const database = () =>
  openDB('mot-kiep-viet', 1, {
    upgrade(db) {
      db.createObjectStore('saves');
    },
  });
let pending: Promise<unknown> = Promise.resolve();
export function writeSave(key: SaveKey, run: GameRun, identity?: string): Promise<void> {
  const data = snapshot(run, identity);
  const write = pending
    .catch(() => undefined)
    .then(async () => {
      const db = await database();
      try {
        await db.put('saves', JSON.stringify(data), key);
      } finally {
        db.close();
      }
    });
  pending = write;
  return write;
}
export async function readSave(key: SaveKey): Promise<SaveSnapshot | null> {
  await pending.catch(() => undefined);
  const db = await database();
  let raw: unknown;
  try {
    raw = await db.get('saves', key);
  } finally {
    db.close();
  }
  if (raw === undefined) return null;
  if (typeof raw !== 'string') throw new Error('Ô lưu có dữ liệu hỏng.');
  return parseSave(raw);
}
export async function listSlots() {
  const keys: SaveKey[] = ['slot-1', 'slot-2', 'slot-3'];
  return Promise.all(
    keys.map(async (key) => {
      try {
        return { key, save: await readSave(key), error: null };
      } catch (error) {
        return {
          key,
          save: null,
          error: error instanceof Error ? error.message : 'Không đọc được ô lưu.',
        };
      }
    }),
  );
}
