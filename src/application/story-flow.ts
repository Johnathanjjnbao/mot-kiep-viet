import type { GameRun, RunAction } from '../domain/model';
import { dispatch } from '../engine/engine';

// Includes action count and month: a recurring event ID is not a decision identity.
export function decisionKey(run: GameRun) {
  return `${run.id}:${run.actions.length}:${run.month}:${run.activeEvent?.id ?? ''}`;
}

export function storyAction(run: GameRun, action: RunAction, expectedDecision?: string): GameRun {
  if (action.type === 'choose' && expectedDecision !== decisionKey(run)) return run;
  let next = dispatch(run, action);
  if (action.type !== 'choose' && action.type !== 'advance') return next;
  // Existing engine milestones remain authoritative. Never skip an active event,
  // invent a choice or perform a financial/administrative action here.
  for (let steps = 0; steps < 100 && next.status === 'playing' && !next.activeEvent; steps++) {
    const before = next.month;
    next = dispatch(next, { type: 'advance' });
    if (next.month <= before && next.status !== 'ended' && !next.activeEvent)
      throw new Error('Câu chuyện đã dừng an toàn. Hãy xuất bản lưu trước khi thử lại.');
  }
  if (next.status === 'playing' && !next.activeEvent)
    throw new Error('Đã chạm giới hạn chuyển cảnh an toàn. Bản lưu trước vẫn được giữ.');
  return next;
}

export function recentResults(run: GameRun) {
  let lastChoice = run.journal.length - 1;
  while (lastChoice >= 0 && !run.journal[lastChoice].choice) lastChoice--;
  return lastChoice < 0 ? [] : run.journal.slice(lastChoice);
}
