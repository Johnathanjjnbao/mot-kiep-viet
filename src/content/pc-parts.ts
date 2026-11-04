import { PART_SLOTS, type PartSlot, type PcParts } from '../domain/living-assets';

export interface PcPart {
  id: string;
  slot: PartSlot;
  name: string;
  from: number;
  price: number;
  watts: number;
  score: number;
  socket?: string;
  ram?: string;
  form?: string;
  forms?: string[];
  interfaces?: string[];
  storageInterface?: string;
  length?: number;
  clearance?: number;
  capacity?: number;
  cooling?: number;
  heat?: number;
}
const slots: Record<PartSlot, string> = {
  cpu: 'CPU',
  board: 'Bo mạch chủ',
  ram: 'RAM',
  gpu: 'Đồ họa',
  storage: 'Ổ lưu trữ',
  psu: 'Nguồn',
  case: 'Vỏ máy',
  cooling: 'Tản nhiệt',
  display: 'Màn hình',
};
export const PART_LABELS = slots;
const families = [
  {
    key: 'classic',
    name: 'cổ điển',
    year: 1995,
    socket: 'S95',
    ram: 'R95',
    storage: 'IDE',
    score: 15,
    prices: [900_000, 800_000, 350_000, 650_000, 450_000, 350_000, 300_000, 150_000, 800_000],
  },
  {
    key: 'daily',
    name: 'đa dụng',
    year: 2010,
    socket: 'S10',
    ram: 'R10',
    storage: 'SATA',
    score: 40,
    prices: [
      1_600_000, 1_300_000, 700_000, 2_200_000, 700_000, 600_000, 500_000, 300_000, 1_300_000,
    ],
  },
  {
    key: 'balanced',
    name: 'cân bằng',
    year: 2020,
    socket: 'S20',
    ram: 'R20',
    storage: 'NVMe',
    score: 65,
    prices: [
      2_700_000, 2_200_000, 1_200_000, 5_800_000, 1_100_000, 900_000, 800_000, 500_000, 2_100_000,
    ],
  },
  {
    key: 'future',
    name: 'tương lai hư cấu',
    year: 2035,
    socket: 'SF35',
    ram: 'RF35',
    storage: 'NVMe',
    score: 85,
    prices: [
      4_400_000, 3_800_000, 2_800_000, 9_000_000, 2_000_000, 1_800_000, 1_600_000, 1_400_000,
      3_300_000,
    ],
  },
];
/** Synthetic compatibility families, not real products or benchmark claims. */
export const PC_PARTS: PcPart[] = families.flatMap((f) =>
  PART_SLOTS.map((slot, i) => ({
    id: `${f.key}-${slot}`,
    slot,
    name: `${slots[slot]} ${f.name}`,
    from: f.year,
    price: f.prices[i],
    watts: {
      cpu: 65,
      board: 25,
      ram: 10,
      gpu: 120,
      storage: 8,
      psu: 0,
      case: 5,
      cooling: 8,
      display: 25,
    }[slot],
    score: f.score,
    ...(slot === 'cpu' ? { socket: f.socket, heat: 65 } : {}),
    ...(slot === 'board'
      ? { socket: f.socket, ram: f.ram, form: 'mATX', interfaces: [f.storage] }
      : {}),
    ...(slot === 'ram' ? { ram: f.ram } : {}),
    ...(slot === 'gpu' ? { length: 240 } : {}),
    ...(slot === 'storage' ? { storageInterface: f.storage } : {}),
    ...(slot === 'psu' ? { capacity: 450 } : {}),
    ...(slot === 'case' ? { forms: ['mATX', 'ITX'], clearance: 280 } : {}),
    ...(slot === 'cooling' ? { socket: f.socket, cooling: 95 } : {}),
  })),
);
PC_PARTS.push(
  {
    id: 'balanced-cpu-pro',
    slot: 'cpu',
    name: 'CPU sáng tạo mô phỏng',
    from: 2020,
    price: 6_500_000,
    watts: 125,
    score: 88,
    socket: 'S20',
    heat: 125,
  },
  {
    id: 'balanced-gpu-pro',
    slot: 'gpu',
    name: 'Đồ họa hiệu năng cao mô phỏng',
    from: 2020,
    price: 15_500_000,
    watts: 320,
    score: 92,
    length: 340,
  },
  {
    id: 'roomy-case',
    slot: 'case',
    name: 'Vỏ máy rộng thoáng mô phỏng',
    from: 2010,
    price: 1_600_000,
    watts: 8,
    score: 65,
    forms: ['ATX', 'mATX', 'ITX'],
    clearance: 380,
  },
  {
    id: 'strong-psu',
    slot: 'psu',
    name: 'Nguồn dư tải mô phỏng',
    from: 2010,
    price: 1_800_000,
    watts: 0,
    score: 75,
    capacity: 750,
  },
  {
    id: 'balanced-cooling-pro',
    slot: 'cooling',
    name: 'Tản nhiệt lớn mô phỏng',
    from: 2020,
    price: 1_200_000,
    watts: 12,
    score: 80,
    socket: 'S20',
    cooling: 180,
  },
);
export const pcPart = (id: string) => PC_PARTS.find((p) => p.id === id);
export function pcAssessment(parts: PcParts, year: number) {
  const errors: string[] = [],
    selected = PART_SLOTS.map((s) => pcPart(parts[s]));
  for (let i = 0; i < selected.length; i++) {
    const p = selected[i];
    if (!p || p.slot !== PART_SLOTS[i]) errors.push(`Chọn đúng linh kiện ${slots[PART_SLOTS[i]]}.`);
    else if (p.from > year) errors.push(`${p.name} chưa có trong thời kỳ này của mô phỏng.`);
  }
  const [cpu, board, ram, gpu, storage, psu, chassis, cooling, display] = selected;
  if (cpu && board && cpu.socket !== board.socket) errors.push('CPU và bo mạch chủ khác socket.');
  if (ram && board && ram.ram !== board.ram)
    errors.push('RAM không đúng thế hệ bo mạch chủ hỗ trợ.');
  if (gpu && chassis && gpu.length! > chassis.clearance!)
    errors.push('Đồ họa dài hơn khoảng trống của vỏ máy.');
  if (board && chassis && !chassis.forms?.includes(board.form!))
    errors.push('Vỏ máy không chứa được kích thước bo mạch chủ.');
  if (storage && board && !board.interfaces?.includes(storage.storageInterface!))
    errors.push('Bo mạch chủ không có giao tiếp của ổ lưu trữ này.');
  if (cpu && cooling && (cpu.socket !== cooling.socket || cooling.cooling! < cpu.heat!))
    errors.push('Tản nhiệt sai socket hoặc không đủ tải nhiệt CPU.');
  const watts = selected.reduce((n, p) => n + (p?.watts ?? 0), 0),
    required = Math.ceil((watts - (display?.watts ?? 0)) * 1.25);
  if (psu && psu.capacity! < required)
    errors.push(`Nguồn cần ít nhất ${required} W theo mô hình có dự phòng.`);
  const compute = Math.round(
      ((cpu?.score ?? 0) * 3 + (ram?.score ?? 0) + (storage?.score ?? 0)) / 5,
    ),
    gaming = Math.round(((cpu?.score ?? 0) + (gpu?.score ?? 0) * 3) / 4);
  return {
    errors,
    price: selected.reduce((n, p) => n + (p?.price ?? 0), 0),
    compute,
    gaming,
    creator: Math.round((compute + gaming) / 2),
    watts,
    required,
    noise: cpu && cooling ? Math.min(100, Math.round((cpu.heat! / cooling.cooling!) * 60)) : 100,
    reliability: errors.length ? 0 : 90,
    future: selected.some((p) => p && p.from > 2026),
  };
}
export function pcPreset(year: number): PcParts {
  const f = [...families].reverse().find((p) => p.year <= year) ?? families[0];
  return Object.fromEntries(PART_SLOTS.map((s) => [s, `${f.key}-${s}`])) as PcParts;
}
