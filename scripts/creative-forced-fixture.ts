import type { GameRun } from '../src/domain/model';
import { admittedStudent, advanceStudy } from './academic-fixture';
import { artisticAction, artisticStep } from './artistic-fixture';
import { freelanceStep, projectAction } from './freelance-fixture';
import { creativeAction, creativeStep } from './creative-fixture';
import { friendly, talk } from './social-fixture';
import { growFamily } from './family-fixture';
import { found } from './business-fixture';
import { startChannel } from './creator-economy-fixture';
import { activeDefinition, dispatch } from '../src/engine/engine';
import { CAREERS, careerReason, currentCareer, ageOf } from '../src/content/world';
import { creatorReason } from '../src/engine/creator-economy';
import { businessReason } from '../src/engine/business';
import { currentProject, freelanceReason } from '../src/engine/freelance';
import { artisticReason, artisticReadiness } from '../src/engine/artistic';
import {
  creativeReason,
  gamingStartReason,
  collaborationReason,
  currentCollaboration,
} from '../src/engine/creative-careers';
export function nativeLongStep(r: GameRun) {
  const e = activeDefinition(r);
  return e?.version === 13
    ? freelanceStep(r)
    : e?.version === 14
      ? creativeStep(r)
      : artisticStep(r);
}
export function creativeGraduateParent(startIndex = 0) {
  const seen = new Set<string>();
  for (let i = startIndex; i < startIndex + 80; i++) {
    let n = admittedStudent('it', i, 'creative-v1', 'vnd-v1').run;
    if (seen.has(n.seed)) continue;
    seen.add(n.seed);
    const p = n.social!.people[0];
    if (!p.romanticOpen || !p.exclusivityOpen || !p.marriageOpen || !p.wantsChildren) continue;
    n = advanceStudy(n, 'project');
    if (!n.academics!.qualifications.length) continue;
    const job = CAREERS.filter(
      (c) => !['business', 'freelance'].includes(c.id) && !careerReason(n, c.id),
    ).at(-1);
    if (!job) continue;
    n = dispatch(n, { type: 'manage', action: 'apply-job', career: job.id });
    if (!currentCareer(n)) continue;
    for (let j = 0; j < 6; j++) n = nativeLongStep(n);
    n = friendly(n, 'friend');
    n = talk(n, 'soc-date', 'friend', 'date');
    n = talk(n, 'soc-exclusive', 'friend', 'exclusive');
    n = growFamily(n, ageOf(n) + 2); // Respect the second round of conversation cooldowns in adulthood.
    n = talk(n, 'soc-listen', 'friend', 'listen');
    n = talk(n, 'soc-book', 'friend', 'learn');
    n = talk(n, 'soc-boundary', 'friend', 'respect');
    n = talk(n, 'soc-cohabit', 'friend', 'cohabit');
    n = talk(n, 'soc-proposal', 'friend', 'propose');
    n = talk(n, 'soc-child-plan', 'friend', 'plan-child');
    n = growFamily(n, ageOf(n) + 2);
    for (let j = 0; j < 5 && n.family!.children.length < 3; j++) {
      n = talk(n, 'soc-child-plan', 'friend', 'plan-child');
      n = growFamily(n, ageOf(n) + 2);
    }
    return n;
  }
  throw Error('No genuine graduate parent');
}
export function creativeFullPortfolio(startIndex = 0) {
  let r = creativeGraduateParent(startIndex);
  for (let i = 0; i < 24 && businessReason(r); i++) r = nativeLongStep(r);
  r = found(r, 4000000);
  r = startChannel(r, 'youtube', {
    format: 'video',
    rhythm: 'light',
    focus: 'craft',
    niche: 'gaming',
  });
  for (let i = 0; i < 24 && freelanceReason(r); i++) r = nativeLongStep(r);
  r = projectAction(r, 'inquire', { service: 'writing' });
  r = projectAction(r, 'negotiate', { terms: 'modest' });
  if (currentProject(r)?.status === 'offered') r = projectAction(r, 'accept');
  for (let i = 0; i < 24 && artisticReason(r); i++) r = nativeLongStep(r);
  r = artisticAction(r, 'start', { discipline: 'acting' });
  for (let step = 0; step < 120; step++) {
    const c = r.creator!.channels[0],
      g = r.creative!.gaming,
      a = r.creative!.artist!,
      p = currentProject(r),
      x = currentCollaboration(r);
    if (!creatorReason(r)) {
      if (c.equipment < 2) {
        r = dispatch(r, {
          type: 'creator',
          operation: 'equipment',
          id: 'creator:0',
          expected: r.actions.length,
        });
        continue;
      }
      if (c.audience >= 1000 && c.policy.format === 'video') {
        r = dispatch(r, {
          type: 'creator',
          operation: 'policy',
          id: 'creator:0',
          policy: { ...c.policy, format: 'live' },
          expected: r.actions.length,
        });
        continue;
      }
    }
    if (!creativeReason(r)) {
      if (!g && !gamingStartReason(r, c)) {
        r = creativeAction(r, 'gaming-start', { channelId: 'creator:0' });
        continue;
      }
      if (!r.creative!.collaborations.length && !collaborationReason(r, c, 'club-host')) {
        r = creativeAction(r, 'collab-inquire', { channelId: 'creator:0', peer: 'club-host' });
        continue;
      }
      if (x?.status === 'proposal') {
        r = creativeAction(r, 'collab-negotiate', { id: x.id, terms: 'balanced' });
        continue;
      }
      if (x?.status === 'offered' && c.status === 'active') {
        r = creativeAction(r, 'collab-accept', { id: x.id });
        continue;
      }
    }
    if (!artisticReason(r) && a.status === 'training' && !artisticReadiness(r)) {
      r = artisticAction(r, 'independent');
      continue;
    }
    if (p && !freelanceReason(r)) {
      if (p.status === 'ready') {
        r = projectAction(r, 'deliver');
        continue;
      }
      if (p.status === 'rework') {
        r = projectAction(r, 'revise');
        continue;
      }
    }
    if (g && r.creative!.collaborations.length && !currentCollaboration(r) && a.showCount > 0 && !p)
      return r;
    r = nativeLongStep(r);
  }
  throw Error('Incomplete genuine four-book portfolio');
}
