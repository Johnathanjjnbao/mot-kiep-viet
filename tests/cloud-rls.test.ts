import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { createRun } from '../src/engine/engine';
import { snapshot } from '../src/persistence/saves';
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222',
  C = '33333333-3333-4333-8333-333333333333';
const life = '44444444-4444-4444-8444-444444444444';
let db: PGlite;
const save = snapshot(createRun('cloud-rls'), life);
async function as(user: string | null, role = 'authenticated') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
  await db.exec(`set role ${role === 'anon' ? 'anon' : 'authenticated'}`);
}
async function write(expected = 0, operation = crypto.randomUUID(), value: unknown = save) {
  return db.query<{ revision: number }>(
    'select public.mkv_write_save($1,$2,$3::jsonb,$4,$5) as revision',
    ['autosave', life, JSON.stringify(value), expected, operation],
  );
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema public,auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;`);
  await db.query('insert into auth.users values ($1),($2),($3)', [A, B, C]);
  await db.exec(readFileSync('supabase/migrations/202610300001_cloud.sql', 'utf8'));
  await db.exec(readFileSync('supabase/migrations/202610300002_conflict_http.sql', 'utf8'));
  await db.query('insert into mkv_private.invited_users(user_id) values($1),($2)', [A, B]);
}, 120000);
afterAll(async () => {
  await db?.close();
});
it('runs caller operations under non-owner, non-bypass roles', async () => {
  await as(A);
  const r = await db.query<{ rolsuper: boolean; rolbypassrls: boolean }>(
    'select rolsuper,rolbypassrls from pg_roles where rolname=current_user',
  );
  expect(r.rows[0]).toEqual({ rolsuper: false, rolbypassrls: false });
});
it('denies unauthenticated table access and write RPC', async () => {
  await as(null, 'anon');
  for (const table of ['profiles', 'cloud_saves', 'completed_lives', 'sync_receipts'])
    await expect(db.query(`select * from public.${table}`)).rejects.toThrow(/permission denied/);
  await expect(write()).rejects.toThrow(/permission denied/);
});
it('denies authenticated but uninvited identities even with a valid JWT subject', async () => {
  await as(C);
  expect((await db.query('select * from public.cloud_saves')).rows).toEqual([]);
  await expect(write()).rejects.toThrow(/Invitation required/);
  await expect(
    db.query('insert into mkv_private.invited_users(user_id) values($1)', [C]),
  ).rejects.toThrow(/permission denied/);
});
it('allows own profile insert/update but rejects ownership changes and other-user insert', async () => {
  await as(A);
  await db.query('insert into public.profiles(user_id,display_name) values($1,$2)', [
    A,
    'Người chơi A',
  ]);
  await db.query('update public.profiles set display_name=$1 where user_id=$2', ['Tên mới', A]);
  await expect(
    db.query('update public.profiles set user_id=$1 where user_id=$2', [B, A]),
  ).rejects.toThrow(/permission denied/);
  await expect(
    db.query('insert into public.profiles(user_id,display_name) values($1,$2)', [B, 'Khác']),
  ).rejects.toThrow(/row-level security/);
});
it('writes own saves, retries idempotently, and rejects stale revisions and changed receipts', async () => {
  await as(A);
  const operation = crypto.randomUUID();
  expect((await write(0, operation)).rows[0].revision).toBe(1);
  expect((await write(0, operation)).rows[0].revision).toBe(1);
  await expect(write(0)).rejects.toThrow(/Revision conflict/);
  await expect(write(1, operation)).rejects.toThrow(/Operation reused/);
  expect((await write(1)).rows[0].revision).toBe(2);
  expect((await db.query('select * from public.cloud_saves')).rows).toHaveLength(1);
});
it('isolates B from A for reads/writes and prevents direct CAS bypass and deletes', async () => {
  await as(B);
  expect((await db.query('select * from public.cloud_saves')).rows).toEqual([]);
  expect((await db.query('select * from public.sync_receipts')).rows).toEqual([]);
  expect(
    (
      await db.query('update public.profiles set display_name=$1 where user_id=$2 returning *', [
        'Intruder',
        A,
      ])
    ).rows,
  ).toEqual([]);
  await expect(db.query('update public.cloud_saves set user_id=$1', [B])).rejects.toThrow(
    /permission denied/,
  );
  await expect(db.query('delete from public.cloud_saves')).rejects.toThrow(/permission denied/);
  expect((await write()).rows[0].revision).toBe(1);
  await as(A);
  expect(
    (await db.query<{ revision: number }>('select revision from public.cloud_saves')).rows[0]
      .revision,
  ).toBe(2);
});
it('rejects malformed versions, identity mismatches, too many actions and oversized payloads', async () => {
  await as(A);
  for (const invalid of [
    { ...save, schemaVersion: 99 },
    { ...save, identity: B },
    { ...save, run: { ...save.run, actions: Array(513).fill({ type: 'advance' }) } },
    { ...save, padding: 'x'.repeat(5242881) },
  ])
    await expect(write(2, crypto.randomUUID(), invalid)).rejects.toThrow(/Invalid save/);
});
it('archives once, denies overwrite/delete, isolates memoir and rejects incomplete lives', async () => {
  await as(A);
  const record = {
    id: life,
    createdAt: new Date().toISOString(),
    memoir: 'Hồi ký kiểm thử SQL',
    save: { ...save, run: { ...save.run, status: 'ended' } },
  };
  const archive = (r: unknown) =>
    db.query('select public.mkv_archive_life($1::jsonb)', [JSON.stringify(r)]);
  await expect(archive({ ...record, save })).rejects.toThrow(/Invalid completed/);
  await archive(record);
  await archive(record);
  expect((await db.query('select * from public.completed_lives')).rows).toHaveLength(1);
  await expect(archive({ ...record, memoir: 'Đổi hồi ký' })).rejects.toThrow(
    /Immutable archive conflict/,
  );
  await expect(db.query("update public.completed_lives set checksum='invalid'")).rejects.toThrow(
    /permission denied/,
  );
  await expect(db.query('delete from public.completed_lives')).rejects.toThrow(/permission denied/);
  await as(B);
  expect((await db.query('select * from public.completed_lives')).rows).toEqual([]);
});
