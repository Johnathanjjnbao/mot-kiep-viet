import { createRun, dispatch } from '../src/engine/engine';
import { freelanceCase } from './freelance-fixture';
import { gamingFixture, creativeStep, creativeAction } from './creative-fixture';
import { artisticOffer, artisticAction, artisticStep } from './artistic-fixture';
import { creativeFullPortfolio, nativeLongStep } from './creative-forced-fixture';
import {
  gamingContestReason,
  currentCollaboration,
  collaborationReason,
} from '../src/engine/creative-careers';
export function creativeGoldenRuns() {
  const setup = {
    cohort: 2005,
    region: 'northern-village',
    wealth: 4,
    family: 'both',
    expansion: 'family',
    lifeRules: 'creative-v1',
    currency: 'vnd-v1',
  } as const;
  const opening = createRun('creative-canonical', setup),
    freelance = freelanceCase('paid');
  let gaming = gamingFixture();
  gaming = creativeAction(gaming, 'gaming-policy', { policy: 'community' });
  for (let i = 0; i < 18 && gamingContestReason(gaming); i++) gaming = creativeStep(gaming);
  gaming = creativeAction(gaming, 'gaming-contest');
  for (let i = 0; i < 8 && gaming.creative!.gaming!.rounds[0].result === 'pending'; i++)
    gaming = creativeStep(gaming);
  let collaboration = gaming;
  for (
    let i = 0;
    i < 12 && collaborationReason(collaboration, collaboration.creator!.channels[0], 'club-host');
    i++
  )
    collaboration = creativeStep(collaboration);
  collaboration = creativeAction(collaboration, 'collab-inquire', {
    channelId: 'creator:0',
    peer: 'club-host',
  });
  collaboration = creativeAction(collaboration, 'collab-negotiate', {
    id: 'collab:0',
    terms: 'balanced',
  });
  if (currentCollaboration(collaboration)?.status === 'offered')
    collaboration = creativeAction(collaboration, 'collab-accept', { id: 'collab:0' });
  for (let i = 0; i < 14 && currentCollaboration(collaboration); i++)
    collaboration = creativeStep(collaboration);
  let artistic = artisticAction(artisticOffer('offered'), 'accept');
  for (let i = 0; i < 12 && artistic.creative!.artist!.showCount < 2; i++)
    artistic = artisticStep(artistic);
  let combined = creativeFullPortfolio();
  while (combined.actions.filter((a) => !['choose', 'advance'].includes(a.type)).length < 120)
    combined = dispatch(combined, {
      type: 'manage',
      action: combined.finance.savings ? 'withdraw-money' : 'save-money',
    });
  for (let i = 0; i < 512 && combined.status !== 'ended'; i++) combined = nativeLongStep(combined);
  let long = createRun('realism-canonical', setup);
  for (let i = 0; i < 512 && long.status !== 'ended'; i++) long = nativeLongStep(long);
  return {
    opening,
    'freelance-paid': freelance,
    'gaming-round': gaming,
    collaboration,
    'artistic-shows': artistic,
    'combined-life': combined,
    'long-life': long,
  };
}
