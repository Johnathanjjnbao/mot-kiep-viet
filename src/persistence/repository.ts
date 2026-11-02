import type { GameRun, SaveSnapshot } from '../domain/model';
import type { listSlots, SaveKey } from './saves';
import type { LifeRecord } from './history';
import { GuestRepository } from './guest-repository';
export interface GameRepository {
  read(key: SaveKey): Promise<SaveSnapshot | null>;
  write(key: SaveKey, run: GameRun, identity: string): Promise<void>;
  slots(): ReturnType<typeof listSlots>;
  history(): Promise<LifeRecord[]>;
  archive(run: GameRun, identity: string): Promise<unknown>;
  importHistory(text: string): Promise<unknown>;
}
export const guestRepository: GameRepository = new GuestRepository();
