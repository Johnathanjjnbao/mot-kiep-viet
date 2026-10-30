import type { GameRun, Transaction } from '../domain/model';
import { ageOf, currentCareer, monthlyExpense, monthlyIncome } from '../content/world';
export const netWorth = (r: GameRun) =>
  r.finance.cash +
  r.finance.savings +
  r.finance.assets.reduce((n, a) => n + a.value, 0) -
  r.finance.liability.principal;
const transactionIds = new WeakMap<GameRun['finance'], Set<string>>();
// The sole writer of monetary balances. Internal mutations operate on an engine-owned clone.
export function transact(
  run: GameRun,
  id: string,
  label: string,
  delta: Partial<Pick<Transaction, 'cash' | 'savings' | 'debt' | 'assets'>>,
) {
  const f = run.finance;
  let ids = transactionIds.get(f);
  if (!ids) {
    ids = new Set(f.transactions.map((t) => t.id));
    transactionIds.set(f, ids);
  }
  if (ids.has(id)) throw new Error(`Duplicate transaction: ${id}`);
  for (const v of Object.values(delta))
    if (!Number.isSafeInteger(v)) throw new Error('Invalid transaction amount');
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
  const age = ageOf(run),
    key = `month:${run.month}`;
  const job = currentCareer(run);
  const income = monthlyIncome(run);
  if (income) transact(run, `${key}:income`, 'Thu nhập công việc', { cash: income });
  if (age < 18) transact(run, `${key}:family`, 'Gia đình cho tiền sinh hoạt', { cash: 2 });
  // A deliberately designed safety floor; career history increases this modest pension.
  if (age >= 65)
    transact(run, `${key}:pension`, 'Trợ cấp tuổi già (thiết kế)', {
      cash: run.player.careers.length ? 12 : 8,
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
