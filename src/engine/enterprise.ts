import { designMoney } from '../domain/currency';
import type { GameRun } from '../domain/model';
import type { Enterprise, ProductCategory, RetailPolicy } from '../domain/enterprise';
import { transact } from './finance';
import { hashSeed, nextRandom } from './random';
import { ageOf, currentCareer } from '../content/world';

const integer = (n: number, min: number, max: number) =>
  Number.isSafeInteger(n) && n >= min && n <= max;
const equity = (e: Enterprise) => e.cash + e.stock * e.unitCost;
const profit = (e: Enterprise) =>
  e.totals.revenue - e.totals.cogs - e.totals.operating - e.totals.writeOff;
function policyValid(p: RetailPolicy) {
  return (
    ['budget', 'balanced', 'premium'].includes(p.price) &&
    typeof p.marketing === 'boolean' &&
    integer(p.reorderTarget, 0, 200)
  );
}
export function assertEnterprise(r: GameRun, e: Enterprise) {
  if (
    e.rules !== 'enterprise-v1' ||
    e.type !== 'retail' ||
    e.owner !== r.id ||
    !/^enterprise:[0-3]$/.test(e.id)
  )
    throw Error('Invalid enterprise identity');
  if (
    !['clothing', 'household', 'handmade'].includes(e.category) ||
    e.unitCost !== designMoney(r, { clothing: 3, household: 5, handmade: 2 }[e.category])
  )
    throw Error('Invalid product');
  if (
    !policyValid(e.policy) ||
    !integer(e.cash, 0, designMoney(r, 1000000)) ||
    !integer(e.stock, 0, 200) ||
    !integer(e.reputation, 0, 100)
  )
    throw Error('Invalid enterprise balance/policy');
  if (
    !integer(e.foundedMonth, 216, r.month) ||
    !integer(e.settledThrough, e.foundedMonth, r.month) ||
    !['operating', 'suspended', 'closed'].includes(e.status)
  )
    throw Error('Invalid enterprise lifecycle');
  if (
    (e.status === 'closed') !== (e.closedMonth !== null) ||
    (e.closedMonth !== null && !integer(e.closedMonth, e.foundedMonth, r.month))
  )
    throw Error('Invalid closure');
  if (Object.values(e.totals).some((n) => !integer(n, 0, designMoney(r, 1000000000))))
    throw Error('Invalid enterprise totals');
  const asset = r.finance.assets.find((a) => a.id === e.id);
  if (
    !asset ||
    asset.value !== equity(e) ||
    asset.value !== e.totals.contributed - e.totals.withdrawn + profit(e)
  )
    throw Error('Enterprise equity does not reconcile');
  if (e.status === 'closed' && (e.cash !== 0 || e.stock !== 0))
    throw Error('Closed enterprise has resources');
  if (
    e.recent.length > 12 ||
    e.recent.some(
      (m, i) =>
        !integer(m.month, e.foundedMonth + 1, e.settledThrough) ||
        ['bought', 'orders', 'returned', 'revenue', 'cogs', 'operating'].some(
          (k) =>
            !integer(
              m[k as 'bought'],
              0,
              ['bought', 'orders', 'returned'].includes(k) ? 1000000 : designMoney(r, 1000000),
            ),
        ) ||
        m.returned > m.orders ||
        (i > 0 && m.month !== e.recent[i - 1].month + 1) ||
        m.profit !== m.revenue - m.cogs - m.operating ||
        !Number.isSafeInteger(m.cashFlow),
    )
  )
    throw Error('Invalid monthly reports');
}
function draft(r: GameRun, e: Enterprise) {
  assertEnterprise(r, e);
  return { run: structuredClone(r), enterprise: structuredClone(e) };
}
// All business-money/stock mutations pass one posting boundary and the player ledger.
function post(
  r: GameRun,
  e: Enterprise,
  id: string,
  label: string,
  cash: number,
  stock = 0,
  playerCash = 0,
) {
  const newCash = e.cash + cash,
    newStock = e.stock + stock,
    asset = r.finance.assets.find((a) => a.id === e.id)!;
  if (!integer(newCash, 0, designMoney(r, 1000000)) || !integer(newStock, 0, 200))
    throw Error('Insufficient business funds/stock');
  const delta = cash + stock * e.unitCost;
  transact(r, `${e.id}:${id}`, label, { cash: playerCash, assets: delta });
  e.cash = newCash;
  e.stock = newStock;
  asset.value += delta;
}
export function foundRetail(
  input: GameRun,
  index: number,
  capital: number,
  category: ProductCategory,
) {
  if (
    !integer(index, 0, 3) ||
    !integer(capital, designMoney(input, 20), designMoney(input, 10000)) ||
    !['clothing', 'household', 'handmade'].includes(category)
  )
    throw Error('Invalid launch');
  if (
    input.status !== 'playing' ||
    ageOf(input) < 18 ||
    input.world.year < 2005 ||
    !input.world.technologies.includes('internet')
  )
    throw Error('Shop unavailable in this context');
  if (['business', 'freelance'].includes(currentCareer(input)?.id ?? ''))
    throw Error('Leave the old income abstraction before funding a shop');
  const id = `enterprise:${index}`;
  if (input.finance.assets.some((a) => a.id === id)) throw Error('Enterprise ID already used');
  const run = structuredClone(input);
  const enterprise: Enterprise = {
    rules: 'enterprise-v1',
    id,
    owner: run.id,
    type: 'retail',
    category,
    foundedMonth: run.month,
    closedMonth: null,
    settledThrough: run.month,
    status: 'operating',
    cash: 0,
    stock: 0,
    unitCost: designMoney(run, { clothing: 3, household: 5, handmade: 2 }[category]),
    reputation: 40,
    policy: { price: 'balanced', marketing: false, reorderTarget: 20 },
    totals: { contributed: capital, withdrawn: 0, revenue: 0, cogs: 0, operating: 0, writeOff: 0 },
    recent: [],
  };
  run.finance.assets.push({ id, name: 'Vốn cửa hàng trực tuyến (bản thử nội bộ)', value: 0 });
  post(run, enterprise, 'found', 'Góp vốn cửa hàng', capital, 0, -capital);
  assertEnterprise(run, enterprise);
  return { run, enterprise };
}
export function retailPolicy(input: GameRun, book: Enterprise, policy: RetailPolicy) {
  const { run, enterprise: e } = draft(input, book);
  if (e.status === 'closed' || !policyValid(policy)) throw Error('Invalid strategy');
  e.policy = structuredClone(policy);
  return { run, enterprise: e };
}
export function fundRetail(input: GameRun, book: Enterprise, amount: number) {
  const { run, enterprise: e } = draft(input, book);
  if (e.status === 'closed' || !integer(amount, 1, designMoney(run, 10000)))
    throw Error('Invalid funding');
  post(
    run,
    e,
    `fund:${run.finance.transactions.length}`,
    'Bổ sung vốn cửa hàng',
    amount,
    0,
    -amount,
  );
  e.totals.contributed += amount;
  e.status = 'operating';
  assertEnterprise(run, e);
  return { run, enterprise: e };
}
export function settleRetail(input: GameRun, book: Enterprise) {
  const { run, enterprise: e } = draft(input, book);
  if (run.status !== 'playing' || e.status === 'closed' || run.month !== e.settledThrough + 1)
    throw Error('Business month already settled, skipped or inactive');
  const fixed = designMoney(run, 6 + (e.policy.marketing ? 4 : 0)),
    before = e.cash;
  const report = {
    month: run.month,
    bought: 0,
    orders: 0,
    returned: 0,
    revenue: 0,
    cogs: 0,
    operating: 0,
    cashFlow: 0,
    profit: 0,
  };
  if (e.cash < fixed) e.status = 'suspended';
  if (e.status === 'operating') {
    report.bought = Math.min(
      Math.max(0, e.policy.reorderTarget - e.stock),
      Math.floor((e.cash - fixed) / e.unitCost),
    );
    const [roll, state] = nextRandom(hashSeed(`${run.seed}:${e.id}:${run.month}:retail`));
    const [returns] = nextRandom(state);
    const price =
      e.policy.price === 'budget'
        ? e.unitCost + designMoney(run, 2)
        : e.unitCost * (e.policy.price === 'premium' ? 3 : 2);
    const base = e.policy.price === 'budget' ? 12 : e.policy.price === 'premium' ? 4 : 8;
    const available = e.stock + report.bought,
      cashAvailable = e.cash - report.bought * e.unitCost;
    const demand = Math.floor(
      base * (0.4 + roll) * (0.6 + e.reputation / 100) +
        (e.policy.marketing ? 3 : 0) +
        run.player.stats.skill / 40,
    );
    report.orders = Math.min(
      available,
      demand,
      Math.floor((cashAvailable - fixed) / designMoney(run, 1)),
    );
    report.returned = Math.min(
      report.orders,
      Math.floor(report.orders * (returns < 0.15 ? 0.5 : returns < 0.45 ? 0.15 : 0)),
    );
    const sold = report.orders - report.returned;
    report.revenue = sold * price;
    report.cogs = sold * e.unitCost;
    report.operating = fixed + report.orders * designMoney(run, 1);
    post(
      run,
      e,
      `month:${run.month}`,
      'Doanh thu, hoàn tiền, nhập hàng và vận hành cửa hàng',
      report.revenue - report.operating - report.bought * e.unitCost,
      report.bought - sold,
    );
    e.totals.revenue += report.revenue;
    e.totals.cogs += report.cogs;
    e.totals.operating += report.operating;
    e.reputation = Math.max(
      0,
      Math.min(100, e.reputation + (sold > 0 ? 1 : 0) - (report.returned > 0 ? 2 : 0)),
    );
  }
  report.cashFlow = e.cash - before;
  report.profit = report.revenue - report.cogs - report.operating;
  e.recent.push(report);
  e.recent = e.recent.slice(-12);
  e.settledThrough = run.month;
  assertEnterprise(run, e);
  return { run, enterprise: e };
}
export function closeRetail(input: GameRun, book: Enterprise) {
  const { run, enterprise: e } = draft(input, book);
  if (e.status === 'closed') throw Error('Shop already closed');
  const liquidation = Math.floor((e.stock * e.unitCost) / 2),
    returned = e.cash + liquidation;
  e.totals.writeOff += e.stock * e.unitCost - liquidation;
  post(run, e, 'close', 'Thanh lý và trả vốn còn lại', -e.cash, -e.stock, returned);
  e.totals.withdrawn += returned;
  e.status = 'closed';
  e.closedMonth = run.month;
  assertEnterprise(run, e);
  return { run, enterprise: e };
}
