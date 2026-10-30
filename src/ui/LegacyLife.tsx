import type { GameRun } from '../domain/model';
import { Journal } from './Journal';
export function LegacyLife({ run, onNew }: { run: GameRun; onNew: () => void }) {
  return (
    <section className="journal-page">
      <h1>Cuộc đời từ bản v0.1</h1>
      <p className="lead">
        {run.player.name} · {run.player.birthYear}–{run.world.year}
      </p>
      <p>
        Bản lưu này đã được kiểm chứng bằng bộ luật 1.0.0 giữ nguyên. Bạn có thể đọc nhật ký, xem
        các khoản tiền và xuất lại trong mục Lưu game. Cuộc đời được giữ ở chế độ chỉ đọc; các lựa
        chọn v0.2 dành cho kiếp mới.
      </p>
      <p>
        Tiền mặt {run.finance.cash} đSM · tiết kiệm {run.finance.savings} đSM · nợ{' '}
        {run.finance.liability.principal} đSM.
      </p>
      <button className="button primary" onClick={onNew}>
        Bắt đầu kiếp v0.2 mới
      </button>
      <Journal run={run} />
    </section>
  );
}
