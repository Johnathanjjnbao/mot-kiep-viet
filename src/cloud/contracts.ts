import type { SaveSnapshot } from '../domain/model';
import type { LifeRecord } from '../persistence/history';
import type { SaveKey } from '../persistence/saves';
export type PlayerSession = { kind: 'guest' } | { kind: 'account'; userId: string; email: string };
export type SyncStatus = 'local' | 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';
export interface VersionedSave {
  slot: SaveKey;
  lifeId: string;
  save: SaveSnapshot;
  revision: number;
  updatedAt: string;
}
export interface SaveRepository {
  list(): Promise<VersionedSave[]>;
  write(
    slot: SaveKey,
    save: SaveSnapshot,
    expectedRevision: number,
    operationId: string,
  ): Promise<number>;
}
export interface HistoryCursor {
  createdAt: string;
  lifeId: string;
}
export interface CompletedLifeRepository {
  page(cursor?: HistoryCursor): Promise<{ records: LifeRecord[]; next?: HistoryCursor }>;
  archive(record: LifeRecord): Promise<void>;
}
export class RevisionConflict extends Error {
  constructor() {
    super('Tiến trình trên thiết bị khác đã thay đổi. Cả hai nhánh được giữ để bạn chọn.');
    this.name = 'RevisionConflict';
  }
}
