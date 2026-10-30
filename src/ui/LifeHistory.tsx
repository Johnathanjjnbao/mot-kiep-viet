import { useCallback, useEffect, useState, useRef } from 'react';
import type { GameRun } from '../domain/model';
import { exportHistory, MAX_HISTORY_BYTES, type LifeRecord } from '../persistence/history';
import { Summary } from './LifeScreens';
import { Avatar } from './Avatar';
import { Journal } from './Journal';
import { birthplaceOf, familyText, PARENT_TRAITS } from '../domain/creator';
import { ageOf, CAREERS } from '../content/world';
import { downloadFile } from './common';
import { guestRepository, type GameRepository } from '../persistence/repository';
import { AccountRepository } from '../cloud/account';
export function LifeHistory({
  run,
  identity,
  onNew,
  repository = guestRepository,
}: {
  run: GameRun | null;
  identity: string;
  onNew: () => void;
  repository?: GameRepository;
}) {
  const [records, setRecords] = useState<LifeRecord[]>([]),
    [selected, setSelected] = useState<LifeRecord | null>(null),
    [journal, setJournal] = useState(false),
    [message, setMessage] = useState('Đang đọc lịch sử…'),
    [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const refresh = useCallback(async () => {
    try {
      setRecords(await repository.history());
      setMessage('');
    } catch {
      setMessage('Không đọc được lịch sử trên trình duyệt. Các ô lưu vẫn được giữ nguyên.');
    }
  }, [repository]);
  useEffect(() => {
    void refresh();
    if (repository instanceof AccountRepository)
      void repository
        .moreHistory()
        .then(refresh)
        .catch(() =>
          setMessage('Chưa tải được lịch sử đám mây. Những bản trên thiết bị vẫn đọc được.'),
        );
  }, [repository, refresh]);
  async function perform(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await refresh();
      setMessage('Đã giữ lại lịch sử.');
    } catch (e) {
      setMessage(
        e instanceof Error && ['ZodError', 'SyntaxError'].includes(e.name)
          ? 'Tệp lịch sử thiếu dữ liệu, sai định dạng hoặc chưa được hỗ trợ.'
          : e instanceof Error && e.name === 'QuotaExceededError'
            ? 'Bộ nhớ trình duyệt đã đầy. Hãy xuất bản sao; các lịch sử cũ được giữ nguyên.'
            : e instanceof Error
              ? e.message
              : 'Không xử lý được dữ liệu.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="history-page">
      <header>
        <h1>Lịch sử cuộc đời</h1>
        <p>Mỗi kiếp đã khép lại có một chỗ riêng. Bắt đầu kiếp mới không xóa những trang này.</p>
      </header>
      <div className="button-row">
        <button
          className="button secondary"
          disabled={busy || !records.length}
          onClick={() =>
            downloadFile(exportHistory(records.slice(0, 50)), 'mot-kiep-viet-lich-su.json')
          }
        >
          {repository instanceof AccountRepository
            ? 'Xuất lịch sử đã tải (tối đa 50)'
            : 'Xuất toàn bộ lịch sử'}
        </button>
        <button className="button secondary" disabled={busy} onClick={() => file.current?.click()}>
          Nhập lịch sử
        </button>
        {run?.status === 'ended' && (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => void perform(() => repository.archive(run, identity))}
          >
            Thử lưu lại kiếp vừa kết thúc
          </button>
        )}
        <input
          className="visually-hidden"
          ref={file}
          type="file"
          accept=".json"
          aria-label="Chọn tệp lịch sử"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f)
              void perform(async () => {
                if (f.size > MAX_HISTORY_BYTES) throw new Error('Tệp vượt 20 MiB.');
                await repository.importHistory(await f.text());
                if (file.current) file.current.value = '';
              });
          }}
        />
      </div>
      {repository instanceof AccountRepository && (
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => void perform(() => repository.moreHistory())}
        >
          Tải thêm lịch sử từ đám mây
        </button>
      )}
      <p role="status">{busy ? 'Đang xử lý…' : message}</p>
      {!records.length && !busy && (
        <p className="history-empty">
          Chưa có kiếp hoàn tất. Khi bạn đến hồi ký hoặc cuộc đời khép lại, game sẽ tự giữ một bản ở
          đây.
        </p>
      )}
      <div className="history-grid">
        {records.map((record) => (
          <article key={record.id}>
            <div className="history-avatar">
              <Avatar run={record.save.run} portrait />
            </div>
            <span>
              {record.save.run.player.birthYear} — {record.save.run.world.year} ·{' '}
              {ageOf(record.save.run)} tuổi
            </span>
            <h2>{record.save.run.player.name}</h2>
            <p>
              {birthplaceOf(record.save.run)} · {record.save.run.household.background}
            </p>
            <p>{familyText(record.save.run)}</p>
            <button
              className="text-button"
              onClick={() => {
                setSelected(record);
                setJournal(false);
              }}
            >
              Đọc cuộc đời này
            </button>
            <button
              className="text-button"
              onClick={() => downloadFile(exportHistory([record]), `cuoc-doi-${record.id}.json`)}
            >
              Xuất cuộc đời
            </button>
          </article>
        ))}
      </div>
      {selected && (
        <div className="history-reading">
          <button className="button secondary" onClick={() => setSelected(null)}>
            Đóng cuộc đời đang đọc
          </button>
          <p className="fine-print">
            Bản lưu lịch sử không thay cuộc đời đang chơi. Hồi ký nguyên bản:
          </p>
          <p className="lead">{selected.memoir}</p>
          <Summary run={selected.save.run} onNew={onNew} onJournal={() => setJournal(!journal)} />
          {journal && <Journal run={selected.save.run} />}
          <details>
            <summary>Những người và công việc đã đi qua</summary>
            {selected.save.run.npcs
              .filter((n) => n.presence !== 'unknown')
              .map((n) => (
                <p key={n.id}>
                  {n.name} · {n.alive ? 'Còn sống' : 'Đã qua đời'} ·{' '}
                  {(n.personality ?? []).map((t) => PARENT_TRAITS[t]).join(', ')}
                </p>
              ))}
            {selected.save.run.player.careers.map((c, i) => (
              <p key={i}>
                {CAREERS.find((j) => j.id === c.id)?.name} · {Math.floor(c.startMonth / 12)}–
                {Math.floor((c.endMonth ?? selected.save.run.month) / 12)} tuổi
              </p>
            ))}
          </details>
        </div>
      )}
      <p className="fine-print">
        {repository instanceof AccountRepository
          ? 'Lịch sử riêng theo tài khoản, tải theo từng trang. Bản trên thiết bị giúp bạn đọc lại khi mất mạng; tệp nhập tối đa 50 kiếp và 20 MiB.'
          : 'Lưu trên thiết bị, tối đa 50 kiếp; tệp nhập tối đa 20 MiB. Đăng nhập tài khoản được mời để dùng lịch sử đám mây.'}
      </p>
    </section>
  );
}
