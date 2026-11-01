import type { Enterprise } from './enterprise';
import type { EnterpriseAction } from './enterprise-actions';
import type { BusinessOperation } from './enterprise-actions';
import type { FamilyState, FamilyAction, ParentingStyle } from './family';
import type { SocialState, SocialAction, SocialOperation } from './social';
import type { PlayerPersonality } from './personality';
import type { AcademicState, AcademicAction, AcademicMethod } from './academics';
import type { EmploymentState, EmploymentEnding, EmploymentOperation } from './employment';
export const ENGINE_VERSION = '3.0.0';
export const CONTENT_VERSION = '3.0.0';
export const SAVE_VERSION = 4;
export type RegionId = 'southern-city' | 'northern-village' | 'central-coast';
export type Cohort = number;
export type FamilyStructure =
  'both' | 'father-only' | 'mother-only' | 'with-father' | 'with-mother';
export type ParentTrait =
  | 'gentle'
  | 'strict'
  | 'easygoing'
  | 'ambitious'
  | 'frugal'
  | 'generous'
  | 'anxious'
  | 'adventurous'
  | 'distant'
  | 'academic';
export type Stat = 'health' | 'mood' | 'knowledge' | 'skill' | 'social' | 'stress';
export type Stats = Record<Stat, number>;
export type EducationLevel = 'none' | 'general' | 'vocational' | 'university' | 'self';
export type CareerId =
  | 'farm'
  | 'labor'
  | 'trade'
  | 'retail'
  | 'service'
  | 'office'
  | 'teacher'
  | 'tech'
  | 'freelance'
  | 'business';
export type Category =
  'childhood' | 'education' | 'career' | 'relationship' | 'finance' | 'history' | 'humor';
export interface Region {
  id: RegionId;
  name: string;
  short: string;
  environment: 'urban' | 'rural' | 'coastal';
  story: string;
}
export interface WorldState {
  year: number;
  eraId: string;
  eraName: string;
  fictional: boolean;
  wageFactor: number;
  costFactor: number;
  technologies: string[];
}
export interface EducationRecord {
  level: EducationLevel;
  startMonth: number;
  endMonth: number;
}
export interface CareerRecord {
  ending?: EmploymentEnding;
  contractEndMonth?: number;
  field?: 'related' | 'outside' | 'none';
  id: CareerId;
  startMonth: number;
  endMonth: number | null;
  experience: number;
  level: number;
  incomeFactor: number;
}
export interface Player {
  name: string;
  birthYear: Cohort;
  region: RegionId;
  stats: Stats;
  traits: string[];
  education: EducationRecord[];
  careers: CareerRecord[];
  alive: boolean;
}
export interface Household {
  background: string;
  resources: number;
  housing: 'family' | 'rent' | 'owned';
  moved: boolean;
}
export interface NPC {
  presence?: 'resident' | 'nonresident' | 'unknown' | 'deceased';
  personality?: ParentTrait[];
  id: string;
  name: string;
  role: 'mother' | 'father' | 'friend' | 'partner' | 'child';
  birthYear: number;
  alive: boolean | null;
}
export interface Relationship {
  npcId: string;
  type: 'family' | 'friend' | 'partner' | 'ex' | 'child';
  strength: number;
  history: string[];
}
export interface Transaction {
  id: string;
  month: number;
  label: string;
  cash: number;
  savings: number;
  debt: number;
  assets: number;
}
export interface Asset {
  id: string;
  name: string;
  value: number;
}
export interface Liability {
  id: string;
  principal: number;
  monthlyRate: number;
}
export interface FinancialAccount {
  cash: number;
  savings: number;
  assets: Asset[];
  liability: Liability;
  transactions: Transaction[];
  settledThrough: number;
}
export interface HealthState {
  lifestyle: number;
}
export interface EventInstance {
  id: string;
  month: number;
}
export interface ChoiceRecord {
  eventId: string;
  choiceId: string;
  month: number;
  outcome: string;
}
export interface JournalEntry {
  id: string;
  month: number;
  title: string;
  text: string;
  category: Category | 'life' | 'system';
  choice?: string;
}
export type LifeJournal = JournalEntry[];
export type Effect =
  | { kind: 'enterprise'; operation: BusinessOperation }
  | { kind: 'employment'; operation: EmploymentOperation }
  | { kind: 'academic'; method: AcademicMethod }
  | { kind: 'parenting'; style: ParentingStyle }
  | { kind: 'social'; operation: SocialOperation }
  | { kind: 'presentation'; context: PresentationContext }
  | { kind: 'stat'; stat: Stat; amount: number }
  | { kind: 'cash'; amount: number; label: string }
  | { kind: 'flag'; flag: string; value: boolean }
  | { kind: 'education'; level: EducationLevel; years: number }
  | { kind: 'career'; career: CareerId | null }
  | { kind: 'relationship'; target: 'mother' | 'father' | 'friend' | 'partner'; amount: number }
  | { kind: 'family'; action: 'partner' | 'breakup' | 'child' }
  | { kind: 'housing'; housing: 'family' | 'rent' | 'owned' }
  | { kind: 'habit'; amount: number }
  | { kind: 'schedule'; afterMonths: number; label: string; effects: Effect[] };
export interface ScheduledEffect {
  id: string;
  dueMonth: number;
  source: string;
  label: string;
  effects: Effect[];
  executed: boolean;
}
export interface Condition {
  minAge?: number;
  maxAge?: number;
  minYear?: number;
  maxYear?: number;
  region?: RegionId;
  housing?: Household['housing'];
  job?: 'employed' | 'unemployed' | CareerId;
  education?: EducationLevel[];
  minStats?: Partial<Stats>;
  maxStats?: Partial<Stats>;
  flags?: string[];
  absent?: string[];
  partner?: boolean;
  npc?: string;
  minCash?: number;
  technology?: string;
  minDebt?: number;
}
export interface Choice {
  id: string;
  text: string;
  hint: string;
  outcome: string;
  effects: Effect[];
  requires?: Condition;
  chance?: {
    probability: number;
    success: Effect[];
    failure: Effect[];
    successText: string;
    failureText: string;
  };
}
export interface EventDefinition {
  id: string;
  version: number;
  category: Category;
  title: string;
  text: string;
  condition: Condition;
  weight: number;
  cooldown: number;
  once: boolean;
  priority: number;
  choices: Choice[];
  sensitivity: string[];
  provenance: { kind: 'designed' | 'historical-context'; source?: string; note: string };
  arc?: string;
}
export interface StoryArc {
  id: string;
  title: string;
  stages: string[];
}
export type ManageAction =
  | 'train-job'
  | 'temporary-job'
  | 'save-money'
  | 'withdraw-money'
  | 'borrow'
  | 'repay'
  | 'buy-home'
  | 'move-home'
  | 'apply-job'
  | 'quit-job';
export type WardrobeAction = {
  type: 'wardrobe';
  operation: 'buy' | 'equip' | 'unequip' | 'save-outfit' | 'wear-outfit';
  item: string;
  expected: number;
};
export type WearSlot = 'top' | 'bottom' | 'outer' | 'shoes' | 'hair' | 'accessory';
export interface Wardrobe {
  owned: string[];
  equipped: Partial<Record<WearSlot, string>>;
  outfits: { id: string; name: string; equipped: Partial<Record<WearSlot, string>> }[];
  memories: string[];
}
export type PresentationContext = 'interview' | 'ceremony' | 'exercise' | 'creative' | 'thrifty';
export type RunAction =
  | EnterpriseAction
  | AcademicAction
  | FamilyAction
  | SocialAction
  | WardrobeAction
  | { type: 'advance' }
  | { type: 'choose'; eventId: string; choiceId: string }
  | { type: 'manage'; action: ManageAction; career?: CareerId };
export interface RunSetup {
  /** Immutable denomination; absent historical saves retain design money. */
  currency?: 'dsm-v1' | 'vnd-v1';
  lifeRules?: 'dynamic-v1' | 'education-v1' | 'career-v1' | 'annual-v1' | 'enterprise-v1';
  expansion?: 'wardrobe' | 'social' | 'family';
  cohort: Cohort;
  region: RegionId;
  name?: string;
  birthplace?: string;
  environment?: 'urban' | 'rural';
  wealth?: 0 | 1 | 2 | 3 | 4;
  family?: FamilyStructure;
  motherTraits?: ParentTrait[];
  fatherTraits?: ParentTrait[];
  /** Immutable opt-in; absent saves retain the released seeded personality rules. */
  playerTraits?: PlayerPersonality[];
}
export interface GameRun {
  enterprise?: { ventures: Enterprise[]; lastSceneMonth: number };
  employment?: EmploymentState;
  academics?: AcademicState;
  wardrobe?: Wardrobe;
  social?: SocialState;
  family?: FamilyState;
  engineVersion: string;
  contentVersion: string;
  id: string;
  seed: string;
  setup: RunSetup;
  rng: { world: number; event: number };
  month: number;
  status: 'intro' | 'playing' | 'ended';
  ending: 'death' | 'memoir' | null;
  player: Player;
  world: WorldState;
  household: Household;
  npcs: NPC[];
  relationships: Relationship[];
  finance: FinancialAccount;
  health: HealthState;
  flags: Record<string, boolean>;
  seen: Record<string, number>;
  activeEvent: EventInstance | null;
  scheduled: ScheduledEffect[];
  journal: LifeJournal;
  choices: ChoiceRecord[];
  actions: RunAction[];
  lastOutcome: string | null;
}
export interface SaveSnapshot {
  identity?: string;
  schemaVersion: number;
  engineVersion: string;
  contentVersion: string;
  savedAt: string;
  run: GameRun;
}
export interface CareerDefinition {
  id: CareerId;
  name: string;
  from: number;
  minAge: number;
  education: EducationLevel[];
  knowledge: number;
  skill: number;
  baseIncome: number;
  stability: number;
  progression: string;
  categories: Category[];
  description: string;
}
