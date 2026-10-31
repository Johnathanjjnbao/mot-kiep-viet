import type { GameRun, WardrobeAction, WearSlot } from '../domain/model';
import { clothingById, DEFAULT_CLOTHES, wearable } from '../content/clothing';
import { transact } from './finance';
export function defaultWardrobe() {
  return {
    owned: [...DEFAULT_CLOTHES],
    equipped: { top: 'plain-top', bottom: 'plain-bottom', shoes: 'canvas-shoes' },
    outfits: [],
    memories: [],
  };
}
export function applyWardrobe(input: GameRun, action: WardrobeAction): GameRun {
  if (!input.wardrobe || input.engineVersion !== '3.0.0' || input.status !== 'playing')
    throw Error('Tủ đồ chỉ mở trong cuộc đời Life Expansion đang chơi.');
  if (action.expected !== input.actions.length)
    throw Error('Thao tác đã cũ; tủ đồ của bạn vẫn được giữ.');
  if (
    input.actions.filter((a) => a.type === 'wardrobe').length >= 160 ||
    input.actions.filter(
      (a) =>
        a.type === 'manage' ||
        a.type === 'wardrobe' ||
        a.type === 'social' ||
        a.type === 'family-talk' ||
        a.type === 'academic',
    ).length >= (input.family ? 120 : input.social ? 250 : 350)
  )
    throw Error('Đã đạt giới hạn thao tác tủ đồ trong một đời.');
  const run = structuredClone(input),
    w = run.wardrobe!,
    item = clothingById(action.item);
  const checkEquipped = (equipment: typeof w.equipped) => {
    for (const [slot, id] of Object.entries(equipment)) {
      const c = clothingById(id!);
      if (!c || c.slot !== slot || !w.owned.includes(c.id) || !wearable(run, c))
        throw Error('Bộ đồ có món chưa sở hữu hoặc chưa hợp tuổi/bối cảnh.');
    }
  };
  let message: string;
  if (action.operation === 'save-outfit') {
    const name = action.item.trim();
    if (
      !name ||
      name.length > 40 ||
      /[<>]/.test(name) ||
      Array.from(name).some((c) => c.charCodeAt(0) < 32)
    )
      throw Error('Tên bộ đồ cần 1–40 ký tự thường.');
    if (w.outfits.length >= 8) throw Error('Đã lưu đủ tám bộ đồ.');
    checkEquipped(w.equipped);
    w.outfits.push({
      id: `outfit:${w.outfits.length}`,
      name,
      equipped: structuredClone(w.equipped),
    });
    message = `Bạn giữ lại cách phối “${name}”.`;
  } else if (action.operation === 'wear-outfit') {
    const outfit = w.outfits.find((o) => o.id === action.item);
    if (!outfit) throw Error('Không tìm thấy bộ đồ.');
    checkEquipped(outfit.equipped);
    w.equipped = structuredClone(outfit.equipped);
    message = `Bạn mặc bộ “${outfit.name}”.`;
  } else if (action.operation === 'unequip') {
    if (!['top', 'bottom', 'outer', 'shoes', 'hair', 'accessory'].includes(action.item))
      throw Error('Vị trí trang phục không hợp lệ.');
    const slot = action.item as WearSlot;
    if (slot === 'top') w.equipped.top = 'plain-top';
    else if (slot === 'bottom') w.equipped.bottom = 'plain-bottom';
    else if (slot === 'shoes') w.equipped.shoes = 'canvas-shoes';
    else delete w.equipped[slot];
    message = 'Bạn trở lại cách mặc giản dị hơn.';
  } else {
    if (!item || !wearable(run, item)) throw Error('Món đồ chưa phù hợp tuổi hoặc thời kỳ.');
    if (action.operation === 'buy') {
      if (w.owned.includes(item.id)) throw Error('Bạn đã có món này; không trừ tiền lần nữa.');
      if (item.price <= 0 || run.finance.cash < item.price)
        throw Error('Chưa đủ đSM; bạn có thể dùng bộ đồ mặc định.');
      transact(run, `wardrobe:buy:${item.id}`, `Mua ${item.name}`, { cash: -item.price });
      w.owned.push(item.id);
      message = `Bạn mua ${item.name.toLowerCase()} với ${item.price} đSM.`;
      w.memories.push(`${run.world.year}: ${message}`);
    } else {
      if (!w.owned.includes(item.id)) throw Error('Bạn chưa sở hữu món này.');
      w.equipped[item.slot] = item.id;
      message = `Bạn mặc ${item.name.toLowerCase()}.`;
    }
  }
  run.actions.push(action);
  run.lastOutcome = message;
  run.journal.push({
    id: `journal:${run.journal.length}`,
    month: run.month,
    title: 'Tủ đồ qua những mùa',
    text: message,
    category: 'life',
  });
  return run;
}
export function assertWardrobe(run: GameRun) {
  if (run.engineVersion !== '3.0.0') return;
  const w = run.wardrobe;
  if (!w || new Set(w.owned).size !== w.owned.length) throw Error('Invariant: wardrobe ownership');
  for (const id of w.owned) {
    const c = clothingById(id);
    if (
      !c ||
      (!DEFAULT_CLOTHES.includes(id) &&
        !run.finance.transactions.some((t) => t.id === `wardrobe:buy:${id}` && t.cash === -c.price))
    )
      throw Error('Invariant: wardrobe purchase');
  }
  for (const outfit of [w.equipped, ...w.outfits.map((o) => o.equipped)])
    for (const [slot, id] of Object.entries(outfit))
      if (!w.owned.includes(id!) || clothingById(id!)?.slot !== slot)
        throw Error('Invariant: unowned clothing');
}
