import { openDB } from 'idb';
import { z } from 'zod';
import type { SaveSnapshot } from '../domain/model';
import { parseSave, type SaveKey } from './saves';
import type { SyncStatus } from '../cloud/contracts';
import { canonical } from './saves';
import { validateLifeRecord, type LifeRecord } from './history';
export interface CachedSave {
  save: SaveSnapshot;
  revision: number;
  status: SyncStatus;
}
export interface PendingSave {
  id: string;
  slot: SaveKey;
  save: SaveSnapshot;
  expectedRevision: number;
  attempts: number;
  retryAt: number;
}
export class LocalBranchConflict extends Error {
  constructor() {
    super(
      'Một tab khác vừa lưu tiến độ. Nhánh của bạn được giữ trong Bản sao khôi phục; hãy mở Tài khoản để chọn chơi tiếp.',
    );
  }
}
export function sameBranch(a: SaveSnapshot | null, b: SaveSnapshot | null) {
  return (
    canonical(a ? { identity: a.identity, run: a.run } : null) ===
    canonical(b ? { identity: b.identity, run: b.run } : null)
  );
}
const database = () =>
  openDB('mot-kiep-viet-accounts', 1, {
    upgrade(d) {
      d.createObjectStore('saves');
      d.createObjectStore('queue');
      d.createObjectStore('lives');
    },
  });
export class AccountCache {
  private scope: string;
  constructor(project: string, userId: string) {
    this.scope = `${new URL(project).origin}:${z.uuid().parse(userId)}`;
  }
  private key(suffix: string) {
    return `${this.scope}:${suffix}`;
  }
  async read(slot: SaveKey): Promise<CachedSave | null> {
    const d = await database();
    try {
      const r = await d.get('saves', this.key(slot));
      return r ? { ...r, save: parseSave(JSON.stringify(r.save)) } : null;
    } finally {
      d.close();
    }
  }
  async writeLocal(
    slot: SaveKey,
    save: SaveSnapshot,
    revision: number,
    expected?: SaveSnapshot | null,
  ) {
    const valid = parseSave(JSON.stringify(save));
    z.uuid().parse(valid.identity);
    z.number().int().min(0).parse(revision);
    const d = await database();
    try {
      const tx = d.transaction(['saves', 'queue'], 'readwrite');
      void tx.done.catch(() => undefined);
      if (expected !== undefined) {
        const current = await tx.objectStore('saves').get(this.key(slot));
        if (!sameBranch(current?.save ?? null, expected)) {
          tx.abort();
          throw new LocalBranchConflict();
        }
      }
      const queue = (await tx.objectStore('queue').get(this.scope)) as PendingSave[] | undefined;
      const pending = queue ?? [];
      const tail = [...pending].reverse().find((o) => o.slot === slot);
      if (tail?.attempts === 0) pending.splice(pending.indexOf(tail), 1);
      if (pending.length >= 64) {
        await tx
          .objectStore('saves')
          .put({ save: valid, revision, status: 'error' }, this.key(slot));
        await tx.done;
        throw new Error('Hàng đợi đầy. Hãy xuất bản sao trước khi tiếp tục đồng bộ.');
      }
      const operation: PendingSave = {
        id: crypto.randomUUID(),
        slot,
        save: valid,
        expectedRevision: tail?.attempts === 0 ? tail.expectedRevision : revision,
        attempts: 0,
        retryAt: 0,
      };
      pending.push(operation);
      await tx
        .objectStore('saves')
        .put({ save: valid, revision, status: 'pending' }, this.key(slot));
      await tx.objectStore('queue').put(pending, this.scope);
      await tx.done;
    } finally {
      d.close();
    }
  }
  async pending(): Promise<PendingSave[]> {
    const d = await database();
    try {
      return (await d.get('queue', this.scope)) ?? [];
    } finally {
      d.close();
    }
  }
  async markAttempt(id: string, now: number) {
    let claimed = false;
    await this.changeQueue(async (pending) => {
      const op = pending.find((o) => o.id === id);
      if (!op) return;
      claimed = true;
      op.attempts++;
      op.retryAt = now + Math.min(300000, 1000 * 2 ** Math.min(op.attempts, 9));
    });
    return claimed;
  }
  private async changeQueue(fn: (ops: PendingSave[]) => Promise<void>) {
    const d = await database();
    try {
      const tx = d.transaction('queue', 'readwrite');
      const ops = (await tx.store.get(this.scope)) ?? [];
      await fn(ops);
      await tx.store.put(ops, this.scope);
      await tx.done;
    } finally {
      d.close();
    }
  }
  async acceptRemote(slot: SaveKey, save: SaveSnapshot, revision: number) {
    const valid = parseSave(JSON.stringify(save));
    const d = await database();
    try {
      const tx = d.transaction(['saves', 'queue'], 'readwrite');
      void tx.done.catch(() => undefined);
      const pending: PendingSave[] = (await tx.objectStore('queue').get(this.scope)) ?? [];
      const local = await tx.objectStore('saves').get(this.key(slot));
      if (pending.some((o) => o.slot === slot) || local?.status === 'error') {
        tx.abort();
        throw new Error('Còn nhánh trên thiết bị chưa đồng bộ; không thay thế tự động.');
      }
      await tx
        .objectStore('saves')
        .put({ save: valid, revision, status: 'synced' }, this.key(slot));
      await tx.done;
    } finally {
      d.close();
    }
  }
  // A receipt only clears its own operation. Later local decisions stay queued.
  async acknowledge(id: string, revision: number) {
    const d = await database();
    try {
      const tx = d.transaction(['saves', 'queue'], 'readwrite');
      const pending: PendingSave[] = (await tx.objectStore('queue').get(this.scope)) ?? [];
      const done = pending.find((o) => o.id === id);
      if (!done) {
        await tx.done;
        return;
      }
      const remaining = pending.filter((o) => o.id !== id),
        next = remaining.find((o) => o.slot === done.slot);
      // Only an operation never sent can adopt the preceding revision.
      if (next && next.attempts === 0) next.expectedRevision = revision;
      const cached = await tx.objectStore('saves').get(this.key(done.slot));
      if (cached)
        await tx.objectStore('saves').put(
          {
            ...cached,
            revision,
            status: cached.status === 'error' ? 'error' : next ? 'pending' : 'synced',
          },
          this.key(done.slot),
        );
      await tx.objectStore('queue').put(remaining, this.scope);
      await tx.done;
    } finally {
      d.close();
    }
  }
  async retry(resetExhausted = true) {
    await this.changeQueue(async (ops) => {
      for (const op of ops) {
        op.retryAt = 0;
        if (resetExhausted && op.attempts >= 8) op.attempts = 7;
      }
    });
  }
  async resolve(slot: SaveKey, remote: SaveSnapshot, revision: number, keepLocal: boolean) {
    const valid = parseSave(JSON.stringify(remote));
    const d = await database();
    try {
      const tx = d.transaction(['saves', 'queue'], 'readwrite');
      const ops: PendingSave[] = (await tx.objectStore('queue').get(this.scope)) ?? [];
      const local = await tx.objectStore('saves').get(this.key(slot));
      if (!local) throw new Error('Không có nhánh trên thiết bị.');
      // Preserve the losing branch as a downloadable recovery record before resolving.
      const losing: SaveSnapshot = keepLocal ? valid : local.save;
      const winning: SaveSnapshot = keepLocal ? local.save : valid;
      const recovery =
        losing.identity === winning.identity
          ? { ...losing, identity: crypto.randomUUID() }
          : losing;
      await tx.objectStore('saves').put(recovery, this.key(`recovery:${crypto.randomUUID()}`));
      const remaining = ops.filter((o) => o.slot !== slot);
      if (keepLocal)
        remaining.push({
          id: crypto.randomUUID(),
          slot,
          save: local.save,
          expectedRevision: revision,
          attempts: 0,
          retryAt: 0,
        });
      await tx.objectStore('queue').put(remaining, this.scope);
      await tx.objectStore('saves').put(
        {
          save: keepLocal ? local.save : valid,
          revision,
          status: keepLocal ? 'pending' : 'synced',
        },
        this.key(slot),
      );
      await tx.done;
    } finally {
      d.close();
    }
  }
  async recoveries(): Promise<SaveSnapshot[]> {
    const d = await database();
    try {
      const tx = d.transaction('saves');
      const keys = await tx.store.getAllKeys();
      const results: SaveSnapshot[] = [];
      for (const key of keys)
        if (typeof key === 'string' && key.startsWith(this.key('recovery:')))
          results.push(await tx.store.get(key));
      return results;
    } finally {
      d.close();
    }
  }
  async preserveBranch(save: SaveSnapshot, fork = false) {
    const valid = parseSave(JSON.stringify(save));
    const digest = Array.from(
      new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(valid.run))),
      ),
    )
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('');
    const d = await database();
    try {
      const tx = d.transaction('saves', 'readwrite'),
        key = this.key('recovery:' + digest);
      const old = await tx.store.get(key);
      const result = old ?? {
        ...valid,
        identity: fork ? crypto.randomUUID() : (valid.identity ?? crypto.randomUUID()),
      };
      if (!old) await tx.store.put(result, key);
      await tx.done;
      return result as SaveSnapshot;
    } finally {
      d.close();
    }
  }
  async history(
    pendingOnly = false,
  ): Promise<{ record: LifeRecord; pending: boolean; attempts?: number; retryAt?: number }[]> {
    const d = await database();
    try {
      const tx = d.transaction('lives');
      const keys = await tx.store.getAllKeys();
      const records = [];
      for (const key of keys)
        if (typeof key === 'string' && key.startsWith(this.key('life:'))) {
          const row = await tx.store.get(key);
          if (pendingOnly && !row.pending) continue;
          records.push({ ...row, record: validateLifeRecord(row.record) });
        }
      return records;
    } finally {
      d.close();
    }
  }
  async cacheLife(record: LifeRecord, pending: boolean) {
    const valid = validateLifeRecord(record);
    const d = await database();
    try {
      const tx = d.transaction('lives', 'readwrite');
      void tx.done.catch(() => undefined);
      const key = this.key('life:' + record.id),
        old = await tx.store.get(key);
      if (old && canonical(old.record.save.run) !== canonical(record.save.run)) {
        tx.abort();
        throw new Error('Trùng mã lịch sử với nội dung khác.');
      }
      await tx.store.put(
        {
          record: old?.record ?? valid,
          pending: pending || (old?.pending ?? false),
          attempts: old?.attempts ?? 0,
          retryAt: old?.retryAt ?? 0,
        },
        key,
      );
      await tx.done;
    } finally {
      d.close();
    }
  }
  async lifeSynced(id: string) {
    const d = await database();
    try {
      const tx = d.transaction('lives', 'readwrite');
      const key = this.key('life:' + id),
        row = await tx.store.get(key);
      if (row) await tx.store.put({ ...row, pending: false }, key);
      await tx.done;
    } finally {
      d.close();
    }
  }
  async attemptLife(id: string) {
    const d = await database();
    try {
      const tx = d.transaction('lives', 'readwrite'),
        key = this.key('life:' + id),
        row = await tx.store.get(key);
      if (row) {
        const attempts = (row.attempts ?? 0) + 1;
        await tx.store.put(
          {
            ...row,
            attempts,
            retryAt: Date.now() + Math.min(300000, 1000 * 2 ** Math.min(attempts, 9)),
          },
          key,
        );
      }
      await tx.done;
    } finally {
      d.close();
    }
  }
  async retryLives(resetExhausted = true) {
    const d = await database();
    try {
      const tx = d.transaction('lives', 'readwrite');
      const keys = await tx.store.getAllKeys();
      for (const key of keys)
        if (typeof key === 'string' && key.startsWith(this.key('life:'))) {
          const row = await tx.store.get(key);
          if (row.pending)
            await tx.store.put(
              {
                ...row,
                attempts: resetExhausted ? Math.min(row.attempts ?? 0, 7) : (row.attempts ?? 0),
                retryAt: 0,
              },
              key,
            );
        }
      await tx.done;
    } finally {
      d.close();
    }
  }
}
