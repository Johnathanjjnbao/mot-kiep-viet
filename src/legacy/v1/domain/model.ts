export const ENGINE_VERSION = '1.0.0';
export const CONTENT_VERSION = '1.0.0';
export const SAVE_VERSION = 2;
export type RegionId = 'southern-city' | 'northern-village' | 'central-coast';
export type Cohort = 1975 | 1995 | 2005;
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
  id: string;
  name: string;
  role: 'mother' | 'father' | 'friend' | 'partner' | 'child';
  birthYear: number;
  alive: boolean;
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
  | 'save-money'
  | 'withdraw-money'
  | 'borrow'
  | 'repay'
  | 'buy-home'
  | 'move-home'
  | 'apply-job'
  | 'quit-job';
export type RunAction =
  | { type: 'advance' }
  | { type: 'choose'; eventId: string; choiceId: string }
  | { type: 'manage'; action: ManageAction; career?: CareerId };
export interface RunSetup {
  cohort: Cohort;
  region: RegionId;
}
export interface GameRun {
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
