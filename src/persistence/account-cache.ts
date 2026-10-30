import { openDB } from 'idb';
import { z } from 'zod';
import type { SaveSnapshot } from '../domain/model';
import { parseSave, type SaveKey } from './saves';
import type { SyncStatus } from '../cloud/contracts';
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
  async writeLocal(slot: SaveKey, save: SaveSnapshot, revision: number) {
    const valid = parseSave(JSON.stringify(save));
    z.uuid().parse(valid.identity);
    z.number().int().min(0).parse(revision);
    const d = await database();
    try {
      const tx = d.transaction(['saves', 'queue'], 'readwrite');
      void tx.done.catch(() => undefined);
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
        expectedRevision: revision,
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
      if (pending.some((o) => o.slot === slot)) {
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
        await tx
          .objectStore('saves')
          .put({ ...cached, revision, status: next ? 'pending' : 'synced' }, this.key(done.slot));
      await tx.objectStore('queue').put(remaining, this.scope);
      await tx.done;
    } finally {
      d.close();
    }
  }
}
