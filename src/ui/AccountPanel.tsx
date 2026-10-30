import { useState } from 'react';
import type { useAccount } from '../application/useAccount';
import type { SaveSnapshot } from '../domain/model';
import { exportHistory } from '../persistence/history';
import type { AccountRepository } from '../cloud/account';
import { downloadFile } from './common';
const syncText = {
  local: 'Lưu trên thiết bị',
  pending: 'Đang chờ đồng bộ',
  syncing: 'Đang đồng bộ…',
  synced: 'Đã đồng bộ',
  conflict: 'Có xung đột cần bạn chọn',
  error: 'Chưa đồng bộ được; dữ liệu trên thiết bị được giữ',
};
export function AccountPanel({
  auth,
  onLoad,
}: {
  auth: ReturnType<typeof useAccount>;
  onLoad: (s: SaveSnapshot) => void;
}) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [newPassword, setNewPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [confirm, setConfirm] = useState(false);
  const [preview, setPreview] = useState<Awaited<
      ReturnType<AccountRepository['guestPreview']>
    > | null>(null),
    [conflicts, setConflicts] = useState<Awaited<ReturnType<AccountRepository['conflicts']>>>([]),
    [recoveries, setRecoveries] = useState<SaveSnapshot[]>([]);
  const account = auth.account;
  async function perform(fn: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Chưa thực hiện được. Bạn có thể thử lại.');
    } finally {
      setBusy(false);
      setPassword('');
      setNewPassword('');
    }
  }
  return (
    <div className="account-panel">
      <p>
        Chơi không đăng nhập luôn giữ dữ liệu riêng trên thiết bị. Dùng tài khoản đã được chủ dự án
        tạo và cấp quyền để đồng bộ cuộc đời.
      </p>
      {auth.error && <p role="alert">{auth.error}</p>}
      {!auth.provider ? (
        <p>Đồng bộ đám mây chưa được bật. Bạn vẫn có thể chơi, lưu và xuất dữ liệu bình thường.</p>
      ) : !account ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void perform(async () => {
              await auth.provider!.signIn(email, password);
            });
          }}
        >
          <label>
            Email tài khoản
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <div className="button-row">
            <button className="button primary" disabled={busy || auth.loading}>
              Đăng nhập
            </button>
          </div>
          <p className="fine-print">
            Nếu quên mật khẩu, liên hệ chủ dự án để được hỗ trợ đặt lại an toàn. Khôi phục qua email
            chưa được bật.
          </p>
        </form>
      ) : (
        <>
          <p>
            <strong>{auth.email}</strong>
          </p>
          <p role="status">{syncText[auth.status]}</p>
          <div className="button-row">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                void perform(async () => {
                  await account.retry();
                  const pending = await account.conflicts();
                  setConflicts(pending);
                  if (!pending.length) {
                    const saved = await account.read('autosave');
                    if (saved) onLoad(saved);
                  }
                })
              }
            >
              Đồng bộ tiến trình
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                void perform(async () => {
                  await auth.provider!.signOut();
                })
              }
            >
              Đăng xuất trên thiết bị này
            </button>
          </div>
          {(auth.status === 'conflict' || conflicts.length > 0) && (
            <section aria-label="Giải quyết xung đột">
              <p>
                Hai thiết bị đã đi theo hai nhánh. Chọn nhánh tiếp tục; nhánh còn lại được giữ trong
                bản sao khôi phục. Bạn có thể chơi tiếp nhánh còn lại như một cuộc đời riêng.
              </p>
              {!conflicts.length && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => void perform(async () => setConflicts(await account.conflicts()))}
                >
                  Xem hai nhánh
                </button>
              )}
              {conflicts.map((c) => (
                <article key={c.remote.slot}>
                  <h3>
                    {c.remote.slot === 'autosave'
                      ? 'Bản tự lưu'
                      : `Ô lưu ${c.remote.slot.slice(-1)}`}
                  </h3>
                  <p>
                    Thiết bị: {c.local.run.player.name}, năm {c.local.run.world.year}. Đám mây:{' '}
                    {c.remote.save.run.player.name}, năm {c.remote.save.run.world.year}.
                  </p>
                  {[true, false].map((keep) => (
                    <button
                      key={String(keep)}
                      className="button secondary"
                      disabled={busy}
                      onClick={() =>
                        void perform(async () => {
                          await account.resolve(c.remote, keep);
                          if (c.remote.slot === 'autosave') {
                            const chosen = await account.read('autosave');
                            if (chosen) onLoad(chosen);
                          }
                          setConflicts(await account.conflicts());
                          setRecoveries(await account.cache.recoveries());
                        })
                      }
                    >
                      {keep ? 'Tiếp tục bản trên thiết bị' : 'Tiếp tục bản trên đám mây'}
                    </button>
                  ))}
                </article>
              ))}
            </section>
          )}
          <details>
            <summary>Đổi mật khẩu</summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void perform(async () => {
                  await auth.provider!.setPassword(newPassword);
                  setMessage('Đã cập nhật mật khẩu.');
                });
              }}
            >
              <label>
                Mật khẩu mới, ít nhất 12 ký tự
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
              <button className="button secondary" disabled={busy}>
                Lưu mật khẩu mới
              </button>
            </form>
          </details>
          <hr />
          <button
            className="button secondary"
            disabled={busy}
            onClick={() =>
              void perform(async () => {
                setPreview(await account.guestPreview());
                setConfirm(false);
              })
            }
          >
            Chuyển dữ liệu từ thiết bị này vào tài khoản
          </button>
          {preview && (
            <section aria-label="Xem trước chuyển dữ liệu">
              <p>
                Đích: {auth.email}. Có {preview.saves.length} bản lưu và {preview.history.length}{' '}
                cuộc đời khách. Ô tài khoản đang có dữ liệu sẽ được giữ; bản khách tương ứng được
                thêm vào bản sao khôi phục để bạn chọn dùng.
              </p>
              {preview.saves.map((s) => (
                <p key={s.key}>
                  {s.key === 'autosave' ? 'Tự lưu' : `Ô ${s.key.slice(-1)}`}:{' '}
                  {s.save.run.player.name} · {s.save.run.world.year}{' '}
                  <button
                    className="text-button"
                    onClick={() => downloadFile(JSON.stringify(s.save), `khach-${s.key}.json`)}
                  >
                    Xuất bản sao
                  </button>
                </p>
              ))}
              {preview.history.length > 0 && (
                <button
                  className="text-button"
                  onClick={() => downloadFile(exportHistory(preview.history), 'khach-lich-su.json')}
                >
                  Xuất lịch sử khách
                </button>
              )}
              <label className="account-confirm">
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                />
                Tôi đồng ý sao chép các dữ liệu trên vào tài khoản {auth.email}.
              </label>
              <button
                className="button primary"
                disabled={!confirm || busy}
                onClick={() =>
                  void perform(async () => {
                    await account.migrateGuest();
                    setPreview(null);
                    setConfirm(false);
                    setRecoveries(await account.cache.recoveries());
                    setMessage(
                      'Đã giữ dữ liệu trong tài khoản trên thiết bị và đưa vào hàng đợi đồng bộ. Dữ liệu khách vẫn còn nguyên.',
                    );
                  })
                }
              >
                Xác nhận sao chép
              </button>
            </section>
          )}
          <details>
            <summary>Bản sao khôi phục</summary>
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                void perform(async () => setRecoveries(await account.cache.recoveries()))
              }
            >
              Đọc các nhánh đã giữ
            </button>
            {recoveries.map((s, i) => (
              <p key={i}>
                {s.run.player.name} · {s.run.world.year}{' '}
                <button
                  className="text-button"
                  onClick={() => downloadFile(JSON.stringify(s), `khoi-phuc-${i + 1}.json`)}
                >
                  Xuất nhánh này
                </button>
                <button className="text-button" disabled={busy} onClick={() => onLoad(s)}>
                  Chơi tiếp nhánh này
                </button>
              </p>
            ))}
          </details>
        </>
      )}
      <p role="status">{busy ? 'Đang xử lý…' : message}</p>
    </div>
  );
}
