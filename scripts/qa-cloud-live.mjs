import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/engine.ts';
import { simulateLife } from '../src/diagnostics/simulation.ts';
import { snapshot, parseSave } from '../src/persistence/saves.ts';
import { lifeSummary } from '../src/application/summary.ts';
const ref = 'kqnapcyceddwvrvkquvg',
  url = process.env.VITE_SUPABASE_URL,
  publicKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (
  url !== 'https://' + ref + '.supabase.co' ||
  !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey ?? '')
)
  throw Error('Configure the approved project public URL and publishable key before QA');
if (process.argv.includes('--browser')) process.env.MKV_UI_QA = '1';
const cli = (command) =>
  spawnSync('cmd.exe', ['/d', '/s', '/c', command], {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  });
const keys = cli(`npx.cmd supabase projects api-keys --project-ref ${ref} --reveal --output json`);
if (keys.status !== 0) throw Error('CLI admin access unavailable');
let list;
try {
  list = JSON.parse(keys.stdout);
} catch {
  throw Error('Unrecognized CLI key response');
}
const secret =
  list.find((k) => k.type === 'secret')?.api_key ??
  list.find((k) => k.name === 'service_role')?.api_key;
if (!secret) throw Error('No authorized admin key available');
const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};
const admin = createClient(url, secret, options),
  anon = createClient(url, publicKey, options),
  created = [];
const report = {
  projectRef: ref,
  browserUrl: process.env.MKV_QA_URL ?? 'http://127.0.0.1:4173/mot-kiep-viet/',
  emailDelivery: 'OUT OF SCOPE: existing confirmed Email/Password accounts',
  physicalDevices: 'NOT RUN: independent browser contexts',
  status: 'FAIL',
  checks: [],
  fixtureDisposition: 'NOT RUN',
};
let stage = 'setup';
function ok(r) {
  if (r.error) throw Error('QA request failed at ' + stage);
  return r.data;
}
async function check(name, fn) {
  stage = name;
  console.log('QA stage: ' + name);
  await fn();
  report.checks.push({ name, status: 'VERIFIED PASS' });
}
try {
  let users = [];
  for (const label of ['a', 'b']) {
    const email = `mkv-qa-${label}-${randomUUID()}@example.invalid`,
      password = randomBytes(28).toString('base64url');
    const user = ok(
      await admin.auth.admin.createUser({ email, password, email_confirm: true }),
    ).user;
    created.push(user.id);
    const client = createClient(url, publicKey, options);
    const session = ok(await client.auth.signInWithPassword({ email, password })).session;
    assert.equal(
      JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64url')).role,
      'authenticated',
    );
    users.push({ id: user.id, client, email, password });
  }
  const [a, b] = users;
  await check('real Auth login and ordinary authenticated JWTs', async () =>
    assert.equal(users.length, 2),
  );
  await check('uninvited account denied', async () => {
    assert.equal(ok(await a.client.rpc('mkv_invited')), false);
    const deniedLife = randomUUID();
    assert.equal(
      (
        await a.client.rpc('mkv_write_save', {
          p_slot: 'autosave',
          p_life_id: deniedLife,
          p_snapshot: snapshot(createRun('uninvited-qa'), deniedLife),
          p_expected_revision: 0,
          p_operation_id: randomUUID(),
        })
      ).error?.code,
      '42501',
    );
    assert.equal((await a.client.rpc('mkv_archive_life', { p_record: {} })).error?.code, '42501');
    assert.ok(
      (await a.client.from('profiles').insert({ user_id: a.id, display_name: 'Uninvited QA' }))
        .error,
    );
  });
  for (const id of created) assert.match(id, /^[0-9a-f-]{36}$/);
  writeFileSync(
    '.local/qa-allowlist.sql',
    `insert into mkv_private.invited_users(user_id) values ('${a.id}'),('${b.id}');`,
  );
  if (
    cli(
      'npx.cmd supabase db query --linked --project-ref kqnapcyceddwvrvkquvg --file .local/qa-allowlist.sql --output json',
    ).status !== 0
  )
    throw Error('Could not authorize disposable QA identities');
  await check('invited sessions recognized by server', async () => {
    assert.equal(ok(await a.client.rpc('mkv_invited')), true);
    assert.equal(ok(await b.client.rpc('mkv_invited')), true);
  });
  const life = randomUUID(),
    save = snapshot(createRun('real-cloud-qa'), life),
    op = randomUUID();
  const args = {
    p_slot: 'autosave',
    p_life_id: life,
    p_snapshot: save,
    p_expected_revision: 0,
    p_operation_id: op,
  };
  await check('unauthenticated access denied on all tables and save RPC', async () => {
    for (const t of ['profiles', 'cloud_saves', 'completed_lives', 'sync_receipts'])
      assert.ok((await anon.from(t).select('*')).error);
    assert.ok((await anon.rpc('mkv_write_save', args)).error);
  });
  await check('save, idempotent retry and second-device replay', async () => {
    assert.equal(ok(await a.client.rpc('mkv_write_save', args)), 1);
    assert.equal(ok(await a.client.rpc('mkv_write_save', args)), 1);
    const second = createClient(url, publicKey, options);
    ok(await second.auth.signInWithPassword({ email: a.email, password: a.password }));
    const rows = ok(await second.from('cloud_saves').select('*'));
    assert.equal(rows.length, 1);
    assert.deepEqual(parseSave(JSON.stringify(rows[0].snapshot)).run, save.run);
  });
  await check('A/B isolation and ownership/CAS bypass/delete denied', async () => {
    assert.deepEqual(ok(await b.client.from('cloud_saves').select('*')), []);
    assert.deepEqual(ok(await b.client.from('sync_receipts').select('*')), []);
    assert.ok(
      (await b.client.from('cloud_saves').update({ user_id: b.id }).eq('user_id', a.id)).error,
    );
    assert.ok((await a.client.from('cloud_saves').delete().eq('user_id', a.id)).error);
    assert.ok(
      (await a.client.from('profiles').insert({ user_id: b.id, display_name: 'QA wrong owner' }))
        .error,
    );
  });
  await check('competing revision rejected', async () => {
    const collision = await a.client.rpc('mkv_write_save', {
      ...args,
      p_operation_id: randomUUID(),
    });
    report.conflictDiagnostic = {
      status: collision.status,
      code: collision.error?.code,
      message: collision.error?.message?.slice(0, 120),
    };
    assert.equal(collision.error?.code, 'PT409');
  });
  await check(
    process.env.MKV_UI_QA === '1'
      ? 'invalid version denied'
      : 'invalid version and oversized payload denied',
    async () => {
      for (const invalid of [
        { ...save, schemaVersion: 99 },
        ...(process.env.MKV_UI_QA === '1' ? [] : [{ ...save, extra: 'x'.repeat(5242881) }]),
      ])
        assert.ok(
          (
            await a.client.rpc('mkv_write_save', {
              ...args,
              p_expected_revision: 1,
              p_operation_id: randomUUID(),
              p_snapshot: invalid,
            })
          ).error,
        );
    },
  );
  const ended = simulateLife('real-archive-qa', { cohort: 1995, region: 'central-coast' }, 2),
    record = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      memoir: lifeSummary(ended).biography,
    };
  record.save = snapshot(ended, record.id);
  await check('completed life dedup, original replay, immutable and private', async () => {
    ok(await a.client.rpc('mkv_archive_life', { p_record: record }));
    ok(await a.client.rpc('mkv_archive_life', { p_record: record }));
    const rows = ok(await a.client.from('completed_lives').select('*'));
    assert.equal(rows.length, 1);
    assert.deepEqual(parseSave(JSON.stringify(rows[0].record.save)).run, ended);
    assert.deepEqual(ok(await b.client.from('completed_lives').select('*')), []);
    assert.ok(
      (await a.client.rpc('mkv_archive_life', { p_record: { ...record, memoir: 'Changed' } }))
        .error,
    );
    assert.ok(
      (await a.client.from('completed_lives').update({ checksum: 'x' }).eq('life_id', record.id))
        .error,
    );
    assert.ok((await a.client.from('completed_lives').delete().eq('life_id', record.id)).error);
  });
  await check('public registration disabled', async () => {
    const settings = await (
      await fetch(url + '/auth/v1/settings?qa=' + Date.now(), { headers: { apikey: publicKey } })
    ).json();
    assert.equal(settings.disable_signup, true);
    const r = await anon.auth.signUp({
      email: `mkv-denied-${randomUUID()}@example.invalid`,
      password: randomBytes(24).toString('hex'),
    });
    if (r.data.user) created.push(r.data.user.id);
    assert.ok(r.error);
  });
  await check('logout revokes local session', async () => {
    ok(await b.client.auth.signOut());
    assert.equal(ok(await b.client.auth.getSession()).session, null);
  });
  if (process.env.MKV_UI_QA === '1') {
    const { browserCloudQA } = await import('./qa-cloud-browser.mjs');
    await browserCloudQA(users, check);
  }
  report.status = 'VERIFIED PASS';
} catch (e) {
  report.failedStage = stage;
  if (stage.startsWith('offline')) report.diagnostic = String(e.message).slice(0, 750);
  process.exitCode = 1;
} finally {
  let disabled = true;
  for (const id of created) {
    // Owner's unattended policy forbids production deletion, including QA data.
    // Keep synthetic fixtures isolated and disable only identities created by this run.
    const r = await admin.auth.admin.updateUserById(id, { ban_duration: '876000h' });
    if (r.error) disabled = false;
  }
  report.fixtureDisposition = disabled
    ? 'VERIFIED PASS: synthetic identities disabled; production data preserved'
    : 'FAIL: could not disable all synthetic identities';
  if (!disabled) process.exitCode = 1;
  writeFileSync(
    process.env.MKV_UI_QA === '1'
      ? process.env.MKV_QA_URL?.includes('github.io')
        ? 'docs/evidence/v03-live-authenticated.json'
        : 'docs/evidence/v03-real-browser.json'
      : 'docs/evidence/v03-real-backend.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
}
