import { describe, it, expect } from 'vitest';
import {
  creativeChannel,
  creativeAction,
  creativeStep,
  gamingFixture,
} from '../scripts/creative-fixture';
import {
  currentCollaboration,
  gamingContestReason,
  collaborationReason,
} from '../src/engine/creative-careers';
import { creatorPolicyReason } from '../src/engine/creator-economy';
import { createRun, dispatch, replay } from '../src/engine/engine';
import { assertRun } from '../src/engine/invariants';
import { snapshot, parseSave, canonical } from '../src/persistence/saves';
function checked(r: ReturnType<typeof gamingFixture>) {
  assertRun(r);
  expect(replay(r.seed, r.setup, r.actions)).toEqual(r);
  expect(parseSave(JSON.stringify(snapshot(r))).run).toEqual(r);
}
describe('independent gaming and bounded collaboration', () => {
  it('keeps historical YouTube video-only and applies the new fictional live gate separately', () => {
    const old = createRun('old-live', {
      cohort: 2005,
      region: 'southern-city',
      lifeRules: 'realism-v1',
    });
    expect(old.creative).toBeUndefined();
    expect(
      creatorPolicyReason(
        old,
        { platform: 'youtube', audience: 1000, equipment: 2 },
        { format: 'live', rhythm: 'light', focus: 'craft', niche: 'gaming' },
      ),
    ).not.toBeNull();
    const r = creativeChannel();
    expect(r.creator!.channels[0].policy.format).toBe('live');
    checked(r);
  });
  it('rejects forged/stale actions and uses one channel instead of cloning an audience or platform income', () => {
    let r = creativeChannel();
    const c = r.creator!.channels[0],
      text = canonical(r);
    expect(() =>
      dispatch(r, {
        type: 'creative',
        operation: 'gaming-start',
        channelId: 'creator:0',
        expected: r.actions.length,
        audience: 999,
      } as never),
    ).toThrow();
    expect(() =>
      dispatch(r, {
        type: 'creative',
        operation: 'gaming-start',
        channelId: 'creator:0',
        expected: r.actions.length - 1,
      }),
    ).toThrow(/cũ/);
    expect(canonical(r)).toBe(text);
    r = creativeAction(r, 'gaming-start', { channelId: 'creator:0' });
    expect(r.creator!.channels).toHaveLength(1);
    expect(r.creator!.channels[0].audience).toBe(c.audience);
    expect(r.creative!.gaming!.totals.prizes).toBe(0);
    expect(r.creative!.gaming).not.toHaveProperty('audience');
    for (let i = 0; i < 8; i++) r = creativeStep(r);
    expect(r.creative!.gaming!.totals.training).toBeGreaterThan(0);
    expect(r.creative!.gaming!.skill).toBeGreaterThan(0);
    expect(
      r.finance.transactions.filter((t) => t.id.startsWith('gaming:')).every((t) => t.cash < 0),
    ).toBe(true);
    checked(r);
  });
  it('resolves a real competition once, retains its entry cost, and permits losses', () => {
    let r = gamingFixture();
    r = creativeAction(r, 'gaming-policy', { policy: 'community' });
    for (let i = 0; i < 18 && gamingContestReason(r); i++) r = creativeStep(r);
    expect(gamingContestReason(r)).toBeNull();
    r = creativeAction(r, 'gaming-contest');
    const fee = r.creative!.gaming!.totals.entries;
    expect(() => creativeAction(r, 'gaming-contest')).toThrow();
    for (let i = 0; i < 8 && r.creative!.gaming!.rounds[0].result === 'pending'; i++)
      r = creativeStep(r);
    const round = r.creative!.gaming!.rounds[0];
    expect(round.result).not.toBe('pending');
    expect(r.creative!.gaming!.totals.entries).toBe(fee);
    expect(r.finance.transactions.filter((t) => t.id === round.id + ':prize')).toHaveLength(
      round.prize ? 1 : 0,
    );
    checked(r);
  });
  it('pays collaboration preparation only once and closes without adding free income or duplicating followers', () => {
    let r = creativeChannel('native-stream-0');
    r = dispatch(r, {
      type: 'creator',
      operation: 'policy',
      id: 'creator:0',
      policy: { ...r.creator!.channels[0].policy, focus: 'community' },
      expected: r.actions.length,
    });
    for (let i = 0; i < 12 && collaborationReason(r, r.creator!.channels[0], 'club-host'); i++)
      r = creativeStep(r);
    expect(collaborationReason(r, r.creator!.channels[0], 'club-host')).toBeNull();
    r = creativeAction(r, 'collab-inquire', { channelId: 'creator:0', peer: 'club-host' });
    r = creativeAction(r, 'collab-negotiate', { id: 'collab:0', terms: 'balanced' });
    if (currentCollaboration(r)?.status === 'offered')
      r = creativeAction(r, 'collab-accept', { id: 'collab:0' });
    for (let i = 0; i < 14 && currentCollaboration(r); i++) r = creativeStep(r);
    const x = r.creative!.collaborations[0];
    expect(['settled', 'rejected']).toContain(x.status);
    expect(x.cost).toBeGreaterThan(0);
    expect(Math.abs(x.audienceDelta)).toBeLessThanOrEqual(2500);
    expect(
      r.finance.transactions
        .filter((t) => t.id.startsWith('collab:'))
        .every((t) => t.cash < 0 && t.debt === 0 && t.savings === 0 && t.assets === 0),
    ).toBe(true);
    expect(() => creativeAction(r, 'collab-accept', { id: 'collab:0' })).toThrow();
    checked(r);
  });
});
