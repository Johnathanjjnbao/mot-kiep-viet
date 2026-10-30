import type { EventInstance } from './model';
export type ParentingStyle =
  | 'support'
  | 'discipline'
  | 'achievement'
  | 'explore'
  | 'protect'
  | 'distant'
  | 'inconsistent'
  | 'balanced';
export type ChildInterest = 'academic' | 'practical' | 'creative' | 'technology';
export interface ChildDevelopment {
  npcId: string;
  bornMonth: number;
  parents: [string, string];
  caregivers: string[];
  visitingParents: string[];
  custody: 'shared' | 'player' | 'guardian' | 'independent';
  inHousehold: boolean;
  temperament: 'curious' | 'cautious' | 'intense' | 'easygoing';
  interest: ChildInterest;
  tendencies: {
    confidence: number;
    curiosity: number;
    discipline: number;
    ambition: number;
    stress: number;
  };
  wellbeing: number;
  bond: number;
  skills: { study: number; craft: number; art: number; technology: number };
  patterns: Record<ParentingStyle, number>;
  caregiverBonds: Record<string, number>;
  education: string;
  parentPreference: ChildInterest | null;
  aspiration: string;
  occupation: string | null;
  adultFamily: boolean;
  memories: { month: number; text: string; style?: ParentingStyle }[];
}
export interface FamilyState {
  children: ChildDevelopment[];
  nextBirth: { dueMonth: number; parentId: string } | null;
  queue: { templateId: string; childId: string; dueMonth: number }[];
  focus: {
    templateId: string;
    childId: string;
    instanceId: string;
    resume: EventInstance | null;
  } | null;
  encounters: Record<string, number>;
}
export interface FamilyAction {
  type: 'family-talk';
  templateId: string;
  childId: string;
  expected: number;
}
