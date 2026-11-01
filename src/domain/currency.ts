import type { GameRun, RunSetup } from './model';

type Context = Pick<GameRun, 'setup'>;
export type Currency = NonNullable<RunSetup['currency']>;
export const VND_PER_DESIGN_UNIT = 200_000;
export const currencyOf = (run?: Context): Currency => run?.setup.currency ?? 'dsm-v1';
/** Convert authored design prices once. Ledger values are already in the run's unit. */
export function designMoney(run: Context, value: number): number {
  const result = value * (currencyOf(run) === 'vnd-v1' ? VND_PER_DESIGN_UNIT : 1);
  if (!Number.isSafeInteger(result)) throw Error('Invalid design money');
  return result;
}
const moneyFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
export const formatMoney = (value: number, run?: Context) =>
  `${moneyFormat.format(value)} ${currencyOf(run) === 'vnd-v1' ? '₫' : 'đSM'}`;
/** Authored prose contains design units; never pass interpolated ledger values here. */
export function currencyText(run: Context, text: string): string {
  if (currencyOf(run) !== 'vnd-v1') return text;
  return text
    .replace(/(-?\d+)\s*đSM/g, (_, value: string) =>
      formatMoney(designMoney(run, Number(value)), run),
    )
    .replaceAll('đSM', 'VND');
}
