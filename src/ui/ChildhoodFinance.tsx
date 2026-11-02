import type { GameRun, RunAction } from '../domain/model';
import { designMoney, formatMoney, currencyOf } from '../domain/currency';
import { childLivingCost } from '../engine/childhood';
import { discretionaryCount } from '../domain/rules';
export function ChildhoodFinance({ run, act }: { run: GameRun; act: (a: RunAction) => void }) {
  const h = run.childhoodFinance!,
    f = run.finance,
    own = run.month >= 72;
  const amount = Math.min(f.cash, designMoney(run, run.month < 156 ? 1 : 5));
  const disabled = !own || run.status !== 'playing' || !amount || discretionaryCount(run) >= 120;
  const money = (value: number) => formatMoney(value, run);
  return (
    <section className="panel-page" data-testid="childhood-finance">
      <span className="eyebrow">TIỀN CỦA AI, GHI RÕ PHẦN ĐÓ</span>
      <h2>{own ? 'Tập dùng phần tiền của mình.' : 'Khoản nhỏ dành cho con.'}</h2>
      <p>
        {own
          ? 'Tiền tiêu vặt và thù lao việc nhỏ phù hợp tuổi là tiền của bạn. Bạn chỉ chi trong phần đang có.'
          : 'Trẻ nhỏ chưa có ví để tự chi. Quà thuộc về con được ghi vào tiết kiệm, người chăm sóc giữ hộ.'}{' '}
        Sinh hoạt và chăm sóc do quỹ hộ chi trả.
      </p>
      <div className="finance-overview" data-currency={currencyOf(run)}>
        {[
          ['Tiền cá nhân có thể dùng', money(f.cash)],
          ['Để dành đứng tên con', money(f.savings)],
          ['Quỹ hộ chăm sóc', money(h.cash)],
          ['Hộ chi sinh hoạt dự kiến', money(childLivingCost(run)) + '/tháng'],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="fine-print">
        Quỹ hộ không tính vào tài sản của bạn. Khoản của con vẫn được ghi riêng tới tuổi tự quản;
        đủ18 tuổi không nhận toàn bộ quỹ gia đình. Trẻ không vay bù sinh hoạt.
      </p>
      {own && (
        <div className="finance-actions">
          <button
            className="button secondary"
            disabled={disabled}
            onClick={() =>
              act({
                type: 'minor-finance',
                operation: 'save',
                amount,
                expected: run.actions.length,
              })
            }
          >
            Để dành {money(amount)}
          </button>
          <button
            className="button secondary"
            disabled={disabled}
            onClick={() =>
              act({
                type: 'minor-finance',
                operation: 'spend',
                amount,
                expected: run.actions.length,
              })
            }
          >
            Chi nhỏ {money(amount)}
          </button>
        </div>
      )}
      {own && (
        <p className="fine-print">
          Chi nhỏ hoặc để dành dùng chung120 lượt quản lý; còn{' '}
          {Math.max(0, 120 - discretionaryCount(run))} lượt. Không đủ tiền thì chờ khoản tiêu vặt
          tiếp theo; không tự lấy quỹ hộ.
        </p>
      )}
      <p className="fine-print">
        {currencyOf(run) === 'vnd-v1'
          ? 'VND theo sức mua thiết kế năm2026, không phải giá danh nghĩa lịch sử.'
          : 'đSM là đơn vị sức mua thiết kế của game.'}{' '}
        Tiết kiệm thuộc con có lãi0,15%/tháng, làm tròn xuống. Các khoản của hộ là tham số mô phỏng.
      </p>
      <h3>Giao dịch đứng tên con</h3>
      <ul className="child-ledger">
        {f.transactions
          .slice(-12)
          .reverse()
          .map((t) => (
            <li key={t.id}>
              <span>
                {run.player.birthYear + Math.floor(t.month / 12)} · {t.label}
              </span>
              <strong>{money(t.cash + t.savings)}</strong>
            </li>
          ))}
      </ul>
      <h3>Quỹ hộ chi và chuyển cho con</h3>
      <ul className="child-ledger">
        {h.transactions
          .slice(-12)
          .reverse()
          .map((t) => (
            <li key={t.id}>
              <span>
                {run.player.birthYear + Math.floor(t.month / 12)} · {t.label}
              </span>
              <strong>{money(t.cash)}</strong>
            </li>
          ))}
      </ul>
      <p className="fine-print">
        Toàn bộ {f.transactions.length} khoản cá nhân và {h.transactions.length} khoản hộ giữ trong
        tệp lưu; mỗi sổ đang hiện12 khoản gần nhất.
      </p>
    </section>
  );
}
