import type { EventInstance } from './model';
export const PROGRAM_IDS = [
  'it',
  'engineering',
  'health',
  'business',
  'accounting',
  'finance',
  'law',
  'education',
  'korean',
  'english',
  'design',
  'communications',
] as const;
export type ProgramId = (typeof PROGRAM_IDS)[number];
export type AcademicMethod = 'steady' | 'project' | 'work' | 'rest';
export interface StudyRecord {
  id: string;
  programId: ProgramId;
  startMonth: number;
  endMonth: number | null;
  status: 'studying' | 'paused' | 'dropped' | 'switched' | 'graduated' | 'failed';
  completedYears: number;
  termAttempts: number;
  paidTerms: number;
  nextTermMonth: number;
  pausedMonth: number | null;
  internship: boolean;
  results: { month: number; method: AcademicMethod; score: number; passed: boolean }[];
}
export interface AcademicState {
  applications: {
    id: string;
    programId: ProgramId;
    month: number;
    result: 'accepted' | 'rejected';
    probability: number;
  }[];
  studies: StudyRecord[];
  qualifications: { studyId: string; programId: ProgramId; awardedMonth: number; kind: 'degree' }[];
  focus: { studyId: string; instanceId: string; resume: EventInstance | null } | null;
}
export interface AcademicAction {
  type: 'academic';
  operation: 'apply' | 'pause' | 'resume' | 'dropout' | 'switch' | 'term';
  program?: ProgramId;
  expected: number;
}
