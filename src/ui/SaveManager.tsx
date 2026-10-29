import { useEffect, useRef, useState } from 'react';
import { Download, FolderOpen, Save, Upload } from 'lucide-react';
import type { GameRun } from '../domain/model';
import {
  MAX_SAVE_BYTES,
  listSlots,
  parseSave,
  readSave,
  snapshot,
  writeSave,
  type SaveKey,
} from '../persistence/saves';
import { ageOf } from '../content/world';
import { downloadFile } from './common';
export function SaveManager({
  run,
  onLoad,
}: {
  run: GameRun | null;
  onLoad: (run: GameRun) => void;
}) {
  const [slots, setSlots] = useState<Awaited<ReturnType<typeof listSlots>>>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [overwrite, setOverwrite] = useState<SaveKey | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const refresh = () => listSlots().then(setSlots);
  useEffect(() => {
    void refresh();
  }, []);
  async function save(key: SaveKey) {
    if (!run) return;
    setBusy(true);
    try {
      await writeSave(key, run);
      await refresh();
      setMessage('Đã lưu vào ô bạn chọn.');
      setOverwrite(null);
    } catch {
      setMessage('Chưa lưu được. Bạn có thể xuất tệp để giữ bản sao.');
    } finally {
      setBusy(false);
    }
  }
  async function load(key: SaveKey) {
    setBusy(true);
    try {
      const s = await readSave(key);
      if (s) onLoad(s.run);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Không tải được.');
    } finally {
      setBusy(false);
    }
  }
  async function importFile(f: File) {
    setBusy(true);
    try {
      if (f.size > MAX_SAVE_BYTES) throw new Error('Tệp lưu vượt giới hạn 5 MiB.');
      const s = parseSave(await f.text());
      onLoad(s.run);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Không nhập được tệp.');
    } finally {
      setBusy(false);
      if (file.current) file.current.value = '';
    }
  }
  return (
    <div className="save-manager">
      <p className="muted">
        Bản tự lưu giữ tiến độ hiện tại. Ba ô bên dưới là những dấu trang bạn tự chọn giữ lại.
      </p>
      <div className="save-slots">
        {slots.map((slot, i) => (
          <article className="save-slot" key={slot.key}>
            <span className="eyebrow">DẤU TRANG 0{i + 1}</span>
            <h3>
              {slot.save?.run.player.name ??
                (slot.error ? 'Ô lưu cần kiểm tra' : 'Một trang còn trống')}
            </h3>
            <p>
              {slot.save
                ? `${ageOf(slot.save.run)} tuổi · Năm ${slot.save.run.world.year}`
                : (slot.error ?? 'Chưa có cuộc đời được lưu.')}
            </p>
            <div className="button-row">
              <button
                className="button secondary"
                disabled={!run || busy}
                onClick={() =>
                  slot.save || slot.error ? setOverwrite(slot.key) : void save(slot.key)
                }
              >
                <Save size={16} aria-hidden="true" />
                Lưu vào ô {i + 1}
              </button>
              <button
                className="text-button"
                disabled={!slot.save || busy}
                onClick={() => void load(slot.key)}
              >
                <FolderOpen size={16} aria-hidden="true" />
                Tải lại
              </button>
            </div>
            {overwrite === slot.key && (
              <div className="inline-confirm">
                <p>Lưu tiến độ hiện tại sẽ thay dấu trang này.</p>
                <button
                  className="button small"
                  disabled={busy}
                  onClick={() => void save(slot.key)}
                >
                  Thay bản lưu
                </button>
                <button className="text-button" onClick={() => setOverwrite(null)}>
                  Giữ bản cũ
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="file-actions">
        <button
          className="button secondary"
          disabled={!run || busy}
          onClick={() =>
            run &&
            downloadFile(
              JSON.stringify(snapshot(run)),
              `mot-kiep-viet-${run.id.split(':')[1]}.json`,
            )
          }
        >
          <Download size={17} aria-hidden="true" />
          Xuất tệp lưu
        </button>
        <button className="button secondary" disabled={busy} onClick={() => file.current?.click()}>
          <Upload size={17} aria-hidden="true" />
          Nhập tệp lưu
        </button>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          className="visually-hidden"
          aria-label="Chọn tệp game đã lưu"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importFile(f);
          }}
        />
      </div>
      <p className="fine-print">
        Tệp JSON tối đa 5 MiB. Nhập hoặc tải ô lưu sẽ thay cuộc đời đang tiếp tục trong bản tự lưu.
        Các ô khác được giữ nguyên. Dữ liệu nằm trong trình duyệt này; xuất tệp để mang sang thiết
        bị khác.
      </p>
      <p role="status" className="feedback">
        {busy ? 'Đang xử lý…' : message}
      </p>
    </div>
  );
}
