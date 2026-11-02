import { useId, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { GameRun, RunAction } from '../domain/model';
import type {
  ClientProject,
  FreelanceAction,
  ProjectPolicy,
  ProjectTerms,
} from '../domain/freelance';
import { CLIENT_SERVICES, serviceById } from '../content/freelance-services';
import { PROGRAMS } from '../content/programs';
import {
  freelanceReason,
  serviceReason,
  projectMonthlyCost,
  projectProfit,
} from '../engine/freelance';
import { designMoney, formatMoney } from '../domain/currency';
import { detailedBooks, discretionaryCount } from '../domain/rules';
type Props = { run: GameRun; act: (a: RunAction) => void };
const statuses = {
  inquiry: 'Lời hỏi mới',
  offered: 'Đề nghị đã được chọn',
  working: 'Đang thực hiện',
  ready: 'Sẵn sàng giao',
  review: 'Khách đang soát',
  rework: 'Cần một vòng sửa',
  payment: 'Chờ thanh toán',
  closed: 'Hồ sơ đã khép',
};
const endings = {
  paid: 'Đã trả đủ phí',
  partial: 'Đã trả phần phí thỏa thuận',
  rejected: 'Khách không chọn đề nghị',
  declined: 'Bạn đã dừng hồ sơ',
  failed: 'Chưa hoàn tất thỏa thuận',
  expired: 'Đã qua thời hạn',
  unpaid: 'Khoản công chưa thu được',
  death: 'Cuộc đời đã khép',
};
const policies: Record<ProjectPolicy, string> = {
  steady: 'Giữ nhịp đều',
  careful: 'Soát kỹ hơn',
  rush: 'Rút ngắn tiến độ',
  rest: 'Tạm dừng hồi sức',
};
const terms: Record<ProjectTerms, string> = {
  modest: 'Phạm vi gọn · phí thấp hơn',
  standard: 'Phạm vi và phí tiêu chuẩn',
  premium: 'Gói cao hơn · khó được chọn hơn',
};
function ProjectCard({ run, act, p }: { p: ClientProject } & Props) {
  const quoteLabel = useId(),
    policyLabel = useId();
  const [quote, setQuote] = useState<ProjectTerms>('standard'),
    [policy, setPolicy] = useState<ProjectPolicy>(p.policy),
    [closing, setClosing] = useState(false);
  const reason = freelanceReason(run),
    disabled = !!reason;
  const money = (n: number) => formatMoney(n, run);
  const date = (m: number | null) =>
    m === null ? 'Chưa có' : `tháng ${(m % 12) + 1}/${run.player.birthYear + Math.floor(m / 12)}`;
  const send = (operation: FreelanceAction['operation'], extra: Partial<FreelanceAction> = {}) =>
    act({ type: 'freelance', operation, id: p.id, ...extra, expected: run.actions.length });
  return (
    <article className="client-project" data-project={p.id}>
      <div className="client-heading">
        <div>
          <span className="eyebrow">{serviceById(p.service).name}</span>
          <h3>{p.client}</h3>
        </div>
        <span className="badge" data-testid="project-status">
          {statuses[p.status]}
        </span>
      </div>
      <p>{serviceById(p.service).scope}</p>
      <dl className="client-numbers">
        <div>
          <dt>Phí đã đề nghị</dt>
          <dd>{p.terms ? money(p.fee) : 'Chưa thương lượng'}</dd>
        </div>
        <div>
          <dt>Thực nhận</dt>
          <dd data-testid="project-received">{money(p.totals.received)}</dd>
        </div>
        <div>
          <dt>Đã chi thực hiện và chuẩn bị</dt>
          <dd>{money(p.totals.cost)}</dd>
        </div>
        <div>
          <dt>Lời/lỗ tiền đã nhận</dt>
          <dd data-testid="project-profit">{money(projectProfit(p))}</dd>
        </div>
      </dl>
      {p.status === 'closed' ? (
        <p className="academic-result">
          {endings[p.ending!]} · {date(p.closedMonth)}. Sổ và kết quả vẫn được giữ.
        </p>
      ) : (
        <>
          <p className="fine-print">
            {reason ??
              'Tiền công chỉ cộng vào ví khi khách thật sự trả trong mô phỏng. Không dùng quỹ hộ cũ hoặc tự vay cho dự án.'}
          </p>
          {p.status === 'inquiry' && (
            <div className="client-controls">
              <label>
                <span id={quoteLabel}>Phạm vi và mức phí đề nghị</span>
                <select
                  aria-labelledby={quoteLabel}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value as ProjectTerms)}
                >
                  {Object.entries(terms).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button secondary"
                disabled={disabled}
                onClick={() => send('negotiate', { terms: quote })}
              >
                Gửi đề nghị
              </button>
            </div>
          )}
          {p.status === 'offered' && (
            <>
              <p>
                Nhịp đều dự kiến {money(projectMonthlyCost(run, p))}/tháng thực hiện. Cần tự chuẩn
                bị cả sinh hoạt trong lúc chờ nghiệm thu.
              </p>
              <button
                className="button secondary"
                disabled={disabled || run.finance.cash < projectMonthlyCost(run, p)}
                onClick={() => send('accept')}
              >
                Nhận hợp đồng
              </button>
            </>
          )}
          {p.status === 'working' && (
            <>
              <p>
                Đạt {p.progress}/{p.requiredMonths} mốc công việc · {p.workMonths} tháng có thực
                hiện · Chất lượng hiện tại {p.quality}/100. Hạn thực hiện: {date(p.deadlineMonth)}.
              </p>
              <div className="client-controls">
                <label>
                  <span id={policyLabel}>Nhịp làm dự án</span>
                  <select
                    aria-labelledby={policyLabel}
                    value={policy}
                    onChange={(e) => setPolicy(e.target.value as ProjectPolicy)}
                  >
                    {Object.entries(policies).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button secondary"
                  disabled={disabled}
                  onClick={() => send('policy', { policy })}
                >
                  Giữ nhịp này
                </button>
              </div>
              <p className="fine-print">
                Nhịp đang xem: {money(projectMonthlyCost(run, { ...p, policy }))}/tháng. Làm nhanh
                tiến gấp đôi nhưng giảm chất lượng; nghỉ không tiến độ và thời hạn vẫn chạy. Thiếu
                quỹ liên tiếp có thể mất hợp đồng.
              </p>
            </>
          )}
          {p.status === 'ready' && (
            <>
              <p>
                Phần việc đã đủ mốc. Giao trước {date(p.deadlineMonth)}; kết quả xét có thể yêu cầu
                sửa hoặc không được trả phí.
              </p>
              <button
                className="button secondary"
                disabled={disabled}
                onClick={() => send('deliver')}
              >
                Giao bản cho khách soát
              </button>
            </>
          )}
          {p.status === 'rework' && (
            <div className="client-controls">
              <button
                className="button secondary"
                disabled={disabled || p.reworkUsed}
                onClick={() => send('revise')}
              >
                Nhận một lượt sửa
              </button>
              <button
                className="button secondary"
                disabled={disabled}
                onClick={() => send('settle')}
              >
                Thỏa thuận phần phí 60%
              </button>
              <p className="fine-print">
                Lượt sửa thêm 6 tháng thiết kế với nhịp soát kỹ. Chọn phần phí vẫn phải chờ khách
                trả, chưa tạo tiền ngay.
              </p>
            </div>
          )}
          {p.status === 'review' && (
            <p>
              Khách hẹn xét vào {date(p.reviewDue)}. Viết tiếp cuộc đời để thời gian đi; không cần
              thao tác từng tháng.
            </p>
          )}
          {p.status === 'payment' && (
            <p>
              Khoản chờ trả: {money(p.amountDue)} · kỳ hẹn {date(p.paymentDue)}. Có thể trả chậm
              hoặc không thu được; khoản này chưa tính là tiền của bạn.
            </p>
          )}
          {!closing ? (
            <button className="text-button" disabled={disabled} onClick={() => setClosing(true)}>
              Tính chuyện khép hồ sơ
            </button>
          ) : (
            <div className="client-close">
              <p>
                Khép hồ sơ sẽ giữ chi phí đã chi và không nhận khoản phí chưa thu. Hồ sơ này vẫn
                tính trong các cơ hội chi tiết đã theo.
              </p>
              <div className="button-row">
                <button
                  className="button secondary"
                  disabled={disabled}
                  onClick={() => send('close')}
                >
                  Xác nhận khép hồ sơ
                </button>
                <button className="text-button" onClick={() => setClosing(false)}>
                  Tiếp tục giữ hồ sơ
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <details>
        <summary>Các mốc của hồ sơ</summary>
        <ol>
          {p.milestones.map((m, i) => (
            <li key={i}>
              <strong>{date(m.month)}</strong> · {m.text}
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}
export function FreelancePanel({ run, act, onBack }: Props & { onBack: () => void }) {
  const touch = useRef(false),
    lastTouch = useRef(-Infinity);
  if (!run.freelance) return null;
  return (
    <section
      className="panel-page freelance-panel"
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
        if (e.detail !== 0 && touch.current) lastTouch.current = e.timeStamp;
      }}
      onKeyDownCapture={(e) => {
        if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
      }}
    >
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        Về việc làm và học tập
      </button>
      <span className="eyebrow">MỖI LỜI HỨA CẦN MỘT PHẦN VIỆC THẬT</span>
      <h2>
        Có khách hỏi.
        <br />
        <em>Chưa chắc có tiền về.</em>
      </h2>
      <p>
        Chọn việc vừa kỹ năng, thống nhất phạm vi rồi theo tới khi giao và được trả. Bằng học phù
        hợp, chất lượng, uy tín và kinh nghiệm đều có ảnh hưởng. Khách có thể từ chối, yêu cầu sửa
        hoặc trả chậm.
      </p>
      <p role="status" className="enterprise-personal">
        Tiền mặt: {formatMoney(run.finance.cash, run)} · Uy tín dự án: {run.freelance.reputation}
        /100
      </p>
      <p className="fine-print">
        Đã theo {detailedBooks(run)}/4 hồ sơ tiệm, kênh và dự án chi tiết trong đời, gồm hồ sơ đã
        khép. Còn {Math.max(0, 120 - discretionaryCount(run))} lượt quản lý chung. Lịch tháng tự ghi
        công, chi phí và kỳ trả; cảnh câu chuyện vẫn có thể giúp bạn hoàn tất việc khi hết lượt quản
        lý.
      </p>
      {run.freelance.projects.map((p) => (
        <ProjectCard key={p.id} p={p} run={run} act={act} />
      ))}
      <h3>Một lời hỏi phù hợp</h3>
      <p className="fine-print">
        Mỗi lời hỏi có {formatMoney(designMoney(run, 2), run)} phí chuẩn bị từ tiền cá nhân. Đây là
        đợt dự án theo thời gian thiết kế, không phải mức giá hoặc lời mời từ khách thật.
      </p>
      <div className="client-service-grid">
        {CLIENT_SERVICES.map((s) => {
          const reason = serviceReason(run, s.id);
          return (
            <article className="client-service" key={s.id} data-service={s.id}>
              <h4>{s.name}</h4>
              <p>{s.scope}</p>
              <p className="fine-print">
                Cần {s.knowledge} tri thức / {s.skill} tay nghề. Bằng phù hợp:{' '}
                {s.programs.map((id) => PROGRAMS.find((p) => p.id === id)!.name).join(', ')}.
              </p>
              <button
                className="button secondary"
                disabled={!!reason}
                onClick={() =>
                  act({
                    type: 'freelance',
                    operation: 'inquire',
                    service: s.id,
                    expected: run.actions.length,
                  })
                }
              >
                Hỏi về dự án
              </button>
              {reason && <p className="fine-print">{reason}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
