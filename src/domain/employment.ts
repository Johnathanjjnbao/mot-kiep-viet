import type { CareerId } from './model';
export type EmploymentOperation = 'search' | 'temporary' | 'train' | 'rest';
export type EmploymentEnding =
  'resigned' | 'switched' | 'layoff' | 'contract-ended' | 'retired' | 'story';
export interface EmploymentState {
  applications: {
    id: string;
    career: CareerId;
    month: number;
    result: 'accepted' | 'rejected';
    probability: number;
    source: 'panel' | 'story' | 'support';
  }[];
  periods: { startMonth: number; endMonth: number | null }[];
  trainingMonths: number[];
  placements: number[];
  notice: boolean;
}
