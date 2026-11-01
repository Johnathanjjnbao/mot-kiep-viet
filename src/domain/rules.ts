import type { GameRun } from './model';
type Context = Pick<GameRun, 'setup'>;
export const hasEnterpriseRules = (r: Context) => r.setup.lifeRules === 'enterprise-v1';
export const hasAnnualRules = (r: Context) =>
  r.setup.lifeRules === 'annual-v1' || hasEnterpriseRules(r);
export const hasEmploymentRules = (r: Context) =>
  r.setup.lifeRules === 'career-v1' || hasAnnualRules(r);
export const hasAcademicRules = (r: Context) =>
  r.setup.lifeRules === 'education-v1' || hasEmploymentRules(r);
export const discretionaryCount = (r: GameRun) =>
  r.actions.filter((a) => !['choose', 'advance'].includes(a.type)).length;
