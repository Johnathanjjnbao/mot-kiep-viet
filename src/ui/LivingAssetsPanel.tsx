import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, House, Bike, Smartphone, Cpu } from 'lucide-react';
import type { GameRun, RunAction } from '../domain/model';
import {
  PART_SLOTS,
  type LivingAssetAction,
  type Locality,
  type OwnedLivingAsset,
  type PartSlot,
  type PcParts,
} from '../domain/living-assets';
import { discretionaryCount } from '../domain/rules';
import { assetBenefits, canOperateVehicle } from '../domain/asset-benefits';
import {
  LIVING_ASSET_CATALOG,
  LOCALITIES,
  livingDefinition,
  livingPrice,
  type LivingAssetDefinition,
} from '../content/living-assets';
import { PC_PARTS, PART_LABELS, pcAssessment, pcPreset, pcPart } from '../content/pc-parts';
import {
  assetName,
  assetMonthlyCost,
  depositRefund,
  financialValue,
  financingQuote,
  livingAssetReason,
  livingMonthlyCost,
  loanInstallment,
  repairPrice,
  resaleValue,
  activeAssetLoan,
  upgradePrice,
} from '../engine/living-assets';
import { formatMoney } from '../domain/currency';
import { Modal } from './common';

type Command = Omit<LivingAssetAction, 'type' | 'expected'>;
type Pending = { command: LivingAssetAction; title: string; text: string };
type Ask = (command: Command, title: string, text: string) => void;
type Props = { run: GameRun; act: (a: RunAction) => void; onBack: () => void; onStory: () => void };
const cash = (r: GameRun, n: number) => formatMoney(n, r);
function Action({
  run,
  command,
  title,
  text,
  ask,
  children,
}: {
  run: GameRun;
  command: Command;
  title: string;
  text: string;
  ask: Ask;
  children: ReactNode;
}) {
  const reason = livingAssetReason(run, {
    type: 'living-assets',
    expected: run.actions.length,
    ...command,
  });
  return (
    <div className="living-action">
      <button
        type="button"
        className="button secondary"
        disabled={!!reason}
        onClick={() => ask(command, title, text)}
      >
        {children}
      </button>
      {reason && <small>{reason}</small>}
    </div>
  );
}
function ShopItem({
  run,
  definition: d,
  locality,
  ask,
}: {
  run: GameRun;
  definition: LivingAssetDefinition;
  locality: Locality;
  ask: Ask;
}) {
  const [payment, setPayment] = useState<'cash' | 'loan'>('cash');
  const price = livingPrice(run, d, locality),
    rent = d.mode === 'rent',
    home = d.category === 'home';
  const quote = financingQuote(run, price, home),
    financed = !rent && payment === 'loan';
  const fees = home ? 300_000 + (rent ? 0 : Math.round(price / 100)) : 0;
  const upfront = rent ? price * 2 + fees : (financed ? quote.down : price) + fees;
  const monthly = rent ? price + d.monthly : d.monthly + (financed ? quote.monthly : 0);
  const command: Command = {
    operation: rent ? 'rent' : 'buy',
    item: d.id,
    ...(home ? { locality } : {}),
    ...(!rent ? { payment } : {}),
  };
  return (
    <article className="living-shop-item" data-testid={'catalog-' + d.id}>
      <div>
        <h4>{d.name}</h4>
        <p>{d.description}</p>
        {home && (
          <p className="fine-print">
            Chỗ cho khoảng {d.capacity} người · {LOCALITIES[locality].name.toLowerCase()} · Giá theo
            vùng hiện tại.
          </p>
        )}
      </div>
      <dl className="living-numbers">
        <div>
          <dt>{rent ? 'Thuê mỗi tháng' : 'Giá mua'}</dt>
          <dd>{cash(run, price)}</dd>
        </div>
        <div>
          <dt>Cần trả ngay</dt>
          <dd>{cash(run, upfront)}</dd>
        </div>
        <div>
          <dt>{financed ? 'Duy trì và kỳ trả đầu' : 'Chi phí tháng dự kiến'}</dt>
          <dd>{cash(run, monthly)}</dd>
        </div>
      </dl>
      {!rent && d.category !== 'phone' && (
        <label>
          Cách thanh toán cho {d.name.toLowerCase()}
          <select value={payment} onChange={(e) => setPayment(e.target.value as 'cash' | 'loan')}>
            <option value="cash">Tiền mặt</option>
            <option value="loan">Trả trước và vay riêng</option>
          </select>
        </label>
      )}
      {rent ? (
        <p className="fine-print">
          Cọc {cash(run, price * 2)} vẫn là khoản phải thu; chuyển chỗ 300.000 ₫. Thuê tự gia hạn
          giữ giá, không cần bấm mỗi tháng.
        </p>
      ) : home ? (
        <p className="fine-print">
          Gồm {cash(run, Math.round(price / 100))} phí thu xếp và 300.000 ₫ chuyển chỗ. Mua nhà đồng
          thời chuyển vào ở.
        </p>
      ) : (
        <p className="fine-print">
          Chi phí duy trì là mô hình gộp; không phải biểu phí pháp luật hay thông số một sản phẩm
          thật.
        </p>
      )}
      {financed && (
        <p className="living-notice">
          Trả trước {cash(run, quote.down)}, vay {cash(run, quote.principal)} trong {quote.months}{' '}
          tháng; lãi {quote.rateBps / 100}%/tháng trên gốc còn lại. Kỳ trả giảm dần khi gốc giảm.{' '}
          {quote.reason}
        </p>
      )}
      <Action
        run={run}
        ask={ask}
        command={command}
        title={rent ? 'Xác nhận chỗ thuê mới' : 'Xác nhận mua ' + d.name.toLowerCase()}
        text={`Trả ngay ${cash(run, upfront)}; dự kiến ${cash(run, monthly)}/tháng${financed ? ', gồm kỳ vay đầu' : ''}.${home && run.livingAssets?.lease ? ` Hợp đồng hiện tại khép lại, hoàn phần cọc còn ${cash(run, depositRefund(run))}.` : ''}${rent ? ' Bạn không sở hữu căn nhà thuê.' : ' Tài sản có thể hao mòn và bán lại thấp hơn giá mua.'}`}
      >
        {rent ? 'Thuê và chuyển tới' : home ? 'Mua và chuyển vào' : 'Mua ' + d.name.toLowerCase()}
      </Action>
    </article>
  );
}
function OwnedItem({ run, a, ask }: { run: GameRun; a: OwnedLivingAsset; ask: Ask }) {
  const loan = activeAssetLoan(run, a.id),
    sale = resaleValue(run, a),
    benefits = assetBenefits(run);
  return (
    <article className="living-owned" data-testid={'owned-' + a.catalogId}>
      <div className="living-owned-heading">
        <h4>{assetName(a)}</h4>
        <span>{run.livingAssets!.residence === a.id ? 'Đang ở' : 'Bạn sở hữu'}</span>
      </div>
      <dl className="living-numbers">
        <div>
          <dt>Tình trạng</dt>
          <dd>{a.condition}/100</dd>
        </div>
        <div>
          <dt>Giá trị trong sổ</dt>
          <dd>{cash(run, financialValue(run, a.id))}</dd>
        </div>
        <div>
          <dt>Duy trì mỗi tháng</dt>
          <dd>{cash(run, assetMonthlyCost(run, a))}</dd>
        </div>
        <div>
          <dt>Đã mua</dt>
          <dd>{run.player.birthYear + Math.floor(a.acquiredMonth / 12)}</dd>
        </div>
      </dl>
      <p className="fine-print">
        Giá mua ban đầu {cash(run, a.acquisitionPrice)}. Giá bán dự kiến {cash(run, sale)}
        {loan ? `; phải tất toán ${cash(run, loan.principal)}` : ''}.{' '}
        {a.category === 'home'
          ? 'Nhà chưa ở vẫn có chi phí bảo trì.'
          : a.category === 'vehicle'
            ? canOperateVehicle(run, a)
              ? 'Đủ điều kiện vận hành theo tham số game.'
              : 'Sở hữu không tự cho phép vận hành; cần phần tập sử dụng và sức khỏe phù hợp.'
            : `Tổng hỗ trợ của các đồ dùng đang giữ: việc số ${benefits.digital.toFixed(1)}/6, tính toán ${benefits.computing.toFixed(1)}/6, sáng tạo ${benefits.creator.toFixed(1)}/5. Không tự tạo thu nhập.`}
      </p>
      <div className="living-action-row">
        {a.category === 'home' && (
          <Action
            run={run}
            ask={ask}
            command={{ operation: 'move', assetId: a.id }}
            title="Chuyển vào nhà đã có"
            text="Chi 300.000 ₫ chuyển chỗ. Hợp đồng thuê hiện tại, nếu có, sẽ khép lại và hoàn phần cọc còn lại."
          >
            Chuyển vào ở
          </Action>
        )}
        <Action
          run={run}
          ask={ask}
          command={{ operation: 'repair', assetId: a.id }}
          title="Sửa để dùng thêm"
          text={`Chi ${cash(run, repairPrice(a))} sửa tài sản. Tuổi món đồ vẫn tính từ lúc mua.`}
        >
          Sửa · {cash(run, repairPrice(a))}
        </Action>
        <Action
          run={run}
          ask={ask}
          command={{
            operation: 'upkeep',
            assetId: a.id,
            policy: a.upkeep === 'careful' ? 'essential' : 'careful',
          }}
          title="Đổi cách bảo dưỡng"
          text={
            a.upkeep === 'careful'
              ? 'Giảm về bảo dưỡng thiết yếu; đồ sẽ xuống cấp nhanh hơn.'
              : 'Tăng chi phí bảo dưỡng định kỳ, đổi lại đồ xuống cấp chậm hơn. Không trả phí mua thêm tài sản.'
          }
        >
          {a.upkeep === 'careful' ? 'Bảo dưỡng thiết yếu' : 'Bảo dưỡng kỹ hơn'}
        </Action>
        <Action
          run={run}
          ask={ask}
          command={{ operation: 'sell', assetId: a.id }}
          title="Xác nhận bán tài sản"
          text={`Bán với ${cash(run, sale)}.${loan ? ` Dùng tiền bán và tiền mặt để tất toán ${cash(run, loan.principal)}; tiền mặt thay đổi ${cash(run, sale - loan.principal)}.` : ' Không có khoản vay mua tài sản này.'}${run.livingAssets!.residence === a.id ? ' Bạn chuyển về ở cùng gia đình hoặc ở nhờ.' : ''} Không thể tải lại tiền bán lần thứ hai.`}
        >
          Bán · {cash(run, sale)}
        </Action>
      </div>
      {a.category === 'pc' && <PcUpgrade run={run} a={a} ask={ask} />}
    </article>
  );
}
function Loans({ run, ask }: { run: GameRun; ask: Ask }) {
  const loans = run.livingAssets!.loans.filter((l) => l.principal > 0);
  if (!loans.length) return null;
  return (
    <section className="living-loans" aria-label="Khoản vay mua tài sản">
      <h3>Các khoản còn phải thu xếp</h3>
      {loans.map((l) => (
        <article key={l.id}>
          <h4>
            {l.status === 'shortfall' ? 'Phần nợ còn sau bán xử lý' : 'Khoản vay mua tài sản'}
          </h4>
          <p>
            Còn {cash(run, l.principal)} · kỳ tiếp theo dự kiến {cash(run, loanInstallment(l))}.{' '}
            {l.lateMonths ? `Đang có ${l.lateMonths} kỳ chưa trả đủ.` : 'Các kỳ gần đây trả đủ.'}
          </p>
          <Action
            run={run}
            ask={ask}
            command={{
              operation: 'repay',
              loanId: l.id,
              amount: Math.min(l.principal, Math.max(1, run.finance.cash)),
            }}
            title="Trả thêm tiền gốc"
            text={`Dùng ${cash(run, Math.min(l.principal, run.finance.cash))} tiền mặt trả gốc. Lãi tháng đã ghi không bị thu lại.`}
          >
            {run.finance.cash >= l.principal ? 'Tất toán' : 'Dùng tiền mặt trả bớt'}
          </Action>
        </article>
      ))}
    </section>
  );
}
function PcUpgrade({ run, a, ask }: { run: GameRun; a: OwnedLivingAsset; ask: Ask }) {
  const [slot, setSlot] = useState<PartSlot>('gpu'),
    [item, setItem] = useState('');
  const selected = pcPart(item),
    command: Command = { operation: 'upgrade', assetId: a.id, slot, item: item || a.parts![slot] };
  return (
    <details className="living-upgrade">
      <summary>Thay linh kiện trong máy</summary>
      <label>
        Vị trí cần thay
        <select
          value={slot}
          onChange={(e) => {
            setSlot(e.target.value as PartSlot);
            setItem('');
          }}
        >
          {PART_SLOTS.map((s) => (
            <option key={s} value={s}>
              {PART_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <p>Đang có: {pcPart(a.parts![slot])!.name}.</p>
      <label>
        Linh kiện thay thế
        <select value={item} onChange={(e) => setItem(e.target.value)}>
          <option value="">Chọn linh kiện</option>
          {PC_PARTS.filter((p) => p.slot === slot && p.from <= run.world.year).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {cash(run, p.price)}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <>
          <p>
            Chênh lệch sau thu hồi phần cũ: {cash(run, upgradePrice(run, a, slot, selected.id))}.
          </p>
          <Action
            run={run}
            ask={ask}
            command={command}
            title="Xác nhận thay linh kiện"
            text={`Thay ${PART_LABELS[slot]}, chênh lệch ${cash(run, upgradePrice(run, a, slot, selected.id))}. Toàn bộ cấu hình phải tiếp tục tương thích.`}
          >
            Thay linh kiện đã chọn
          </Action>
        </>
      )}
    </details>
  );
}
function PcBuilder({ run, ask }: { run: GameRun; ask: Ask }) {
  const [budget, setBudget] = useState(20_000_000),
    [parts, setParts] = useState<PcParts>(() => pcPreset(run.world.year)),
    [payment, setPayment] = useState<'cash' | 'loan'>('cash');
  const pc = pcAssessment(parts, run.world.year),
    quote = financingQuote(run, pc.price, false);
  const upkeep =
    Math.round(((pc.watts * (run.flags['living-low-power'] ? 3 : 4) * 30) / 1000) * 3_000) + 90_000;
  const upfront = payment === 'loan' ? quote.down : pc.price;
  const overBudget = pc.price > budget,
    current = run.livingAssets!.owned.find((a) => a.category === 'pc');
  return (
    <section className="living-pc" aria-label="Lắp ráp máy tính">
      <h3>Lắp một chiếc máy để dùng</h3>
      <p>
        Chọn đủ chín phần, xem lý do không tương thích và tổng tiền trước khi mua. Đây là linh kiện
        mô phỏng; socket và thế hệ là quy ước của game.
      </p>
      <label>
        Ngân sách máy tính (₫)
        <input
          type="number"
          min="1000000"
          max="100000000"
          step="500000"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />
      </label>
      <div className="living-action-row">
        <button
          type="button"
          className="button secondary"
          onClick={() => setParts(pcPreset(Math.min(run.world.year, 1999)))}
        >
          Cấu hình tiết kiệm
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => setParts(pcPreset(run.world.year))}
        >
          Gợi ý theo thời kỳ
        </button>
      </div>
      <div className="living-part-grid">
        {PART_SLOTS.map((slot) => (
          <label key={slot}>
            {PART_LABELS[slot]}
            <select
              aria-label={'Linh kiện ' + PART_LABELS[slot]}
              value={parts[slot]}
              onChange={(e) => setParts({ ...parts, [slot]: e.target.value })}
            >
              {PC_PARTS.filter((p) => p.slot === slot && p.from <= run.world.year).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {cash(run, p.price)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div role={pc.errors.length || overBudget ? 'alert' : 'status'} className="living-notice">
        {pc.errors.length ? (
          <ul>
            {pc.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : (
          <p>Cấu hình tương thích theo các điều kiện đang mô phỏng.</p>
        )}
        {overBudget && <p>Tổng giá vượt ngân sách bạn vừa chọn.</p>}
        {pc.future && <p>Cấu hình có phần cứng tương lai hư cấu.</p>}
      </div>
      <dl className="living-numbers">
        <div>
          <dt>Tổng linh kiện</dt>
          <dd>{cash(run, pc.price)}</dd>
        </div>
        <div>
          <dt>Điện và bảo dưỡng mỗi tháng</dt>
          <dd>{cash(run, upkeep)}</dd>
        </div>
        <div>
          <dt>Tiền mặt còn sau trả trước</dt>
          <dd>{cash(run, run.finance.cash - upfront)}</dd>
        </div>
        <div>
          <dt>Tính toán / chơi game</dt>
          <dd>
            {pc.compute}/100 · {pc.gaming}/100
          </dd>
        </div>
        <div>
          <dt>Sáng tạo / độ tin cậy</dt>
          <dd>
            {pc.creator}/100 · {pc.reliability}/100
          </dd>
        </div>
        <div>
          <dt>Điện / tải nguồn dự phòng</dt>
          <dd>
            {pc.watts} W · {pc.required} W
          </dd>
        </div>
        <div>
          <dt>Nhiệt và tiếng ồn tương đối</dt>
          <dd>{pc.noise}/100</dd>
        </div>
      </dl>
      <label>
        Thanh toán máy tính
        <select value={payment} onChange={(e) => setPayment(e.target.value as 'cash' | 'loan')}>
          <option value="cash">Tiền mặt</option>
          <option value="loan">Trả trước 50% và vay 24 tháng</option>
        </select>
      </label>
      {payment === 'loan' && (
        <p>
          Trả trước {cash(run, quote.down)}, kỳ trả đầu {cash(run, quote.monthly)}; lãi{' '}
          {quote.rateBps / 100}%/tháng trên gốc còn lại. {quote.reason}
        </p>
      )}
      {current ? (
        <p>
          Máy tự ráp hiện có đã nằm trong mục sở hữu. Nâng cấp ở đó hoặc bán trước khi ráp máy khác.
        </p>
      ) : overBudget ? (
        <button className="button secondary" disabled>
          Giảm tổng giá hoặc đổi ngân sách
        </button>
      ) : (
        <Action
          run={run}
          ask={ask}
          command={{ operation: 'build', parts, payment }}
          title="Xác nhận ráp máy"
          text={`Tổng ${cash(run, pc.price)}; trả ngay ${cash(run, upfront)}, còn ${cash(run, run.finance.cash - upfront)} tiền mặt. Điện và bảo dưỡng ${cash(run, upkeep)}/tháng.${payment === 'loan' ? ` Khoản vay ${cash(run, quote.principal)} được đối soát riêng, kỳ trả đầu ${cash(run, quote.monthly)}.` : ''} Máy hao mòn và hỗ trợ có giới hạn cho việc học/làm phù hợp.`}
        >
          Ráp máy với cấu hình này
        </Action>
      )}
      <p className="fine-print">
        Chỉ số là mô hình game, không phải benchmark hoặc cam kết nghề nghiệp. Nâng cấp còn phụ
        thuộc socket, RAM, kích thước, điện, tản nhiệt và giao tiếp lưu trữ.
      </p>
    </section>
  );
}
export function LivingAssetsPanel({ run, act, onBack, onStory }: Props) {
  const heading = useRef<HTMLHeadingElement>(null),
    focusAfterConfirm = useRef(false);
  const [section, setSection] = useState<'home' | 'vehicle' | 'device' | 'pc'>('home'),
    [locality, setLocality] = useState<Locality>('connected'),
    [pending, setPending] = useState<Pending | null>(null);
  const confirmed = useRef(false),
    touch = useRef(false),
    lastTouch = useRef(-Infinity);
  useEffect(() => {
    if (pending || !focusAfterConfirm.current) return;
    focusAfterConfirm.current = false;
    const frame = requestAnimationFrame(() => heading.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [pending]);
  const state = run.livingAssets;
  if (!state) return null;
  const ask: Ask = (command, title, text) => {
    confirmed.current = false;
    setPending({
      command: { type: 'living-assets', expected: run.actions.length, ...command },
      title,
      text,
    });
  };
  const categories =
    section === 'home'
      ? ['home']
      : section === 'vehicle'
        ? ['vehicle']
        : section === 'device'
          ? ['phone', 'laptop']
          : ['pc'];
  const owned = state.owned.filter((a) => categories.includes(a.category)),
    lease = state.lease;
  const catalog = LIVING_ASSET_CATALOG.filter(
    (d) =>
      categories.includes(d.category) &&
      d.from <= run.world.year &&
      (d.environment === 'any' || d.environment === run.setup.environment),
  );
  const residence = state.owned.find((a) => a.id === state.residence),
    loanTotal = state.loans.reduce((n, l) => n + l.principal, 0),
    reason = livingAssetReason(run);
  return (
    <section
      className="panel-page living-panel"
      onPointerDownCapture={(e) => {
        touch.current = e.pointerType === 'touch';
      }}
      onClickCapture={(e) => {
        if (
          e.detail > 1 ||
          (e.detail !== 0 && touch.current && e.timeStamp - lastTouch.current < 300)
        ) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (e.detail && touch.current) lastTouch.current = e.timeStamp;
      }}
      onKeyDownCapture={(e) => {
        if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
      }}
    >
      <div className="living-top">
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          Về tài chính
        </button>
        <button className="text-button" onClick={onStory}>
          {run.activeEvent ? 'Về câu chuyện đang chờ' : 'Tiếp tục câu chuyện'}
        </button>
      </div>
      <h2 ref={heading} tabIndex={-1}>
        Đời sống và tài sản
      </h2>
      <p>
        Chọn những gì vừa với cuộc sống của bạn. Giá mua mới là khởi đầu; tiền thuê, tiền vay và chi
        phí giữ đồ vẫn đi cùng từng tháng.
      </p>
      <div className="living-balance">
        <span>
          Tiền mặt <strong>{cash(run, run.finance.cash)}</strong>
        </span>
        <span>
          Duy trì tài sản <strong>{cash(run, livingMonthlyCost(run))}/tháng</strong>
        </span>
        <span>
          Vay tài sản còn <strong>{cash(run, loanTotal)}</strong>
        </span>
      </div>
      <p className="fine-print">
        Còn {Math.max(0, 120 - discretionaryCount(run))} lượt chủ động chung. Mỗi tháng tự xử lý chi
        phí; không cần bấm để trả từng hóa đơn. VND theo sức mua thiết kế2026, không phải giá danh
        nghĩa lịch sử.
      </p>
      {reason && (
        <p className="living-notice" role="status">
          {reason}
        </p>
      )}
      <nav className="living-tabs" aria-label="Các nhóm tài sản">
        {(
          [
            { id: 'home', label: 'Nhà ở', Icon: House },
            { id: 'vehicle', label: 'Phương tiện', Icon: Bike },
            { id: 'device', label: 'Thiết bị', Icon: Smartphone },
            { id: 'pc', label: 'PC Builder', Icon: Cpu },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            className={section === t.id ? 'living-selected' : ''}
            aria-current={section === t.id ? 'page' : undefined}
            onClick={() => setSection(t.id)}
          >
            <t.Icon size={18} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </nav>
      {section === 'home' && (
        <>
          <article className="living-residence">
            <h3>
              {lease
                ? livingDefinition(lease.catalogId)!.name
                : residence
                  ? assetName(residence)
                  : 'Ở cùng gia đình hoặc ở nhờ'}
            </h3>
            <p>
              {lease
                ? `Đang thuê · ${cash(run, lease.rent)}/tháng · cọc còn có thể hoàn ${cash(run, depositRefund(run))}.`
                : residence
                  ? `Bạn sở hữu và đang ở đây; tình trạng ${residence.condition}/100.`
                  : 'Chỗ ở này không phải tài sản đứng tên bạn. Không tự nhận nhà của hộ gia đình làm nhà riêng.'}
            </p>
            {lease && (
              <p className="fine-print">
                Cọc ban đầu {cash(run, lease.deposit)}, mức hư hại đã ghi {lease.damage}/100. Gia
                hạn tự động giữ giá; không thu thêm cọc mỗi năm.
              </p>
            )}
            <div className="living-action-row">
              {lease && lease.damage > 0 && (
                <Action
                  run={run}
                  ask={ask}
                  command={{ operation: 'repair-rental' }}
                  title="Sửa phần hư hại chỗ thuê"
                  text={`Chi ${cash(run, Math.max(50_000, Math.floor((lease.deposit * lease.damage) / 200)))} để sửa phần đã ghi và khôi phục phần cọc có thể hoàn.`}
                >
                  Sửa phần hư hại để bàn giao
                </Action>
              )}
              {lease && (
                <Action
                  run={run}
                  ask={ask}
                  command={{ operation: 'renew' }}
                  title="Gia hạn chỗ thuê"
                  text="Giữ giá thuê hiện tại; không thu lại cọc hoặc kỳ thuê đã trả."
                >
                  Gia hạn chủ động
                </Action>
              )}
              {state.residence && (
                <Action
                  run={run}
                  ask={ask}
                  command={{ operation: 'leave' }}
                  title="Rời chỗ ở hiện tại"
                  text={`Chi 300.000 ₫ chuyển chỗ.${lease ? ` Hoàn phần cọc còn ${cash(run, depositRefund(run))}.` : ' Nhà vẫn thuộc sở hữu và tiếp tục có phí bảo trì.'}`}
                >
                  Chuyển về ở nhờ
                </Action>
              )}
            </div>
          </article>
          <label>
            Khu vực tìm chỗ ở
            <select value={locality} onChange={(e) => setLocality(e.target.value as Locality)}>
              {Object.entries(LOCALITIES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </label>
          <p className="fine-print">
            {LOCALITIES[locality].note} Đây là tầng địa phương mô phỏng trong vùng hiện tại.
          </p>
        </>
      )}
      {!!owned.length && (
        <section aria-label="Tài sản bạn đang giữ">
          <h3>Những gì đang thuộc về bạn</h3>
          {owned.map((a) => (
            <OwnedItem key={a.id} run={run} a={a} ask={ask} />
          ))}
        </section>
      )}
      {section === 'vehicle' && (
        <section className="living-training">
          <h3>Sở hữu và tự vận hành</h3>
          <p>
            Mua xe không tự cấp điều kiện vận hành. Game mô phỏng tuổi trưởng thành, sức khỏe và
            phần tập sử dụng; không thay giấy phép hoặc quy định thực tế.
          </p>
          <div className="living-action-row">
            {(['motorcycle', 'car'] as const).map((item) => (
              <Action
                key={item}
                run={run}
                ask={ask}
                command={{ operation: 'train', item }}
                title="Thu xếp phần tập sử dụng"
                text={`Chi ${cash(run, item === 'car' ? 8_000_000 : 1_500_000)} cho phần tập sử dụng trong mô phỏng. Điều này không phải giấy phép thật.`}
              >
                {item === 'car' ? 'Tập sử dụng ô tô' : 'Tập sử dụng xe máy'}
              </Action>
            ))}
          </div>
        </section>
      )}
      {section === 'pc' ? (
        <PcBuilder run={run} ask={ask} />
      ) : (
        <section aria-label="So sánh lựa chọn tài sản">
          <h3>
            {section === 'home'
              ? 'Một chỗ ở phù hợp'
              : section === 'vehicle'
                ? 'Chọn cách đi lại'
                : 'Công cụ cho những việc hằng ngày'}
          </h3>
          <div className="living-shop">
            {catalog.map((d) => (
              <ShopItem key={d.id} run={run} definition={d} locality={locality} ask={ask} />
            ))}
          </div>
        </section>
      )}
      <Loans run={run} ask={ask} />
      {pending && (
        <Modal title={pending.title} onClose={() => setPending(null)}>
          <p>{pending.text}</p>
          {run.actions.length !== pending.command.expected && (
            <p role="alert">Cuộc đời đã thay đổi; đóng và xem lại lựa chọn trước khi xác nhận.</p>
          )}
          <div className="button-row">
            <button className="button secondary" onClick={() => setPending(null)}>
              Giữ nguyên, quay lại
            </button>
            <button
              className="button primary"
              disabled={run.actions.length !== pending.command.expected}
              onClick={() => {
                if (confirmed.current) return;
                confirmed.current = true;
                focusAfterConfirm.current = true;
                act(pending.command);
                setPending(null);
              }}
            >
              Xác nhận quyết định
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
