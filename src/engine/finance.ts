import { hasAssetsRules, hasRealismRules } from '../domain/rules';
import { settleChildhoodFinance } from './childhood';
import { designMoney } from '../domain/currency';
import type { GameRun, Transaction } from '../domain/model';
import { residentParents } from '../domain/creator';
import { ageOf, currentCareer, monthlyExpense, monthlyIncome } from '../content/world';
export const assetDebt = (r: GameRun) =>
  hasAssetsRules(r) ? (r.livingAssets?.loans.reduce((n, loan) => n + loan.principal, 0) ?? 0) : 0;
export const totalDebt = (r: GameRun) => r.finance.liability.principal + assetDebt(r);
export interface FinancialAssetChange {
  id: string;
  name: string;
  value: number | null;
}
export const netWorth = (r: GameRun) =>
  r.finance.cash +
  r.finance.savings +
  r.finance.assets.reduce((n, a) => n + a.value, 0) -
  totalDebt(r);
const transactionIds = new WeakMap<GameRun['finance'], Set<string>>();
// The sole writer of monetary balances. Internal mutations operate on an engine-owned clone.
export function transact(
  run: GameRun,
  id: string,
  label: string,
  delta: Partial<Pick<Transaction, 'cash' | 'savings' | 'debt' | 'assets' | 'loanDebt'>> & {
    loanId?: string;
  },
  changes?: FinancialAssetChange[],
) {
  if (
    hasRealismRules(run) &&
    run.month < 216 &&
    ((delta.debt ?? 0) > 0 || (delta.assets ?? 0) !== 0)
  )
    throw Error('Trẻ chưa dùng khoản vay hoặc tài sản người lớn.');
  const f = run.finance;
  let ids = transactionIds.get(f);
  if (!ids) {
    ids = new Set(f.transactions.map((t) => t.id));
    transactionIds.set(f, ids);
  }
  if (ids.has(id)) throw new Error(`Duplicate transaction: ${id}`);
  for (const [key, value] of Object.entries(delta))
    if (key !== 'loanId' && !Number.isSafeInteger(value))
      throw new Error('Invalid transaction amount');
  const loan = delta.loanId
    ? run.livingAssets?.loans.find((l) => l.id === delta.loanId)
    : undefined;
  if (delta.loanDebt !== undefined || delta.loanId !== undefined) {
    if (
      !hasAssetsRules(run) ||
      !loan ||
      delta.loanDebt === undefined ||
      loan.owner !== 'player:' + run.id ||
      !Number.isSafeInteger(loan.principal + delta.loanDebt) ||
      loan.principal + delta.loanDebt < 0
    )
      throw Error('Khoản vay tài sản hoặc đối ứng không hợp lệ.');
  }
  let nextAssets = f.assets;
  if (changes) {
    if (!hasAssetsRules(run) || new Set(changes.map((c) => c.id)).size !== changes.length)
      throw Error('Đối ứng tài sản không hợp lệ.');
    nextAssets = f.assets.map((a) => ({ ...a }));
    let change = 0;
    for (const c of changes) {
      if (c.value !== null && (!Number.isSafeInteger(c.value) || c.value < 0))
        throw Error('Giá trị tài sản không hợp lệ.');
      const index = nextAssets.findIndex((a) => a.id === c.id),
        previous = index < 0 ? 0 : nextAssets[index].value;
      if (c.value === null) {
        if (index < 0) throw Error('Không thể xóa tài sản không có trong sổ.');
        nextAssets.splice(index, 1);
      } else if (index < 0) nextAssets.push({ id: c.id, name: c.name, value: c.value });
      else nextAssets[index] = { id: c.id, name: c.name, value: c.value };
      change += (c.value ?? 0) - previous;
    }
    if (!Number.isSafeInteger(change) || change !== (delta.assets ?? 0))
      throw Error('Giá trị tài sản không khớp đối ứng.');
  }
  const tx: Transaction = {
    id,
    month: run.month,
    label,
    cash: 0,
    savings: 0,
    debt: 0,
    assets: 0,
    ...delta,
  };
  if (f.cash + tx.cash < 0 || f.savings + tx.savings < 0 || f.liability.principal + tx.debt < 0)
    throw new Error('Insufficient balance');
  if (
    ![f.cash + tx.cash, f.savings + tx.savings, f.liability.principal + tx.debt].every(
      Number.isSafeInteger,
    )
  )
    throw new Error('Balance overflow');
  if (loan) loan.principal += tx.loanDebt ?? 0;
  if (changes) f.assets = nextAssets;
  f.cash += tx.cash;
  f.savings += tx.savings;
  f.liability.principal += tx.debt;
  f.transactions.push(tx);
  ids.add(id);
}
export function mandatoryCost(run: GameRun, id: string, label: string, amount: number) {
  if (amount < 0 || !Number.isSafeInteger(amount)) throw new Error('Invalid cost');
  if (run.finance.cash < amount) {
    const fromSavings = Math.min(amount - run.finance.cash, run.finance.savings);
    if (fromSavings)
      transact(run, `${id}:withdraw`, 'Rút tiết kiệm cho chi phí bắt buộc', {
        cash: fromSavings,
        savings: -fromSavings,
      });
    const deficit = amount - run.finance.cash;
    if (deficit > 0)
      transact(run, `${id}:credit`, 'Vay bù sinh hoạt', { cash: deficit, debt: deficit });
  }
  transact(run, id, label, { cash: -amount });
}
export function settleMonth(run: GameRun) {
  if (run.finance.settledThrough >= run.month) throw new Error('Month already settled');
  if (hasRealismRules(run) && run.month < 216) {
    settleChildhoodFinance(run);
    const interest = Math.floor(run.finance.savings * 0.0015);
    if (interest)
      transact(run, `month:${run.month}:savings-interest`, 'Lãi khoản tiết kiệm đứng tên con', {
        savings: interest,
      });
    run.finance.settledThrough = run.month;
    return;
  }
  const age = ageOf(run),
    key = `month:${run.month}`;
  const job = currentCareer(run);
  const income = monthlyIncome(run);
  if (income) transact(run, `${key}:income`, 'Thu nhập công việc', { cash: income });
  if (age < 18)
    transact(run, `${key}:family`, 'Gia đình cho tiền sinh hoạt', {
      cash: designMoney(
        run,
        [1, 2, 3, 4, 6][run.household.resources] +
          residentParents(run).filter((p) => p.personality?.includes('generous')).length,
      ),
    });
  // A deliberately designed safety floor; career history increases this modest pension.
  if (age >= 65)
    transact(run, `${key}:pension`, 'Trợ cấp tuổi già (thiết kế)', {
      cash: designMoney(run, run.player.careers.length ? 12 : 8),
    });
  mandatoryCost(run, `${key}:living`, 'Sinh hoạt và chỗ ở', monthlyExpense(run));
  const interest = Math.ceil(run.finance.liability.principal * run.finance.liability.monthlyRate);
  if (interest) transact(run, `${key}:interest`, 'Lãi vay nhập gốc', { debt: interest });
  const savingsInterest = Math.floor(run.finance.savings * 0.0015);
  if (savingsInterest)
    transact(run, `${key}:savings-interest`, 'Lãi tiết kiệm', { savings: savingsInterest });
  if (job) {
    job.experience++;
    job.level = Math.floor(job.experience / 72);
  }
  run.finance.settledThrough = run.month;
}
