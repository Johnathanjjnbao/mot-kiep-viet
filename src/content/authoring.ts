import type { Choice, Effect, EventDefinition, Stat } from '../domain/model';
import { additions } from './choice-expansion';
export const choice = (
  id: string,
  text: string,
  hint: string,
  outcome: string,
  effects: Effect[] = [],
  extra: Partial<Choice> = {},
): Choice => ({ id, text, hint, outcome, effects, ...extra });
export function event(
  id: string,
  category: EventDefinition['category'],
  title: string,
  text: string,
  condition: EventDefinition['condition'],
  choices: Choice[],
  extra: Partial<EventDefinition> = {},
): EventDefinition {
  return {
    id,
    version: 2,
    category,
    title,
    text,
    condition: id === 'first-rain' ? { ...condition, npc: 'mother' } : condition,
    choices: (extra.version ?? 2) >= 3 ? choices : [...choices, ...additions(id)],
    weight: 10,
    cooldown: 60,
    once: true,
    priority: 0,
    sensitivity: [],
    provenance: {
      kind: 'designed',
      note: 'Tình huống hư cấu và tham số cân bằng do tác giả thiết kế.',
    },
    ...extra,
  };
}
export const stat = (stat: Stat, amount: number): Effect => ({ kind: 'stat', stat, amount });
export const money = (amount: number, label: string): Effect => ({ kind: 'cash', amount, label });
export const flag = (flag: string, value = true): Effect => ({ kind: 'flag', flag, value });
export const later = (afterMonths: number, label: string, effects: Effect[]): Effect => ({
  kind: 'schedule',
  afterMonths,
  label,
  effects,
});
export const bond = (
  target: 'mother' | 'father' | 'friend' | 'partner',
  amount: number,
): Effect => ({ kind: 'relationship', target, amount });
