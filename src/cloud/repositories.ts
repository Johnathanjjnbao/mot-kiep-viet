import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { parseSave, type SaveKey } from '../persistence/saves';
import { validateLifeRecord, type LifeRecord } from '../persistence/history';
import type { SaveSnapshot } from '../domain/model';
import {
  RevisionConflict,
  type CompletedLifeRepository,
  type HistoryCursor,
  type SaveRepository,
} from './contracts';
const slotSchema = z.enum(['autosave', 'slot-1', 'slot-2', 'slot-3']);
const rowSchema = z.object({
  user_id: z.uuid(),
  slot: slotSchema,
  life_id: z.uuid(),
  snapshot: z.unknown(),
  revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  updated_at: z.iso.datetime({ offset: true }),
});
const cursorSchema = z.object({ createdAt: z.iso.datetime({ offset: true }), lifeId: z.uuid() });
function checked(save: SaveSnapshot) {
  return parseSave(JSON.stringify(save));
}
function handle(error: { code?: string } | null) {
  if (error?.code === '40001' || error?.code === 'PT409') throw new RevisionConflict();
  if (error) throw new Error('Chưa đồng bộ được. Bản lưu trên thiết bị vẫn được giữ.');
}
export class CloudSaveRepository implements SaveRepository {
  constructor(
    private client: SupabaseClient,
    private userId: string,
  ) {
    z.uuid().parse(userId);
  }
  async list() {
    const { data, error } = await this.client
      .from('cloud_saves')
      .select('*')
      .eq('user_id', this.userId);
    handle(error);
    return z
      .array(rowSchema)
      .max(4)
      .parse(data)
      .map((r) => {
        if (r.user_id !== this.userId) throw new Error('Không khớp chủ sở hữu.');
        const save = checked(r.snapshot as SaveSnapshot);
        if (save.identity !== r.life_id) throw new Error('Mã cuộc đời không khớp.');
        return {
          slot: r.slot,
          lifeId: r.life_id,
          save,
          revision: r.revision,
          updatedAt: r.updated_at,
        };
      });
  }
  async write(slot: SaveKey, save: SaveSnapshot, expectedRevision: number, operationId: string) {
    const payload = checked(save);
    const { data, error } = await this.client.rpc('mkv_write_save', {
      p_slot: slotSchema.parse(slot),
      p_life_id: z.uuid().parse(payload.identity),
      p_snapshot: payload,
      p_expected_revision: z
        .number()
        .int()
        .min(0)
        .max(Number.MAX_SAFE_INTEGER - 1)
        .parse(expectedRevision),
      p_operation_id: z.uuid().parse(operationId),
    });
    handle(error);
    return z.number().int().positive().max(Number.MAX_SAFE_INTEGER).parse(data);
  }
}
export class CloudLifeRepository implements CompletedLifeRepository {
  constructor(
    private client: SupabaseClient,
    private userId: string,
  ) {
    z.uuid().parse(userId);
  }
  async page(cursor?: HistoryCursor) {
    let request = this.client
      .from('completed_lives')
      .select('user_id,life_id,record,created_at')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .order('life_id', { ascending: true })
      .limit(21);
    if (cursor) {
      const c = cursorSchema.parse(cursor);
      request = request.or(
        `created_at.lt.${c.createdAt},and(created_at.eq.${c.createdAt},life_id.gt.${c.lifeId})`,
      );
    }
    const { data, error } = await request;
    handle(error);
    const rows = z
      .array(
        z.object({
          user_id: z.uuid(),
          life_id: z.uuid(),
          record: z.unknown(),
          created_at: z.iso.datetime({ offset: true }),
        }),
      )
      .max(21)
      .parse(data);
    const records = rows.slice(0, 20).map((r) => {
      if (r.user_id !== this.userId) throw new Error('Không khớp chủ sở hữu.');
      const record = validateLifeRecord(r.record);
      if (record.id !== r.life_id) throw new Error('Mã lịch sử không khớp.');
      return record;
    });
    const last = rows[19];
    return {
      records,
      ...(rows.length > 20 ? { next: { createdAt: last.created_at, lifeId: last.life_id } } : {}),
    };
  }
  async archive(record: LifeRecord) {
    const valid = validateLifeRecord(record);
    const { error } = await this.client.rpc('mkv_archive_life', { p_record: valid });
    handle(error);
  }
}
