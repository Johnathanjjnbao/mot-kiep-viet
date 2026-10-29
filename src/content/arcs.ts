import type { StoryArc } from '../domain/model';
export const STORY_ARCS: StoryArc[] = [
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
