import { useCallback, useEffect, useState } from 'react';
import type { GameRun, RunAction, RunSetup } from '../domain/model';
import { createRun, dispatch } from '../engine/engine';
import { readSave, writeSave } from '../persistence/saves';
export function useGameSession() {
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
    if (!run || !ready) return;
    let cancelled = false;
    setSaveStatus('Đang tự lưu…');
    writeSave('autosave', run)
      .then(() => {
        if (!cancelled) setSaveStatus('Đã tự lưu trên máy');
      })
      .catch(() => {
        if (!cancelled) {
          setSaveStatus('Chưa lưu được');
          setError('Trình duyệt chưa lưu được dữ liệu. Bạn có thể xuất tệp trong mục Lưu game.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [run, ready]);
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
    setError('');
  }, []);
  return { run, ready, saveStatus, error, setError, act, start, restore: setRun };
}
