import type { GameRun, EventDefinition } from '../domain/model';
import { minorActionSchema, type MinorAction, type ChildMoneyOperation } from '../domain/childhood';
import { hasRealismRules, discretionaryCount } from '../domain/rules';
import { designMoney } from '../domain/currency';
import { residentParents } from '../domain/creator';
import { transact } from './finance';
const integer = (n: number) => Number.isSafeInteger(n) && Math.abs(n) <= Number.MAX_SAFE_INTEGER;
/** Sole household balance writer. Personal transfers carry the same ID into transact. */
function householdPost(r: GameRun, id: string, label: string, cash: number, personal = 0) {
  const h = r.childhoodFinance!;
  if (
    !h ||
    !integer(cash) ||
    !integer(personal) ||
    personal < 0 ||
    h.cash + cash < 0 ||
    !integer(h.cash + cash) ||
    h.transactions.some((t) => t.id === id)
  )
    throw Error('Invariant: household posting');
  h.cash += cash;
  h.transactions.push({ id, month: r.month, label, cash, personal });
}
export function initChildhoodFinance(r: GameRun, opening: number) {
  r.childhoodFinance = {
    owner: r.id,
    cash: 0,
    settledThrough: 0,
    adultAccess: false,
    transactions: [],
  };
  householdPost(r, 'household:opening', 'Quỹ dự phòng của hộ chăm sóc', opening);
  transact(r, 'opening', 'Tiền cá nhân khi chào đời', { cash: 0 });
}
function transfer(r: GameRun, key: string, label: string, requested: number, savings: boolean) {
  const amount = Math.min(requested, r.childhoodFinance!.cash),
    id = 'household:transfer:' + key;
  householdPost(r, id, label, -amount, amount);
  transact(r, id, label, savings ? { savings: amount } : { cash: amount });
}
export function childLivingCost(r: GameRun) {
  return Math.round(
    designMoney(r, [12, 18, 24, 30, 40][r.household.resources]) * r.world.costFactor,
  );
}
export function pocketAmount(r: GameRun) {
  if (r.month < 72 || r.month >= 216) return 0;
  return Math.floor(
    (designMoney(r, 1) * (1 + Math.min(2, r.household.resources))) / (r.month < 156 ? 4 : 2),
  );
}
export function settleChildhoodFinance(r: GameRun) {
  const h = r.childhoodFinance!;
  if (!h || h.settledThrough + 1 !== r.month)
    throw Error('Invariant: childhood month skipped/duplicated');
  if (r.month === 216) {
    h.adultAccess = true;
    h.settledThrough = 216;
    r.journal.push({
      id: `journal:${r.journal.length}`,
      month: r.month,
      title: 'Tự quản phần tiền thuộc về mình',
      text: 'Bạn bắt đầu tự quản tiền mặt và tiết kiệm đã đứng tên mình. Quỹ của hộ chăm sóc không chuyển thành tài sản cá nhân của bạn.',
      category: 'finance',
    });
    return;
  }
  if (r.month > 216) throw Error('Invariant: household childhood clock');
  const key = `household:month:${r.month}`,
    income = designMoney(r, [18, 25, 34, 45, 60][r.household.resources]);
  householdPost(r, key + ':income', 'Thu nhập và hỗ trợ của hộ chăm sóc', income);
  const cost = childLivingCost(r);
  if (h.cash < cost)
    householdPost(r, key + ':support', 'Hỗ trợ chi phí thiết yếu cho hộ', cost - h.cash);
  householdPost(r, key + ':living', 'Sinh hoạt và chăm sóc do hộ chi trả', -cost);
  const pocket = pocketAmount(r);
  if (pocket)
    transfer(r, `month:${r.month}:pocket`, 'Tiền tiêu vặt được gia đình giao', pocket, false);
  h.settledThrough = r.month;
}
export function applyChildMoney(
  r: GameRun,
  operation: ChildMoneyOperation,
  units: number,
  id: string,
) {
  if (
    !hasRealismRules(r) ||
    !r.childhoodFinance ||
    r.month >= 216 ||
    !Number.isInteger(units) ||
    units < 0 ||
    units > 10
  )
    throw Error('Tiền tuổi nhỏ không đúng hoàn cảnh.');
  const amount = designMoney(r, units);
  switch (operation) {
    case 'gift':
      transfer(
        r,
        id,
        r.month < 72
          ? 'Quà thuộc về con, người chăm sóc giữ trong tiết kiệm'
          : 'Quà gia đình tặng riêng cho bạn',
        amount,
        r.month < 72,
      );
      break;
    case 'earn':
      if (r.month < 156)
        throw Error('Việc có thù lao nhỏ chỉ mở từ tuổi thiếu niên trong mô phỏng.');
      transact(r, `child:earn:${id}`, 'Thù lao việc nhỏ phù hợp sau giờ học', { cash: amount });
      break;
    case 'save': {
      if (r.month < 72) throw Error('Người chăm sóc đang giữ tiền của con.');
      const value = Math.min(amount, r.finance.cash);
      transact(r, `child:save:${id}`, 'Dành tiền cá nhân vào tiết kiệm', {
        cash: -value,
        savings: value,
      });
      break;
    }
    case 'spend': {
      if (r.month < 72) throw Error('Trẻ nhỏ chưa tự chi khoản tiền này.');
      const value = Math.min(amount, r.finance.cash);
      transact(r, `child:spend:${id}`, 'Chi nhỏ trong phần tiền cá nhân đang có', { cash: -value });
      break;
    }
    case 'household-cost':
      householdPost(
        r,
        `household:care:${id}`,
        'Khoản chăm sóc do người lớn chi trả',
        -Math.min(amount, r.childhoodFinance.cash),
      );
      break;
  }
}
export function requestMinorFinance(input: GameRun, raw: MinorAction) {
  const parsed = minorActionSchema.safeParse(raw);
  if (!parsed.success) throw Error('Thông số tiền cá nhân không hợp lệ.');
  const a = parsed.data;
  if (
    !hasRealismRules(input) ||
    input.status !== 'playing' ||
    input.month < 72 ||
    input.month >= 216
  )
    throw Error('Chỉ dùng cho tiền cá nhân ở tuổi6–17.');
  if (a.expected !== input.actions.length) throw Error('Thao tác đã cũ; bản lưu được giữ nguyên.');
  if (discretionaryCount(input) >= 120)
    throw Error('Đã dùng hết lượt quản lý; hãy tiếp tục câu chuyện.');
  if (a.amount > input.finance.cash || a.amount > designMoney(input, input.month < 156 ? 1 : 5))
    throw Error('Khoản chi hoặc để dành vượt phần tiền nhỏ đang có.');
  const r = structuredClone(input),
    id = `child:manual:${r.actions.length}`;
  transact(
    r,
    id,
    a.operation === 'save' ? 'Tự dành tiền nhỏ vào tiết kiệm' : 'Tự chi một khoản nhỏ',
    a.operation === 'save' ? { cash: -a.amount, savings: a.amount } : { cash: -a.amount },
  );
  r.actions.push(a);
  r.lastOutcome =
    a.operation === 'save'
      ? 'Phần tiền bạn để dành vẫn thuộc về bạn; người chăm sóc cùng giữ đến tuổi tự quản.'
      : 'Bạn đã chi trong phần tiền cá nhân đang có; quỹ hộ không bị dùng thay.';
  r.journal.push({
    id: `journal:${r.journal.length}`,
    month: r.month,
    title: 'Học cách dùng phần tiền của mình',
    text: r.lastOutcome,
    category: 'finance',
  });
  return r;
}
export function contextualChildhood(r: GameRun, e: EventDefinition | undefined) {
  if (!e || !hasRealismRules(r) || e.version !== 12) return e;
  // Keep four honest paths even when a family has no surplus or a child has no cash.
  // A saved gift in this very choice may fund its following saving operation.
  const choices = e.choices.map((c) => {
    const money = c.effects.filter((f) => f.kind === 'child-money');
    const gift = money
      .filter((f) => f.operation === 'gift')
      .reduce((n, f) => n + designMoney(r, f.amount), 0);
    const own = r.finance.cash + (r.month >= 72 ? Math.min(gift, r.childhoodFinance!.cash) : 0);
    const smallPurchase = Math.max(1, Math.floor(designMoney(r, 1) / 20));
    const giftBlocked = gift > 0 && r.childhoodFinance!.cash === 0;
    const careBlocked = money.some(
      (f) => f.operation === 'household-cost' && r.childhoodFinance!.cash < smallPurchase,
    );
    const familyBlocked = giftBlocked || careBlocked;
    const spendBlocked = money.some((f) => f.operation === 'spend') && own < smallPurchase;
    const saveBlocked = money.some((f) => f.operation === 'save') && own === 0;
    if (!familyBlocked && !spendBlocked && !saveBlocked) return c;
    return {
      ...c,
      text: careBlocked
        ? 'Dùng đồ sẵn có an toàn, đợi khoản chi thêm'
        : familyBlocked
          ? 'Giữ lời chúc, hẹn khoản quà khi hộ có phần dư'
          : spendBlocked
            ? 'Xem giá và chờ có đủ tiền riêng'
            : 'Lập kế hoạch để dành khi có tiền mặt',
      hint: careBlocked
        ? 'Hộ chưa dư tiền; cần kiểm tra và dùng lại đồ phù hợp'
        : familyBlocked
          ? 'Hộ chưa dư tiền; không lấy khoản giữ hộ của con'
          : spendBlocked
            ? 'Chưa chi hoặc nhận món đồ; tập chờ và so giá'
            : 'Chưa chuyển tiền; đặt một mục tiêu nhỏ',
      outcome: careBlocked
        ? 'Người chăm sóc kiểm tra đồ sẵn có trước khi dùng. Hôm nay không mua mới, không trừ tiền của con hoặc vay để chi.'
        : familyBlocked
          ? 'Gia đình giữ một lời chúc cho bạn. Hôm nay chưa chuyển quỹ hộ hoặc ghi thêm tiền đứng tên con.'
          : spendBlocked
            ? 'Bạn xem giá rồi hoãn mua. Không nhận món đồ hoặc ghi khoản chi khi phần tiền riêng chưa đủ.'
            : 'Bạn ghi mục tiêu để dành trước. Hôm nay chưa có tiền mặt để chuyển vào tiết kiệm.',
      effects: careBlocked
        ? [
            { kind: 'stat' as const, stat: 'health' as const, amount: 1 },
            { kind: 'stat' as const, stat: 'stress' as const, amount: 1 },
          ]
        : familyBlocked
          ? [
              { kind: 'stat' as const, stat: 'social' as const, amount: 1 },
              { kind: 'stat' as const, stat: 'mood' as const, amount: 1 },
              { kind: 'flag' as const, flag: 'realism-family-letter', value: true },
            ]
          : spendBlocked
            ? [
                { kind: 'stat' as const, stat: 'knowledge' as const, amount: 1 },
                { kind: 'stat' as const, stat: 'mood' as const, amount: -1 },
              ]
            : [
                { kind: 'stat' as const, stat: 'knowledge' as const, amount: 2 },
                { kind: 'stat' as const, stat: 'stress' as const, amount: 1 },
                { kind: 'flag' as const, flag: 'realism-budget-plan', value: true },
              ],
    };
  });
  const connections: Record<string, [string, string, 'knowledge' | 'skill' | 'social']> = {
    'realism-reading-line': [
      'realism-reading-routine',
      'Những giờ xem sách cùng người chăm sóc giúp bạn nhận ra nhịp của câu chữ.',
      'knowledge',
    ],
    'realism-club-time': [
      'realism-shared-care',
      'Kinh nghiệm được nhiều người tin cậy chăm sóc khiến việc hỏi lịch nhóm dễ bắt đầu hơn.',
      'social',
    ],
    'realism-first-small-task': [
      'realism-budget-plan',
      'Những lần chia tiền tiêu vặt giúp bạn hiểu rõ khoản thù lao nhỏ này.',
      'knowledge',
    ],
    'realism-future-route': [
      'realism-small-work',
      'Việc nhỏ từng làm cho bạn một trải nghiệm cụ thể để so với lời giới thiệu nghề.',
      'skill',
    ],
    'realism-last-school-project': [
      'realism-project-practice',
      'Bạn nhớ cách thử dự án nhỏ trước đây và đem kinh nghiệm ấy vào phần việc mới.',
      'skill',
    ],
  };
  const connection = connections[e.id];
  if (!connection || !r.flags[connection[0]])
    return choices.every((c, i) => c === e.choices[i]) ? e : { ...e, choices };
  // Presentation only: recorded outcomes and effects retain the full causal detail.
  const visibleContext: Record<string, string> = {
    'realism-future-route': 'Bạn nhớ việc nhỏ đã làm.',
    'realism-last-school-project': 'Bạn nhớ dự án đã thử.',
  };
  return {
    ...e,
    text: e.text + ' ' + (visibleContext[e.id] ?? connection[1]),
    choices: choices.map((c) => ({
      ...c,
      hint: c.hint + '; kinh nghiệm cũ hỗ trợ',
      outcome: c.outcome + ' ' + connection[1],
      effects: [...c.effects, { kind: 'stat' as const, stat: connection[2], amount: 1 }],
    })),
  };
}
export function decisionActor(r: GameRun, e: EventDefinition | null | undefined) {
  if (!hasRealismRules(r)) return { kind: 'player', label: 'Bạn sẽ chọn thế nào?', names: '' };
  if (e?.decisionActor === 'caregiver' || r.month < 36) {
    const parents = residentParents(r),
      roles = parents.map((p) => (p.id === 'mother' ? 'Mẹ' : 'Cha'));
    return {
      kind: 'caregiver',
      label: (roles.length ? roles.join(' và ') : 'Người chăm sóc') + ' sẽ làm gì?',
      names: parents.map((p) => p.name).join(' và ') || 'Người đang chăm sóc bạn',
    };
  }
  return {
    kind: r.month < 216 ? 'child' : 'player',
    label: r.month < 216 ? 'Bạn muốn thử cách nào?' : 'Bạn sẽ chọn thế nào?',
    names: r.player.name,
  };
}
export function assertChildhood(r: GameRun) {
  if (!hasRealismRules(r)) {
    if (
      r.childhoodFinance !== undefined ||
      r.setup.presentation !== undefined ||
      r.setup.hairstyle !== undefined
    )
      throw Error('Invariant: legacy realism state');
    return;
  }
  const h = r.childhoodFinance;
  if (
    !h ||
    h.owner !== r.id ||
    !['boy', 'girl'].includes(r.setup.presentation ?? '') ||
    h.settledThrough !== Math.min(r.month, 216) ||
    h.adultAccess !== r.month >= 216 ||
    !integer(h.cash) ||
    h.cash < 0 ||
    h.transactions.length > 2500
  )
    throw Error('Invariant: childhood ownership/clock');
  const ids = new Set<string>();
  let cash = 0,
    personal = 0;
  for (const t of h.transactions) {
    if (
      ids.has(t.id) ||
      !integer(t.cash) ||
      !integer(t.personal) ||
      !Number.isInteger(t.month) ||
      t.personal < 0 ||
      t.month > Math.min(r.month, 215) ||
      t.month < 0
    )
      throw Error('Invariant: household ledger');
    ids.add(t.id);
    cash += t.cash;
    personal += t.personal;
  }
  const transfers = new Map(
    r.finance.transactions
      .filter((t) => t.id.startsWith('household:transfer:'))
      .map((t) => [t.id, t]),
  );
  for (const t of h.transactions) {
    if (t.id.startsWith('household:transfer:')) {
      const own = transfers.get(t.id);
      if (
        !own ||
        t.cash !== -t.personal ||
        own.month !== t.month ||
        own.cash + own.savings !== t.personal ||
        own.debt ||
        own.assets
      )
        throw Error('Invariant: household/personal reconciliation');
      transfers.delete(t.id);
    } else if (t.personal !== 0) throw Error('Invariant: household transfer origin');
  }
  if (transfers.size) throw Error('Invariant: missing household transfer');
  if (
    cash !== h.cash ||
    personal !==
      r.finance.transactions
        .filter((t) => t.id.startsWith('household:transfer:'))
        .reduce((sum, t) => sum + t.cash + t.savings, 0)
  )
    throw Error('Invariant: household/personal reconciliation');
  if (
    r.month < 216 &&
    (r.finance.liability.principal !== 0 || r.finance.assets.length || r.player.careers.length)
  )
    throw Error('Invariant: minor adult finance');
  if (r.month < 72 && r.finance.cash !== 0) throw Error('Invariant: infant disposable money');
}
