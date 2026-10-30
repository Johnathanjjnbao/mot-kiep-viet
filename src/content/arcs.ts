import type { StoryArc } from '../domain/model';
export const STORY_ARCS: StoryArc[] = [
  {
    id: 'growing-own-way',
    title: 'Con đường của con',
    stages: ['family-class', 'family-exam', 'family-creative', 'family-path', 'family-career'],
  },
  {
    id: 'care-bridges',
    title: 'Những nhịp cầu trong nhà',
    stages: [
      'family-birth',
      'family-sleep',
      'family-sibling',
      'family-boundaries',
      'family-help',
      'family-legacy-memory',
    ],
  },
  {
    id: 'companionship',
    title: 'Hai chiếc chìa khóa',
    stages: ['soc-meet', 'soc-date', 'soc-exclusive', 'soc-cohabit', 'soc-proposal', 'soc-budget'],
  },
  {
    id: 'broken-promises',
    title: 'Những điều còn phải nói',
    stages: [
      'soc-temptation',
      'soc-secret',
      'soc-discovery',
      'soc-confession',
      'soc-repair',
      'soc-separate',
      'soc-divorce',
    ],
  },
  {
    id: 'business',
    title: 'Tiệm nhỏ của hai người',
    stages: ['business-invitation', 'business-ledger', 'business-crossroads'],
  },
  {
    id: 'family',
    title: 'Mái nhà qua mùa mưa',
    stages: ['family-call', 'family-followup', 'family-legacy'],
  },
  {
    id: 'recovery',
    title: 'Sau ca làm cuối',
    stages: ['career-collapse', 'career-retraining', 'career-comeback'],
  },
];
