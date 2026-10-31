import { simulateLife as simulateLegacy2 } from '../src/legacy/v2/diagnostics/simulation';
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import {
  createRun,
  advance,
  choose,
  choiceReason,
  activeDefinition,
  replay,
  eligible,
} from '../src/engine/engine';
import { FAMILIES, PARENT_TRAITS, setupSchema, WEALTH } from '../src/domain/creator';
import type { RunSetup, ParentTrait } from '../src/domain/model';
import { assertRun } from '../src/engine/invariants';
import { simulateLife } from '../src/diagnostics/simulation';
import { archiveLife, listHistory, exportHistory, importHistory } from '../src/persistence/history';
import { parseSave, snapshot, writeSave, readSave } from '../src/persistence/saves';
import {
  createRun as oldRun,
  advance as oldAdvance,
  choose as oldChoose,
  choiceReason as oldChoiceReason,
  activeDefinition as oldActive,
} from '../src/legacy/v1/engine/engine';
import { snapshot as oldSnapshot } from '../src/legacy/v1/persistence/saves';
import { EVENTS, FALLBACK } from '../src/content/events';
import { validateContent } from '../src/content/validation';
import { eventEligible } from '../src/engine/engine';
import { hashSeed } from '../src/engine/random';
const base: RunSetup = {
  cohort: 2026,
  region: 'central-coast',
  name: 'Trần Ánh Nguyệt',
  birthplace: 'Xóm Cát, quê mình',
  environment: 'rural',
  wealth: 2,
  family: 'both',
  motherTraits: [],
  fatherTraits: [],
};
function upTo18(setup: RunSetup, pressure = 0) {
  let r = createRun('parent-rules', setup);
  if (pressure) r.player.stats.stress = pressure;
  while (r.month < 216) {
    if (r.activeEvent) {
      const e = activeDefinition(r)!;
      r = choose(r, e.id, e.choices.find((c) => !choiceReason(r, c))!.id);
    } else r = advance(r);
  }
  return r;
}
describe('v0.2 creator and families', () => {
  it('replays randomized and normalized settings without stream drift', () => {
    for (let i = 0; i < 20; i++) {
      const r = advance(createRun('random-' + i));
      expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
    }
  });
  it('plays every birth year 1975–2026 to a valid ending', () => {
    for (let year = 1975; year <= 2026; year++) {
      const r = simulateLife('year-' + year, { ...base, cohort: year }, year % 5);
      assertRun(r);
      expect(r.status).toBe('ended');
      expect(r.player.name).toBe(base.name);
      expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
    }
  }, 120_000); // This bounded batch completes and replays all 52 supported birth years.
  it('keeps geography profile separate from the Unicode birthplace label', () => {
    for (const region of ['central-coast', 'northern-village', 'southern-city'] as const) {
      const r = createRun('place', { ...base, region });
      expect(r.player.region).toBe(region);
      expect(r.journal[0].text).toContain(base.birthplace);
      expect(r.setup.environment).toBe('rural');
    }
  });
  it('has five socioeconomic levels with different starting money and monthly support', () => {
    const runs = WEALTH.map((_, wealth) =>
      upTo18({ ...base, wealth: wealth as RunSetup['wealth'] }),
    );
    expect(new Set(runs.map((r) => r.finance.transactions[0].cash)).size).toBe(5);
    expect(
      new Set(runs.map((r) => r.finance.transactions.find((t) => t.id === 'month:1:family')!.cash))
        .size,
    ).toBe(5);
  });
  for (const family of Object.keys(FAMILIES) as NonNullable<RunSetup['family']>[])
    it(`respects ${family} and never equates unknown/nonresident with death`, () => {
      const r = createRun('family', { ...base, family });
      const residents = r.npcs.filter((n) => n.presence === 'resident');
      expect(residents).toHaveLength(family === 'both' ? 2 : 1);
      for (const n of r.npcs.filter((n) => n.id === 'mother' || n.id === 'father')) {
        expect(n.alive).toBe(n.presence === 'unknown' ? null : true);
        expect(eligible(r, { npc: n.id })).toBe(n.presence !== 'unknown');
      }
      assertRun(advance(r));
    });
  for (const trait of Object.keys(PARENT_TRAITS) as ParentTrait[])
    it(`makes ${trait} mechanical`, () => {
      const plain = upTo18(base, 60),
        modified = upTo18({ ...base, motherTraits: [trait] }, 60);
      expect({
        stats: modified.player.stats,
        cash: modified.finance.cash,
        relations: modified.relationships,
      }).not.toEqual({
        stats: plain.player.stats,
        cash: plain.finance.cash,
        relations: plain.relationships,
      });
    });
  it('rejects malformed identity, out-of-range year and incompatible traits', () => {
    for (const patch of [
      { name: '<script>' },
      { name: '' },
      { cohort: 2027 },
      { motherTraits: ['strict', 'easygoing'] },
      { fatherTraits: ['frugal', 'generous'] },
      { birthplace: 'a\u0000b' },
    ])
      expect(setupSchema.safeParse({ ...base, ...patch }).success).toBe(false);
  });
});
describe('choice guarantees and legacy compatibility', () => {
  it('authors 5–6 paths per template and four for the quiet-year fallback', () => {
    expect(EVENTS.filter((e) => e.version !== 6)).toHaveLength(115);
    for (const e of EVENTS) expect(e.choices.length).toBeGreaterThanOrEqual(e.version === 2 ? 5 : 4);
    expect(FALLBACK.choices).toHaveLength(4);
  });
  it('offers four enabled choices even for poor single-parent households and records divergent outcomes', () => {
    let r = advance(createRun('four', { ...base, wealth: 0, family: 'father-only' }));
    for (let i = 0; i < 20 && r.status !== 'ended'; i++) {
      const e = activeDefinition(r)!;
      const cs = e.choices.filter((c) => !choiceReason(r, c));
      expect(cs.length).toBeGreaterThanOrEqual(4);
      const a = choose(r, e.id, cs[0].id),
        b = choose(r, e.id, cs[1].id);
      expect({
        stats: a.player.stats,
        cash: a.finance.cash,
        scheduled: a.scheduled,
        education: a.player.education,
      }).not.toEqual({
        stats: b.player.stats,
        cash: b.finance.cash,
        scheduled: b.scheduled,
        education: b.player.education,
      });
      r = advance(choose(r, e.id, cs[0].id));
    }
  });
  it('reads untouched v1 snapshots and refuses to replay them under v2', async () => {
    const r = oldRun('legacy-safe'),
      s = oldSnapshot(r);
    expect(parseSave(JSON.stringify(s)).run).toEqual(r);
    expect(() => advance(parseSave(JSON.stringify(s)).run)).toThrow(/v1/);
    await writeSave('slot-3', r);
    expect((await readSave('slot-3'))!.run).toEqual(r);
  });
});
it('detects four-choice shortfalls, broken delayed effects and self-dependent chains', () => {
  const r = createRun('eligibility'),
    tooFew = { ...FALLBACK, choices: FALLBACK.choices.slice(0, 3) };
  expect(eventEligible(r, tooFew)).toBe(false);
  const pack = structuredClone(EVENTS);
  pack[0].condition.flags = ['self-lock'];
  pack[0].choices[0].effects.push(
    { kind: 'flag', flag: 'self-lock', value: true },
    { kind: 'schedule', afterMonths: 0, label: 'invalid', effects: [] },
  );
  expect(validateContent(pack).errors.join()).toContain('Unreachable event chain');
});
it('locks the intentionally new v2 replay separately from the unchanged v1 golden', () => {
  const r = simulateLegacy2(
    'golden-v02',
    {
      cohort: 2026,
      region: 'central-coast',
      name: 'Ánh Nguyệt',
      birthplace: 'Xóm Cát',
      wealth: 1,
      family: 'with-mother',
      motherTraits: ['academic'],
      fatherTraits: ['distant'],
    },
    2,
  );
  expect(hashSeed(JSON.stringify(r))).toBe(4148875142);
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
});
describe('independent immutable life history', () => {
  it('archives once, retains two identical-seed lives with distinct IDs, and roundtrips safely', async () => {
    const run = simulateLegacy2('archive-same', base, 2),
      id = crypto.randomUUID(),
      second = crypto.randomUUID();
    await archiveLife(run, id);
    const first = (await listHistory()).find((r) => r.id === id)!;
    await archiveLife(run, id);
    expect((await listHistory()).filter((r) => r.id === id)).toHaveLength(1);
    expect((await listHistory()).find((r) => r.id === id)!.createdAt).toBe(first.createdAt);
    await archiveLife(run, second);
    expect((await listHistory()).length).toBe(2);
    createRun('another');
    await writeSave('autosave', createRun('new-active'));
    expect((await listHistory()).length).toBe(2);
    const exported = exportHistory(await listHistory());
    expect(await importHistory(exported)).toBe(2);
    expect((await listHistory()).length).toBe(2);
    const bad = JSON.parse(exported);
    bad.records[0].memoir = 'Thành tựu bịa';
    await expect(importHistory(JSON.stringify(bad))).rejects.toThrow();
    const conflict = structuredClone(run);
    conflict.player.name = 'Khác';
    await expect(archiveLife(conflict, id)).rejects.toThrow(/Trùng mã/);
    expect((await listHistory()).length).toBe(2);
    await expect(importHistory('{bad')).rejects.toThrow();
    await expect(
      importHistory(JSON.stringify({ format: 'mot-kiep-viet-history', version: 99, records: [] })),
    ).rejects.toThrow();
    await expect(importHistory(' '.repeat(20 * 1024 * 1024 + 1))).rejects.toThrow(/20 MiB/);
    await expect(archiveLife(createRun('unfinished'), crypto.randomUUID())).rejects.toThrow();
  });
  it('retains a completed v1 life and its original memoir in the new history store', async () => {
    let run = oldRun('completed-legacy');
    while (run.status !== 'ended') {
      if (!run.activeEvent) run = oldAdvance(run);
      else {
        const e = oldActive(run)!;
        run = oldChoose(run, e.id, e.choices.find((c) => !oldChoiceReason(run, c))!.id);
      }
    }
    const loaded = parseSave(JSON.stringify(oldSnapshot(run)));
    const id = crypto.randomUUID();
    await archiveLife(loaded.run, id);
    const record = (await listHistory()).find((r) => r.id === id)!;
    expect(record.save.run).toEqual(run);
    expect(await importHistory(exportHistory([record]))).toBe(1);
  });
});
