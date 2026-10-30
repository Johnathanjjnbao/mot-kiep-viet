import 'fake-indexeddb/auto';
import { expect, it, vi } from 'vitest';
import { AccountCache } from '../src/persistence/account-cache';
import { SyncCoordinator } from '../src/cloud/sync';
import { RevisionConflict, type SaveRepository } from '../src/cloud/contracts';
import { createRun, advance } from '../src/engine/engine';
import { snapshot, writeSave, readSave } from '../src/persistence/saves';
import { cloudConfig, scopedDataClient } from '../src/cloud/auth';
import { CloudSaveRepository } from '../src/cloud/repositories';
const project = 'https://test-project.supabase.co';
const fresh = () => new AccountCache(project, crypto.randomUUID());
const save = () => snapshot(createRun('account-test'), crypto.randomUUID());
function remote(write: SaveRepository['write']): SaveRepository {
  return { list: async () => [], write };
}
it('keeps absent/disabled configuration inert and rejects secret keys', () => {
  expect(cloudConfig({})).toBeNull();
  expect(cloudConfig({ VITE_CLOUD_ENABLED: 'false', VITE_SUPABASE_URL: 'bad' })).toBeNull();
  expect(() =>
    cloudConfig({
      VITE_CLOUD_ENABLED: 'true',
      VITE_SUPABASE_URL: project,
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_not-usable',
    }),
  ).toThrow();
  expect(
    cloudConfig({
      VITE_CLOUD_ENABLED: 'true',
      VITE_SUPABASE_URL: project,
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    }),
  ).toEqual({ url: project, publishableKey: 'sb_publishable_test' });
});
it('preserves guest and isolates account caches by user and project', async () => {
  const user = crypto.randomUUID(),
    s = save(),
    a = new AccountCache(project, user);
  await writeSave('slot-3', s.run, s.identity);
  await a.writeLocal('autosave', s, 0);
  expect((await new AccountCache(project, user).read('autosave'))?.save).toEqual(s);
  expect(await fresh().read('autosave')).toBeNull();
  expect(await new AccountCache('https://other.supabase.co', user).read('autosave')).toBeNull();
  expect((await readSave('slot-3'))?.run).toEqual(s.run);
});
it('coalesces only unsent autosaves, survives reload and keeps latest offline decision', async () => {
  const a = fresh(),
    s = save();
  for (let i = 0; i < 70; i++) await a.writeLocal('autosave', s, 0);
  expect(await a.pending()).toHaveLength(1);
  expect((await a.read('autosave'))?.status).toBe('pending');
  const first = (await a.pending())[0];
  await a.markAttempt(first.id, 0);
  const next = snapshot(advance(s.run), s.identity);
  await a.writeLocal('autosave', next, 0);
  expect(await a.pending()).toHaveLength(2);
  expect((await a.read('autosave'))?.save).toEqual(next);
});
it('retains the same operation/payload across network failure and bounded retry', async () => {
  const a = fresh(),
    s = save(),
    sent: string[] = [],
    states: string[] = [];
  await a.writeLocal('autosave', s, 0);
  const sync = new SyncCoordinator(
    a,
    remote(async (_slot, _save, _rev, id) => {
      sent.push(id);
      if (sent.length === 1) throw new Error('offline');
      return 1;
    }),
    (v) => states.push(v),
  );
  await sync.flush(0);
  await sync.flush(1);
  expect(sent).toHaveLength(1);
  expect(states).toContain('error');
  await sync.flush(2001);
  expect(sent).toHaveLength(2);
  expect(new Set(sent).size).toBe(1);
  expect(await a.pending()).toHaveLength(0);
  expect((await a.read('autosave'))?.status).toBe('synced');
});
it('uses acknowledged revisions for later decisions without altering an already sent request', async () => {
  const a = fresh(),
    s = save(),
    revisions: number[] = [];
  await a.writeLocal('autosave', s, 0);
  const first = (await a.pending())[0];
  await a.markAttempt(first.id, 0);
  await a.writeLocal('autosave', snapshot(advance(s.run), s.identity), 0);
  const sync = new SyncCoordinator(
    a,
    remote(async (_slot, _s, rev) => {
      revisions.push(rev);
      return rev + 1;
    }),
    () => {},
  );
  await sync.flush(2001);
  expect(revisions).toEqual([0, 1]);
  expect(await a.pending()).toHaveLength(0);
});
it('retains conflicting local state and blocks blind remote replacement', async () => {
  const a = fresh(),
    s = save(),
    states: string[] = [];
  await a.writeLocal('autosave', s, 0);
  await new SyncCoordinator(
    a,
    remote(async () => {
      throw new RevisionConflict();
    }),
    (v) => states.push(v),
  ).flush(0);
  expect(states).toContain('conflict');
  expect(await a.pending()).toHaveLength(1);
  await expect(a.acceptRemote('autosave', save(), 4)).rejects.toThrow(/Còn nhánh/);
  expect((await a.read('autosave'))?.save).toEqual(s);
});
it('stops UI updates and later operations when the account leaves during an in-flight write', async () => {
  const a = fresh(),
    s = save(),
    states: string[] = [];
  await a.writeLocal('autosave', s, 0);
  let finish!: (n: number) => void, started!: () => void;
  const ready = new Promise<void>((resolve) => {
    started = resolve;
  });
  const sync = new SyncCoordinator(
    a,
    remote(() => {
      started();
      return new Promise((resolve) => {
        finish = resolve;
      });
    }),
    (v) => states.push(v),
  );
  const request = sync.flush(0);
  await ready;
  sync.stop();
  const count = states.length;
  finish(1);
  await request;
  expect(states).toHaveLength(count);
  expect(await a.pending()).toHaveLength(0);
  await a.writeLocal('slot-1', s, 0);
  await sync.flush();
  expect(await a.pending()).toHaveLength(1);
});

it('keeps an in-flight account client bound to its own JWT across switching and refresh', async () => {
  const headers: string[] = [];
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
    headers.push(new Headers(init?.headers).get('Authorization') ?? '');
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  });
  try {
    const config = { url: project, publishableKey: 'sb_publishable_test' },
      a = { token: 'qa-user-a' },
      b = { token: 'qa-user-b' };
    const clientA = scopedDataClient(config, () => a.token),
      clientB = scopedDataClient(config, () => b.token);
    await clientA.from('cloud_saves').select('*');
    await clientB.from('cloud_saves').select('*');
    a.token = 'qa-user-a-refreshed';
    await clientA.from('cloud_saves').select('*');
    a.token = '';
    await clientA.from('cloud_saves').select('*');
    expect(headers).toEqual([
      'Bearer qa-user-a',
      'Bearer qa-user-b',
      'Bearer qa-user-a-refreshed',
      '',
    ]);
  } finally {
    fetchMock.mockRestore();
  }
});
it('preserves both conflict branches and uses the chosen remote revision', async () => {
  const a = fresh(),
    local = save(),
    remote = save();
  await a.writeLocal('autosave', local, 0);
  await a.resolve('autosave', remote, 4, false);
  expect((await a.read('autosave'))?.save).toEqual(remote);
  expect(await a.pending()).toHaveLength(0);
  expect((await a.recoveries())[0]).toEqual(local);
  await a.writeLocal('autosave', local, 4);
  await a.resolve('autosave', remote, 5, true);
  expect((await a.read('autosave'))?.save).toEqual(local);
  expect((await a.pending())[0].expectedRevision).toBe(5);
});
it('keeps repeated guest branch copies idempotent without altering guest data', async () => {
  const a = fresh(),
    s = save();
  delete s.identity;
  const first = await a.preserveBranch(s),
    second = await a.preserveBranch({ ...s, savedAt: new Date().toISOString() });
  expect(first.identity).toBe(second.identity);
  expect(await a.recoveries()).toHaveLength(1);
  expect(s.identity).toBeUndefined();
});
it('keeps the latest local save after a bounded queue fills', async () => {
  const a = fresh(),
    s = save();
  for (let i = 0; i < 64; i++) {
    await a.writeLocal('autosave', s, 0);
    await a.markAttempt((await a.pending()).at(-1)!.id, 0);
  }
  const latest = snapshot(advance(s.run), s.identity);
  await expect(a.writeLocal('autosave', latest, 0)).rejects.toThrow(/Hàng đợi đầy/);
  expect((await a.read('autosave'))?.save).toEqual(latest);
  await a.acknowledge((await a.pending())[0].id, 1);
  expect((await a.read('autosave'))?.status).toBe('error');
});

it('forks the losing identity when two branches of the same life compete', async () => {
  const a = fresh(),
    local = save(),
    remote = snapshot(advance(local.run), local.identity);
  await a.writeLocal('autosave', local, 0);
  await a.resolve('autosave', remote, 2, false);
  const recovery = (await a.recoveries())[0];
  expect(recovery.run).toEqual(local.run);
  expect(recovery.identity).not.toBe(local.identity);
  expect((await a.read('autosave'))?.save.identity).toBe(local.identity);
});

it('does not reset an exhausted retry budget merely because connectivity returns', async () => {
  const a = fresh(),
    s = save();
  await a.writeLocal('autosave', s, 0);
  const id = (await a.pending())[0].id;
  for (let i = 0; i < 8; i++) await a.markAttempt(id, 0);
  await a.retry(false);
  let calls = 0;
  const sync = new SyncCoordinator(
    a,
    remote(async () => {
      calls++;
      return 1;
    }),
    () => {},
  );
  await sync.flush(1);
  expect(calls).toBe(0);
  expect((await a.pending())[0].attempts).toBe(8);
  await a.retry();
  await sync.flush(1);
  expect(calls).toBe(1);
  expect(await a.pending()).toHaveLength(0);
});
it('translates the server HTTP 409 contract into a preserved-branch conflict', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          code: 'PT409',
          message: 'Revision conflict',
          hint: null,
          details: null,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      ),
  );
  try {
    const client = scopedDataClient(
      { url: project, publishableKey: 'sb_publishable_test' },
      () => 'qa-user-token',
    );
    const repo = new CloudSaveRepository(client, crypto.randomUUID());
    await expect(repo.write('autosave', save(), 0, crypto.randomUUID())).rejects.toBeInstanceOf(
      RevisionConflict,
    );
  } finally {
    fetchMock.mockRestore();
  }
});

it('atomically rejects two local tabs writing from the same stale cache branch', async () => {
  const userId = crypto.randomUUID(),
    a = new AccountCache(project, userId),
    b = new AccountCache(project, userId);
  const original = save();
  await a.acceptRemote('autosave', original, 1);
  const tabA = (await a.read('autosave'))!.save;
  const tabB = (await b.read('autosave'))!.save;
  const first = snapshot(advance(original.run), original.identity);
  await a.writeLocal('autosave', first, 1, tabA);
  await expect(b.writeLocal('autosave', original, 1, tabB)).rejects.toThrow(/tab khác/);
  expect((await a.read('autosave'))!.save.run).toEqual(first.run);
  expect(await a.pending()).toHaveLength(1);
  expect((await a.pending())[0].save.run).toEqual(first.run);
});
