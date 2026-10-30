import type { GameRun, SaveSnapshot } from '../domain/model';
import { readSave, writeSave, listSlots, type SaveKey } from './saves';
import { archiveLife, listHistory, importHistory, type LifeRecord } from './history';
export interface GameRepository {
  read(key: SaveKey): Promise<SaveSnapshot | null>;
  write(key: SaveKey, run: GameRun, identity: string): Promise<void>;
  slots(): ReturnType<typeof listSlots>;
  history(): Promise<LifeRecord[]>;
  archive(run: GameRun, identity: string): Promise<unknown>;
  importHistory(text: string): Promise<unknown>;
}
export const guestRepository: GameRepository = {
  read: readSave,
  write: writeSave,
  slots: listSlots,
  history: listHistory,
  archive: archiveLife,
  importHistory,
};
