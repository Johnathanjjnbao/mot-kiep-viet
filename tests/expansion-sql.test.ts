import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
it('adds only the new version tuple while retaining all old size/identity/header guards', async () => {
  const db = new PGlite();
  try {
    await db.exec(
      'create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql as $$select null::uuid$$;',
    );
    await db.exec(readFileSync('supabase/migrations/202610300001_cloud.sql', 'utf8'));
    await db.exec(readFileSync('supabase/migrations/202610300002_conflict_http.sql', 'utf8'));
    const before = await db.query(
      'select grantee,privilege_type from information_schema.role_table_grants order by 1,2',
    );
    await db.exec(readFileSync('supabase/migrations/202610300003_life_expansion.sql', 'utf8'));
    const after = await db.query(
      'select grantee,privilege_type from information_schema.role_table_grants order by 1,2',
    );
    expect(after.rows).toEqual(before.rows);
    const life = '44444444-4444-4444-8444-444444444444';
    for (const [schema, version] of [
      [2, '1.0.0'],
      [3, '2.0.0'],
      [4, '3.0.0'],
    ] as const) {
      const value = {
        identity: life,
        schemaVersion: schema,
        engineVersion: version,
        contentVersion: version,
        run: { engineVersion: version, contentVersion: version, actions: [] },
      };
      const valid = async (v: unknown) =>
        (
          await db.query<{ ok: boolean }>(
            'select public.mkv_valid_save($1::jsonb,$2::uuid) as ok',
            [JSON.stringify(v), life],
          )
        ).rows[0].ok;
      expect(await valid(value)).toBe(true);
      expect(await valid({ ...value, identity: 'bad' })).toBe(false);
      expect(await valid({ ...value, run: { ...value.run, engineVersion: 'invalid' } })).toBe(
        false,
      );
      expect(await valid({ ...value, schemaVersion: 99 })).toBe(false);
      expect(
        await valid({
          ...value,
          run: { ...value.run, actions: Array(513).fill({ type: 'advance' }) },
        }),
      ).toBe(false);
    }
  } finally {
    await db.close();
  }
}, 120000);
