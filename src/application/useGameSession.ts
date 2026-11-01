import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameRun, RunAction, RunSetup, SaveSnapshot } from '../domain/model';
import { guestRepository, type GameRepository } from '../persistence/repository';
import { createRun } from '../engine/engine';
import { storyAction } from './story-flow';
import { LocalBranchConflict } from '../persistence/account-cache';
export function useGameSession(repository: GameRepository = guestRepository) {
  const [identity, setIdentity] = useState('');
  const currentRun = useRef<GameRun | null>(null);
  const [run, setRun] = useState<GameRun | null>(null),
    [ready, setReady] = useState(false),
    [saveStatus, setSaveStatus] = useState('Chưa có cuộc đời đang chơi'),
    [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    repository
      .read('autosave')
      .then((s) => {
        if (!cancelled) {
          currentRun.current = s?.run ?? null;
          setRun(currentRun.current);
          setIdentity(s?.identity ?? crypto.randomUUID());
          setReady(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Không đọc được bản tự lưu.');
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);
  useEffect(() => {
    if (!run || !ready || !identity) return;
    let cancelled = false;
    setSaveStatus('Đang tự lưu…');
    repository
      .write('autosave', run, identity)
      .then(async () => {
        if (run.status === 'ended') await repository.archive(run, identity);
      })
      .then(() => {
        if (!cancelled) setSaveStatus('Đã tự lưu trên máy');
      })
      .catch((e) => {
        if (!cancelled) {
          setSaveStatus('Chưa lưu được');
          setError(
            e instanceof LocalBranchConflict
              ? e.message
              : 'Chưa giữ được đầy đủ bản lưu/lịch sử. Hãy xuất tệp trong mục Lưu game; mở Lịch sử cuộc đời để thử lưu lại.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [run, ready, identity, repository]);
  const act = useCallback((action: RunAction, expectedDecision?: string) => {
    if (!currentRun.current) return;
    try {
      // Preserve historical replay rules while reserving room for the rest of the story.
      if (
        !['choose', 'advance'].includes(action.type) &&
        currentRun.current.actions.length +
          2 *
            (currentRun.current.setup.lifeRules === 'annual-v1'
              ? Math.max(0, 160 - Math.floor(currentRun.current.month / 12))
              : 84 - Math.floor(currentRun.current.month / 12)) +
          20 >=
          512
      )
        throw Error(
          'Cần giữ phần bản lưu còn lại cho câu chuyện; hãy tiếp tục cuộc đời trước khi quản lý thêm.',
        );
      const next = storyAction(currentRun.current, action, expectedDecision);
      if (next === currentRun.current) return;
      currentRun.current = next;
      setRun(next);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thực hiện được lựa chọn.');
    }
  }, []);
  const start = useCallback((seed: string, setup?: RunSetup) => {
    const actual =
      seed.trim() || `viet-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
    currentRun.current = createRun(actual, setup);
    setRun(currentRun.current);
    setIdentity(crypto.randomUUID());
    setError('');
  }, []);
  const restore = (s: SaveSnapshot) => {
    currentRun.current = s.run;
    setRun(currentRun.current);
    setIdentity(s.identity ?? crypto.randomUUID());
    setError('');
  };
  return { run, identity, ready, saveStatus, error, setError, act, start, restore };
}
