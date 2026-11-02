import type { GameRun } from '../domain/model';
import type { GameRepository } from './repository';
import { readSaveEntry, compareAndWriteSave, type SaveKey } from './saves';
import { archiveLife, listHistory, importHistory } from './history';
/** Each tab owns four observed cells; IndexedDB transactions arbitrate writes between tabs. */
export class GuestRepository implements GameRepository {
  private observed = new Map<SaveKey, string | undefined>();
  private writing: Promise<void> = Promise.resolve();
  async read(key: SaveKey) {
    await this.writing;
    const cell = await readSaveEntry(key);
    this.observed.set(key, cell.raw);
    return cell.save;
  }
  write(key: SaveKey, run: GameRun, identity: string) {
    const task = compareAndWriteSave(key, run, identity, () => this.observed.get(key)).then(
      (raw) => {
        this.observed.set(key, raw);
      },
    );
    this.writing = task.catch(() => undefined);
    return task;
  }
  async slots() {
    return Promise.all(
      (['slot-1', 'slot-2', 'slot-3'] as const).map(async (key) => {
        try {
          return { key, save: await this.read(key), error: null };
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
  history = listHistory;
  archive = archiveLife;
  importHistory = importHistory;
}
