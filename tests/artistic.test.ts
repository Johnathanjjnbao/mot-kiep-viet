import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  artisticAction,
  artisticReady,
  artisticStep,
  artisticOffer,
} from '../scripts/artistic-fixture';
import { freelanceAdult, projectAction } from '../scripts/freelance-fixture';
import { dispatch, replay, createRun, activeDefinition } from '../src/engine/engine';
import { artisticReadiness, artisticReason, artisticNet } from '../src/engine/artistic';
import { assertRun } from '../src/engine/invariants';
import { careerReason, currentCareer } from '../src/content/world';
import { canonical, snapshot, parseSave } from '../src/persistence/saves';
function checked(r: ReturnType<typeof artisticReady>) {
  assertRun(r);
  expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
}
describe('independent artistic career', () => {
  it('reaches the first-show scene through a genuine early-career canonical prefix', () => {
    const f = JSON.parse(readFileSync('tests/data/creative-first-show-prefix.json', 'utf8'));
    const r = replay(f.seed, f.setup, f.actions);
    expect(activeDefinition(r)?.id).toBe('ar-first-show');
    expect(r.creative!.artist!.status).toBe('active');
    expect(r.creative!.artist!.showCount).toBe(0);
    expect(activeDefinition(r)!.choices.length).toBeGreaterThanOrEqual(4);
    checked(r);
  });
  it('keeps old lives and children outside the new career and rejects forged/stale requests atomically', () => {
    const old = createRun('old-stage', {
      cohort: 2005,
      region: 'southern-city',
      lifeRules: 'realism-v1',
    });
    expect(old.creative).toBeUndefined();
    expect(() => artisticAction(old, 'start', { discipline: 'music' })).toThrow();
    const r = freelanceAdult(),
      text = canonical(r);
    expect(() =>
      dispatch(r, {
        type: 'artistic',
        operation: 'start',
        discipline: 'music',
        expected: r.actions.length,
        fee: 1,
      } as never),
    ).toThrow();
    expect(() =>
      dispatch(r, {
        type: 'artistic',
        operation: 'start',
        discipline: 'music',
        expected: r.actions.length - 1,
      }),
    ).toThrow(/cũ/);
    expect(canonical(r)).toBe(text);
    checked(r);
  });
  it('trains all three disciplines with real money, time and zero automatic fans or income', () => {
    for (const discipline of ['music', 'dance', 'acting'] as const) {
      const r = artisticReady('native-stage-0', discipline),
        p = r.creative!.artist!;
      expect(p.discipline).toBe(discipline);
      expect(p.trainingMonths).toBeGreaterThanOrEqual(12);
      expect(p.totals.training).toBeGreaterThan(3000000);
      expect(p.fans).toBe(0);
      expect(p.totals.received).toBe(0);
      checked(r);
    }
  });
  it('really rejects an audition and never calls an offer income or guaranteed fame', () => {
    for (const kind of ['offered', 'rejected'] as const) {
      const r = artisticOffer(kind),
        p = r.creative!.artist!;
      expect(p.auditions[0].result).toBe(kind);
      expect(p.totals.audition).toBe(800000);
      expect(p.totals.received).toBe(0);
      expect(p.fans).toBe(0);
      checked(r);
    }
  });
  it('settles show gross/share/net once, permits zero-fee losses and keeps every invoice after replay', () => {
    let r = artisticOffer('offered');
    r = artisticAction(r, 'accept');
    for (let i = 0; i < 12 && r.creative!.artist!.showCount < 2; i++) r = artisticStep(r);
    const p = r.creative!.artist!;
    expect(p.showCount).toBeGreaterThan(0);
    expect(p.totals.gross).toBe(p.totals.received + p.totals.agencyCut);
    for (const s of p.recent) {
      expect(s.gross).toBe(s.agencyCut + s.received);
      expect(s.agencyCut).toBe(Math.floor(s.gross * 0.45));
      expect(r.finance.transactions.filter((t) => t.id === s.id + ':payout')).toHaveLength(
        s.received ? 1 : 0,
      );
    }
    expect(artisticNet(p)).toBe(
      p.totals.received -
        p.totals.training -
        p.totals.audition -
        p.totals.stage -
        p.totals.comeback,
    );
    checked(r);
    const negative = artisticAction(artisticReady(), 'independent');
    let loss = negative;
    for (let i = 0; i < 8 && loss.creative!.artist!.showCount < 1; i++) loss = artisticStep(loss);
    expect(loss.creative!.artist!.totals.stage).toBeGreaterThan(0);
    expect(artisticNet(loss.creative!.artist!)).toBeLessThan(0);
    checked(loss);
  });
  it('retains one shared book at retirement, allows a paid comeback once, and respects its preparation time', () => {
    let r = artisticReady();
    for (let i = 0; i < 12 && artisticReason(r); i++) r = artisticStep(r);
    r = artisticAction(r, 'retire');
    const cost = r.creative!.artist!.totals.training;
    r = artisticAction(r, 'comeback');
    expect(r.creative!.artist!.comebackUsed).toBe(true);
    expect(artisticReadiness(r)).not.toBeNull();
    expect(r.creative!.artist!.totals.training).toBe(cost);
    expect(r.creative!.artist!.totals.comeback).toBe(1000000);
    r = artisticAction(r, 'retire');
    expect(() => artisticAction(r, 'comeback')).toThrow(/một lần/);
    for (let i = 0; i < 3; i++) {
      r = projectAction(r, 'inquire', { service: 'writing' });
      r = projectAction(r, 'close');
    }
    expect(() => projectAction(r, 'inquire', { service: 'writing' })).toThrow(/bốn/);
    checked(r);
  });
  it('cannot restart an artistic book while receiving the abstract business salary after retirement', () => {
    let found = false;
    for (let i = 0; i < 40; i++) {
      let r = artisticAction(artisticReady('native-stage-' + i), 'retire');
      if (careerReason(r, 'business')) continue;
      r = dispatch(r, { type: 'manage', action: 'apply-job', career: 'business' });
      if (currentCareer(r)?.id !== 'business') continue;
      const text = canonical(r);
      expect(() => artisticAction(r, 'comeback')).toThrow(/lương khoán/);
      expect(canonical(r)).toBe(text);
      checked(r);
      found = true;
      break;
    }
    expect(found).toBe(true);
  });
});
