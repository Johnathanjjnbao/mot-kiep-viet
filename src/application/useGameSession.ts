import { useCallback, useEffect, useState } from 'react';
import type { GameRun, RunAction, RunSetup, SaveSnapshot } from '../domain/model';
import { archiveLife } from '../persistence/history';
import { createRun, dispatch } from '../engine/engine';
import { readSave, writeSave } from '../persistence/saves';
export function useGameSession() {
  const [identity, setIdentity] = useState('');
  const [run, setRun] = useState<GameRun | null>(null),
    [ready, setReady] = useState(false),
    [saveStatus, setSaveStatus] = useState('Chưa có cuộc đời đang chơi'),
    [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    readSave('autosave')
      .then((s) => {
        if (!cancelled) {
          setRun(s?.run ?? null);
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
  }, []);
  useEffect(() => {
    if (!run || !ready || !identity) return;
    let cancelled = false;
    setSaveStatus('Đang tự lưu…');
    writeSave('autosave', run, identity)
      .then(async () => {
        if (run.status === 'ended') await archiveLife(run, identity);
      })
      .then(() => {
        if (!cancelled) setSaveStatus('Đã tự lưu trên máy');
      })
      .catch(() => {
        if (!cancelled) {
          setSaveStatus('Chưa lưu được');
          setError(
            'Chưa giữ được đầy đủ bản lưu/lịch sử. Hãy xuất tệp trong mục Lưu game; mở Lịch sử cuộc đời để thử lưu lại.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [run, ready, identity]);
  const act = useCallback(
    (action: RunAction) => {
      if (!run) return;
      try {
        setRun(dispatch(run, action));
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Không thực hiện được lựa chọn.');
      }
    },
    [run],
  );
  const start = useCallback((seed: string, setup?: RunSetup) => {
    const actual =
      seed.trim() || `viet-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
    setRun(createRun(actual, setup));
    setIdentity(crypto.randomUUID());
    setError('');
  }, []);
  const restore = (s: SaveSnapshot) => {
    setRun(s.run);
    setIdentity(s.identity ?? crypto.randomUUID());
    setError('');
  };
  return { run, identity, ready, saveStatus, error, setError, act, start, restore };
}
