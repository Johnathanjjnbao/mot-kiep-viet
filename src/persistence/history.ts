import { openDB } from 'idb';
import { z } from 'zod';
import type { GameRun } from '../domain/model';
import { lifeSummary } from '../application/summary';
import { canonical, parseSave, snapshot } from './saves';
export interface LifeRecord {
  id: string;
  createdAt: string;
  save: ReturnType<typeof snapshot>;
  memoir: string;
}
const db = () =>
  openDB('mot-kiep-viet-history', 1, {
    upgrade(d) {
      d.createObjectStore('lives', { keyPath: 'id' });
    },
  });
const recordSchema = z
  .object({
    id: z.uuid(),
    createdAt: z.iso.datetime(),
    save: z.unknown(),
    memoir: z.string().min(1).max(10000),
  })
  .strict();
export const MAX_HISTORY_BYTES = 20 * 1024 * 1024,
  MAX_RECORDS = 50;
function validated(raw: unknown): LifeRecord {
  const r = recordSchema.parse(raw),
    save = parseSave(JSON.stringify(r.save));
  if (save.run.status !== 'ended') throw new Error('Chỉ lưu cuộc đời đã kết thúc vào lịch sử.');
  if (save.identity && save.identity !== r.id) throw new Error('Mã lịch sử không khớp bản lưu.');
  if (r.memoir !== lifeSummary(save.run).biography)
    throw new Error('Hồi ký không khớp dữ liệu cuộc đời.');
  return { ...r, save };
}
export async function listHistory(): Promise<LifeRecord[]> {
  const d = await db();
  try {
    return (await d.getAll('lives'))
      .map(validated)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } finally {
    d.close();
  }
}
function same(a: LifeRecord, b: LifeRecord) {
  return a.memoir === b.memoir && canonical(a.save.run) === canonical(b.save.run);
}
async function insert(records: LifeRecord[]) {
  const d = await db();
  try {
    const tx = d.transaction('lives', 'readwrite');
    void tx.done.catch(() => undefined); // Abort has its own rejection; the caller receives our specific error.
    for (const r of records) {
      const existing = await tx.store.get(r.id);
      if (existing && !same(existing, r)) {
        tx.abort();
        throw new Error('Trùng mã nhưng nội dung khác; không ghi đè lịch sử.');
      }
    }
    const count = await tx.store.count(),
      newRecords = [];
    for (const r of records)
      if (!(await tx.store.get(r.id))) {
        newRecords.push(r);
        await tx.store.add(r);
      }
    if (count + newRecords.length > MAX_RECORDS) {
      tx.abort();
      throw new Error('Lịch sử đã đạt 50 cuộc đời. Hãy xuất bản sao; bản cũ được giữ nguyên.');
    }
    await tx.done;
  } finally {
    d.close();
  }
}
export async function archiveLife(run: GameRun, identity: string) {
  if (run.status !== 'ended') throw new Error('Cuộc đời chưa kết thúc.');
  const record: LifeRecord = {
    id: z.uuid().parse(identity),
    createdAt: new Date().toISOString(),
    save: snapshot(run, identity),
    memoir: lifeSummary(run).biography,
  };
  await insert([record]);
  return record;
}
export function exportHistory(records: LifeRecord[]) {
  return JSON.stringify({ format: 'mot-kiep-viet-history', version: 1, records });
}
export async function importHistory(text: string) {
  if (new TextEncoder().encode(text).length > MAX_HISTORY_BYTES)
    throw new Error('Tệp lịch sử vượt 20 MiB.');
  const input = z
    .object({
      format: z.literal('mot-kiep-viet-history'),
      version: z.literal(1),
      records: z.array(z.unknown()).max(MAX_RECORDS),
    })
    .strict()
    .parse(JSON.parse(text));
  const records = input.records.map(validated);
  if (new Set(records.map((r) => r.id)).size !== records.length)
    throw new Error('Tệp có mã lịch sử trùng.');
  await insert(records);
  return records.length;
}
