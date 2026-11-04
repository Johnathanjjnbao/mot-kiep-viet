import type { GameRun } from './model';
type Context = Pick<GameRun, 'setup'>;
export const hasAssetsRules = (r: Context) => r.setup.lifeRules === 'assets-v1';
export const hasStableRules = (r: Context) =>
  r.setup.lifeRules === 'stable-v1' || hasAssetsRules(r);
export const hasCreativeRules = (r: Context) =>
  r.setup.lifeRules === 'creative-v1' || hasStableRules(r);
export const hasRealismRules = (r: Context) =>
  r.setup.lifeRules === 'realism-v1' || hasCreativeRules(r);
export const detailedBooks = (r: GameRun) =>
  (r.enterprise?.ventures.length ?? 0) +
  (r.creator?.channels.length ?? 0) +
  (r.freelance?.projects.length ?? 0) +
  (r.creative?.artist ? 1 : 0);
export const hasCreatorRules = (r: Context) =>
  r.setup.lifeRules === 'creator-v1' || hasRealismRules(r);
export const hasEnterpriseRules = (r: Context) =>
  r.setup.lifeRules === 'enterprise-v1' || hasCreatorRules(r);
export const hasAnnualRules = (r: Context) =>
  r.setup.lifeRules === 'annual-v1' || hasEnterpriseRules(r);
export const hasEmploymentRules = (r: Context) =>
  r.setup.lifeRules === 'career-v1' || hasAnnualRules(r);
export const hasAcademicRules = (r: Context) =>
  r.setup.lifeRules === 'education-v1' || hasEmploymentRules(r);
export const discretionaryCount = (r: GameRun) =>
  r.actions.filter((a) => !['choose', 'advance'].includes(a.type)).length;

// New lives reserve story room before accepting optional operations. Nothing is trimmed or fast-forwarded.
export const storyCapacityReason = (r: GameRun): string | null =>
  hasAssetsRules(r) &&
  r.actions.length + 2 * Math.max(0, 160 - Math.floor(r.month / 12)) + 40 >= 512
    ? 'Cần giữ phần bản lưu còn lại cho câu chuyện; hãy tiếp tục cuộc đời trước khi quản lý thêm.'
    : null;
