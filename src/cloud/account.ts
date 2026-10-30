import type { SupabaseClient } from '@supabase/supabase-js';
import type { GameRun, SaveSnapshot } from '../domain/model';
import { snapshot, readSave, canonical, type SaveKey } from '../persistence/saves';
import { AccountCache, LocalBranchConflict } from '../persistence/account-cache';
import { parseHistory, listHistory, type LifeRecord } from '../persistence/history';
import { lifeSummary } from '../application/summary';
import type { GameRepository } from '../persistence/repository';
import { CloudSaveRepository, CloudLifeRepository } from './repositories';
import { SyncCoordinator } from './sync';
import type { SyncStatus, VersionedSave, HistoryCursor } from './contracts';
export class AccountRepository implements GameRepository {
  readonly cache: AccountCache;
  readonly saves: CloudSaveRepository;
  readonly lives: CloudLifeRepository;
  private sync: SyncCoordinator;
  private closed = false;
  private initialized: Promise<void>;
  private timer: ReturnType<typeof setInterval>;
  private historyCursor: HistoryCursor | undefined;
  private historyStarted = false;
  private flushingHistory = false;
  private syncState: SyncStatus = 'local';
  private observed = new Map<SaveKey, SaveSnapshot | null>();
  private writing: Promise<void> = Promise.resolve();
  constructor(
    client: SupabaseClient,
    project: string,
    readonly userId: string,
    private status: (s: SyncStatus) => void,
  ) {
    this.cache = new AccountCache(project, userId);
    this.saves = new CloudSaveRepository(client, userId);
    this.lives = new CloudLifeRepository(client, userId);
    this.sync = new SyncCoordinator(this.cache, this.saves, (s) => {
      this.syncState = s;
      status(s === 'synced' ? 'pending' : s);
    });
    this.initialized = this.hydrate();
    this.timer = setInterval(() => void this.flush(), 30000);
    window.addEventListener('online', this.online);
  }
  private online = () => {
    void this.wakeOnline();
  };
  private async wakeOnline() {
    try {
      await this.cache.retry(false);
      await this.cache.retryLives(false);
      await this.flush();
    } catch {
      if (!this.closed) this.status('error');
    }
  }
  close() {
    this.closed = true;
    this.sync.stop();
    clearInterval(this.timer);
    window.removeEventListener('online', this.online);
  }
  private async hydrate() {
    try {
      const remote = await this.saves.list();
      for (const r of remote) {
        if (this.closed) return;
        try {
          await this.cache.acceptRemote(r.slot, r.save, r.revision);
        } catch {
          this.status('conflict');
        }
      }
    } catch {
      if (!this.closed) this.status('error');
    }
  }
  async read(key: SaveKey) {
    await this.initialized;
    const save = (await this.cache.read(key))?.save ?? null;
    this.observed.set(key, save);
    return save;
  }
  write(key: SaveKey, run: GameRun, identity: string) {
    const task = this.writing.then(() => this.writeNext(key, run, identity));
    this.writing = task.catch(() => undefined);
    return task;
  }
  private async writeNext(key: SaveKey, run: GameRun, identity: string) {
    if (this.closed) throw new Error('Phiên tài khoản đã đóng.');
    await this.initialized;
    const cached = await this.cache.read(key);
    if (
      cached &&
      cached.status !== 'error' &&
      cached.save.identity === identity &&
      canonical(cached.save.run) === canonical(run)
    ) {
      void this.flush();
      return;
    }
    const next = snapshot(run, identity);
    try {
      await this.cache.writeLocal(
        key,
        next,
        cached?.revision ?? 0,
        this.observed.has(key) ? this.observed.get(key)! : (cached?.save ?? null),
      );
    } catch (e) {
      if (e instanceof LocalBranchConflict) {
        await this.cache.preserveBranch(next, true);
        this.status('error');
      }
      throw e;
    }
    this.observed.set(key, next);
    this.status('pending');
    void this.flush();
  }
  async slots() {
    return Promise.all(
      (['slot-1', 'slot-2', 'slot-3'] as SaveKey[]).map(async (key) => {
        try {
          return { key, save: await this.read(key), error: null };
        } catch {
          return { key, save: null, error: 'Chưa đọc được ô lưu.' };
        }
      }),
    );
  }
  async archive(run: GameRun, identity: string) {
    const record: LifeRecord = {
      id: identity,
      createdAt: new Date().toISOString(),
      save: snapshot(run, identity),
      memoir: lifeSummary(run).biography,
    };
    await this.cache.cacheLife(record, true);
    void this.flush();
  }
  async history() {
    return (await this.cache.history())
      .map((r) => r.record)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async moreHistory() {
    if (this.historyStarted && !this.historyCursor) return false;
    const page = await this.lives.page(this.historyCursor);
    if (this.closed) return false;
    for (const r of page.records) await this.cache.cacheLife(r, false);
    this.historyStarted = true;
    this.historyCursor = page.next;
    return Boolean(page.next);
  }
  async importHistory(text: string) {
    const records = parseHistory(text);
    for (const r of records) await this.cache.cacheLife(r, true);
    await this.flush();
    return records.length;
  }
  async flush() {
    if (this.closed || this.flushingHistory) return;
    this.flushingHistory = true;
    try {
      await this.initialized;
      await this.sync.flush();
      if (this.closed) return;
      let waiting = false;
      for (const row of await this.cache.history(true))
        if (row.pending) {
          if ((row.attempts ?? 0) >= 8 || (row.retryAt ?? 0) > Date.now()) {
            waiting = true;
            continue;
          }
          await this.cache.attemptLife(row.record.id);
          await this.lives.archive(row.record);
          await this.cache.lifeSynced(row.record.id);
        }
      const unsaved = (
        await Promise.all(
          (['autosave', 'slot-1', 'slot-2', 'slot-3'] as SaveKey[]).map((k) => this.cache.read(k)),
        )
      ).some((s) => s?.status === 'error');
      if (!this.closed && this.syncState === 'synced')
        this.status(unsaved ? 'error' : waiting ? 'pending' : 'synced');
    } catch {
      if (!this.closed) this.status('error');
    } finally {
      this.flushingHistory = false;
    }
  }
  async retry() {
    await this.cache.retry();
    await this.cache.retryLives();
    await this.flush();
    for (const key of ['autosave', 'slot-1', 'slot-2', 'slot-3'] as SaveKey[]) {
      const local = await this.cache.read(key);
      if (local?.status === 'error') await this.cache.writeLocal(key, local.save, local.revision);
    }
    await this.flush();
    await this.hydrate();
  }
  async conflicts(): Promise<{ local: SaveSnapshot; remote: VersionedSave }[]> {
    const remote = await this.saves.list(),
      pending = await this.cache.pending(),
      result = [];
    for (const r of remote) {
      const op = pending.find((o) => o.slot === r.slot);
      if (op && op.expectedRevision !== r.revision) {
        const local = await this.cache.read(r.slot);
        if (local) result.push({ local: local.save, remote: r });
      }
    }
    return result;
  }
  async resolve(remote: VersionedSave, keepLocal: boolean) {
    await this.cache.resolve(remote.slot, remote.save, remote.revision, keepLocal);
    await this.flush();
  }
  async guestPreview() {
    const saves = [];
    for (const key of ['autosave', 'slot-1', 'slot-2', 'slot-3'] as SaveKey[]) {
      const save = await readSave(key);
      if (save) saves.push({ key, save });
    }
    return { saves, history: await listHistory() };
  }
  async migrateGuest() {
    const guest = await this.guestPreview();
    // Conflicting occupied slots are preserved as account recovery branches, never overwritten.
    for (const { key, save } of guest.saves) {
      const existing = await this.cache.read(key);
      if (existing && canonical(existing.save.run) === canonical(save.run)) continue;
      const valid = await this.cache.preserveBranch(
        save,
        Boolean(existing && existing.save.identity === save.identity),
      );
      if (!existing) {
        await this.cache.writeLocal(key, valid, 0, null);
        this.observed.set(key, valid);
      }
    }
    for (const r of guest.history) await this.cache.cacheLife(r, true);
    await this.flush();
  }
}
