import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { AccountCache } from '../src/persistence/account-cache';
import { SyncCoordinator } from '../src/cloud/sync';
import { RevisionConflict, type SaveRepository } from '../src/cloud/contracts';
import { createRun, advance } from '../src/engine/engine';
import { snapshot, writeSave, readSave } from '../src/persistence/saves';
import { cloudConfig } from '../src/cloud/auth';
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
