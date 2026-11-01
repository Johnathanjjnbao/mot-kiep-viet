import { useState } from 'react';
import { Store, ArrowLeft } from 'lucide-react';
import type { GameRun, RunAction } from '../domain/model';
import type { Enterprise, ProductCategory, RetailPolicy } from '../domain/enterprise';
import type { EnterpriseAction } from '../domain/enterprise-actions';
import { designMoney } from '../domain/currency';
import {
  businessReason,
  CATEGORY_NAMES,
  enterpriseEquity,
  enterpriseProfit,
} from '../engine/business';
import { money } from './common';
type Props = { run: GameRun; act: (a: RunAction) => void };
const PRICES = {
  budget: 'Tiết kiệm · nhiều đơn hơn, lời mỏng',
  balanced: 'Cân bằng · giữ nhịp vừa phải',
  premium: 'Giá cao · ít đơn hơn, biên lời cao',
};
function PolicyFields({
  value,
  onChange,
  prefix,
  disabled,
}: {
  value: RetailPolicy;
  onChange: (v: RetailPolicy) => void;
  prefix: string;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="enterprise-policy">
      <legend>Cách vận hành</legend>
      <label htmlFor={prefix + '-price'}>Định giá</label>
      <select
        id={prefix + '-price'}
        value={value.price}
        onChange={(e) => onChange({ ...value, price: e.target.value as RetailPolicy['price'] })}
      >
        {Object.entries(PRICES).map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
      <label htmlFor={prefix + '-stock'}>Mức hàng muốn dự trữ (0–200 món)</label>
      <input
        id={prefix + '-stock'}
        type="number"
        inputMode="numeric"
        min={0}
        max={200}
        step={1}
        value={value.reorderTarget}
        onChange={(e) => onChange({ ...value, reorderTarget: Number(e.target.value) })}
      />
      <label className="enterprise-check">
        <input
          type="checkbox"
          checked={value.marketing}
          onChange={(e) => onChange({ ...value, marketing: e.target.checked })}
        />
        Quảng bá có phí mỗi tháng
      </label>
    </fieldset>
  );
}
function ShopCard({ run, e, act }: Props & { e: Enterprise }) {
  const [policy, setPolicy] = useState(e.policy),
    [transfer, setTransfer] = useState(String(designMoney(run, 20))),
    [closing, setClosing] = useState(false);
  const reason = businessReason(run),
    ended = e.status === 'closed',
    amount = Number(transfer),
    validAmount = Number.isSafeInteger(amount) && amount > 0;
  const id = e.id as EnterpriseAction['id'];
  const send = (action: Omit<EnterpriseAction, 'type' | 'expected'>) =>
    act({ ...action, type: 'enterprise', expected: run.actions.length });
  const last = e.recent.at(-1),
    pnl = enterpriseProfit(e),
    refund = e.cash + Math.floor((e.stock * e.unitCost) / 2);
  const unchanged =
    policy.price === e.policy.price &&
    policy.marketing === e.policy.marketing &&
    policy.reorderTarget === e.policy.reorderTarget;
  const figures: [string, number | string][] = [
    ['Quỹ tiền của tiệm', money(e.cash, run)],
    ['Hàng còn trong kho', `${e.stock} món`],
    ['Giá vốn hàng tồn', money(e.stock * e.unitCost, run)],
    ['Vốn chủ còn lại', money(enterpriseEquity(e), run)],
  ];
  return (
    <article className="enterprise-card" data-enterprise={e.id}>
      <div className="enterprise-card-head">
        <div>
          <span className="eyebrow">
            TỪ NĂM {run.player.birthYear + Math.floor(e.foundedMonth / 12)}
          </span>
          <h3>Tiệm {CATEGORY_NAMES[e.category].toLowerCase()}</h3>
        </div>
        <span className="badge">
          {ended ? 'Đã khép tiệm' : e.status === 'suspended' ? 'Đang tạm dừng' : 'Đang nhận đơn'}
        </span>
      </div>
      <dl className="enterprise-metrics">
        {figures.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <section className="enterprise-month" aria-label="Kết quả kỳ gần nhất">
        <h4>
          {last
            ? `Kỳ gần nhất · tháng ${(last.month % 12) + 1}/${run.player.birthYear + Math.floor(last.month / 12)}`
            : 'Chưa có kỳ quyết toán'}
        </h4>
        {last ? (
          <>
            <p
              className={last.profit < 0 ? 'enterprise-loss' : 'enterprise-result'}
              data-testid="business-month-profit"
            >
              {last.profit < 0 ? 'Lỗ' : last.profit > 0 ? 'Lời' : 'Hòa vốn'}{' '}
              {money(Math.abs(last.profit), run)}
            </p>
            <dl className="enterprise-metrics">
              <div>
                <dt>Doanh thu sau hoàn hàng</dt>
                <dd>{money(last.revenue, run)}</dd>
              </div>
              <div>
                <dt>Giá vốn hàng đã bán</dt>
                <dd>{money(last.cogs, run)}</dd>
              </div>
              <div>
                <dt>Chi phí vận hành</dt>
                <dd>{money(last.operating, run)}</dd>
              </div>
              <div>
                <dt>Dòng tiền của kỳ</dt>
                <dd>{money(last.cashFlow, run)}</dd>
              </div>
              <div>
                <dt>Đơn / đơn hoàn</dt>
                <dd>
                  {last.orders} / {last.returned}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p>
            Tiệm sẽ nhập hàng và tính kết quả khi bạn tiếp tục cuộc đời. Không cần bấm vận hành mỗi
            tháng.
          </p>
        )}
      </section>
      <p className="fine-print">
        Đã góp {money(e.totals.contributed, run)} · Đã rút {money(e.totals.withdrawn, run)} · Lời/lỗ
        cộng dồn <b data-testid="business-total-profit">{money(pnl, run)}</b>
      </p>
      {!ended && (
        <>
          {reason && (
            <p className="enterprise-notice" role="status">
              {reason}
            </p>
          )}
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              send({ operation: 'policy', id, policy });
            }}
          >
            <PolicyFields value={policy} onChange={setPolicy} prefix={e.id} disabled={!!reason} />
            <button
              className="button secondary"
              disabled={
                !!reason ||
                unchanged ||
                !Number.isInteger(policy.reorderTarget) ||
                policy.reorderTarget < 0 ||
                policy.reorderTarget > 200
              }
            >
              Giữ chính sách này
            </button>
          </form>
          <div className="enterprise-transfer">
            <label htmlFor={e.id + '-amount'}>Số tiền chuyển giữa bạn và tiệm</label>
            <input
              id={e.id + '-amount'}
              type="number"
              inputMode="numeric"
              min={1}
              step={designMoney(run, 1)}
              value={transfer}
              onChange={(ev) => setTransfer(ev.target.value)}
            />
            <p className="fine-print">
              {validAmount ? money(amount, run) : 'Nhập một số tiền nguyên dương.'}
            </p>
            <div className="button-row">
              <button
                className="button secondary"
                disabled={
                  !!reason ||
                  !validAmount ||
                  amount > run.finance.cash ||
                  amount > designMoney(run, 10000)
                }
                onClick={() => send({ operation: 'fund', id, amount })}
              >
                Góp thêm vốn
              </button>
              <button
                className="button secondary"
                disabled={!!reason || !validAmount || amount > e.cash}
                onClick={() => send({ operation: 'withdraw', id, amount })}
              >
                Rút về cá nhân
              </button>
            </div>
          </div>
          <div className="button-row enterprise-lifecycle">
            <button
              className="text-button"
              disabled={
                !!reason ||
                (e.status === 'suspended' &&
                  e.cash < designMoney(run, 6 + (e.policy.marketing ? 4 : 0)))
              }
              onClick={() =>
                send({ operation: e.status === 'suspended' ? 'resume' : 'suspend', id })
              }
            >
              {e.status === 'suspended' ? 'Mở lại tiệm' : 'Tạm dừng nhận đơn'}
            </button>
            <button
              className="text-button"
              disabled={!!reason}
              onClick={() => setClosing(!closing)}
            >
              Tính chuyện khép tiệm
            </button>
          </div>
          {closing && (
            <div className="enterprise-notice">
              <p>
                Khép tiệm sẽ trả lại quỹ và thanh lý hàng ở 50% giá vốn: khoảng{' '}
                <b>{money(refund, run)}</b>. Sổ tiệm được giữ trong cuộc đời; lần thử mới dùng một
                ID khác.
              </p>
              <div className="button-row">
                <button
                  className="button secondary"
                  disabled={!!reason}
                  onClick={() => send({ operation: 'close', id })}
                >
                  Xác nhận khép tiệm
                </button>
                <button className="text-button" onClick={() => setClosing(false)}>
                  Giữ tiệm lúc này
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <details className="enterprise-ledger">
        <summary>Sổ {e.recent.length} tháng gần nhất</summary>
        <p className="fine-print">
          Nhập hàng đổi tiền thành hàng tồn, chưa phải chi phí ngay. Chỉ hàng bán và không bị hoàn
          mới ghi giá vốn. Vì vậy lời/lỗ và dòng tiền có thể khác nhau.
        </p>
        <div
          className="enterprise-table"
          tabIndex={0}
          role="region"
          aria-label={`Sổ tháng ${e.id}`}
        >
          <table>
            <thead>
              <tr>
                <th>Tháng đời</th>
                <th>Nhập</th>
                <th>Đơn</th>
                <th>Hoàn</th>
                <th>Doanh thu thuần</th>
                <th>Giá vốn bán</th>
                <th>Vận hành</th>
                <th>Lời/lỗ</th>
                <th>Dòng tiền</th>
              </tr>
            </thead>
            <tbody>
              {e.recent.map((m) => (
                <tr key={m.month}>
                  <th>{m.month}</th>
                  <td>{m.bought}</td>
                  <td>{m.orders}</td>
                  <td>{m.returned}</td>
                  <td>{money(m.revenue, run)}</td>
                  <td>{money(m.cogs, run)}</td>
                  <td>{money(m.operating, run)}</td>
                  <td>{money(m.profit, run)}</td>
                  <td>{money(m.cashFlow, run)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}
export function EnterprisePanel({ run, act, onBack }: Props & { onBack: () => void }) {
  const [category, setCategory] = useState<ProductCategory>('clothing'),
    [capital, setCapital] = useState(String(designMoney(run, 100))),
    [policy, setPolicy] = useState<RetailPolicy>({
      price: 'balanced',
      marketing: false,
      reorderTarget: 20,
    });
  if (!run.enterprise) return null;
  const reason = businessReason(run),
    amount = Number(capital),
    min = designMoney(run, 20),
    max = designMoney(run, 10000);
  const availableEra =
    run.month >= 216 && run.world.year >= 2005 && run.world.technologies.includes('internet');
  const valid =
    Number.isSafeInteger(amount) &&
    amount >= min &&
    amount <= max &&
    amount <= run.finance.cash &&
    Number.isInteger(policy.reorderTarget) &&
    policy.reorderTarget >= 0 &&
    policy.reorderTarget <= 200;
  return (
    <section
      className="panel-page enterprise-panel"
      onClickCapture={(ev) => {
        if (ev.detail > 1) {
          ev.preventDefault();
          ev.stopPropagation();
        }
      }}
    >
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        Về việc làm và học tập
      </button>
      <span className="eyebrow">MỘT TIỆM NHỎ, MỘT CÁCH THỬ</span>
      <h2>
        Giữ vốn.
        <br />
        <em>Giữ cả nhịp sống.</em>
      </h2>
      <p>
        Tiền bán hàng cần bù giá vốn và chi phí trước khi thành lời. Tiệm có thể chạy bên cạnh việc
        làm hoặc việc học; càng nhiều việc, áp lực càng tăng.
      </p>
      <p className="enterprise-personal" role="status">
        Tiền mặt của bạn: <b>{money(run.finance.cash, run)}</b>
      </p>
      {run.enterprise.ventures.map((e) => (
        <ShopCard key={e.id + JSON.stringify(e.policy)} e={e} run={run} act={act} />
      ))}
      {run.enterprise.ventures.length < 4 && availableEra ? (
        <form
          className="enterprise-launch"
          onSubmit={(ev) => {
            ev.preventDefault();
            act({
              type: 'enterprise',
              operation: 'found',
              category,
              capital: amount,
              policy,
              expected: run.actions.length,
            });
          }}
        >
          <h3>
            <Store aria-hidden="true" size={22} />
            Thử mở một cửa hàng trực tuyến
          </h3>
          {reason && (
            <p role="status" className="enterprise-notice">
              {reason}
            </p>
          )}
          <fieldset disabled={!!reason}>
            <legend>Khởi đầu</legend>
            <label htmlFor="shop-category">Bạn muốn bán gì?</label>
            <select
              id="shop-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
            >
              {Object.entries(CATEGORY_NAMES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <label htmlFor="shop-capital">Vốn góp ban đầu</label>
            <input
              id="shop-capital"
              type="number"
              inputMode="numeric"
              min={min}
              max={Math.min(max, run.finance.cash)}
              step={designMoney(run, 1)}
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
            />
            <p className="fine-print">
              Tối thiểu {money(min, run)}.{' '}
              {Number.isSafeInteger(amount) && amount >= 0
                ? `Đang chọn ${money(amount, run)}.`
                : 'Cần một số tiền nguyên.'}{' '}
              Vốn chuyển sang tiệm, không phải tiền lãi.
            </p>
          </fieldset>
          <PolicyFields value={policy} onChange={setPolicy} prefix="new-shop" disabled={!!reason} />
          <p className="fine-print">
            Hàng chỉ được nhập nếu quỹ đủ tiền. Quảng bá làm tăng chi phí, chưa chắc tăng doanh thu.
            Lợi nhuận giữ ở tiệm cho tới khi bạn rút hoặc thanh lý.
          </p>
          <button className="button primary" disabled={!!reason || !valid}>
            Góp vốn mở tiệm
          </button>
        </form>
      ) : !availableEra && !run.enterprise.ventures.length ? (
        <p className="enterprise-notice">
          Bạn có thể thử cửa hàng trực tuyến từ 18 tuổi, trong bối cảnh có Internet từ năm 2005.
          Những năm đầu vẫn dành cho việc lớn lên và học hỏi.
        </p>
      ) : run.enterprise.ventures.length >= 4 ? (
        <p className="fine-print">
          Cuộc đời này đã giữ đủ bốn sổ tiệm, kể cả những lần đã khép lại.
        </p>
      ) : null}
      <p className="fine-print">
        Các mức giá là tham số sức mua của game, không phải số liệu thị trường. Tiệm tự quyết toán
        cùng từng tháng của cuộc đời; tạm dừng hoặc khép tiệm là những lựa chọn hợp lệ.
      </p>
    </section>
  );
}
