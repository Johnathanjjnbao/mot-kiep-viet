import { useId, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { GameRun, RunAction } from '../domain/model';
import type { ArtDiscipline, ArtPolicy, AgencyTerms, ArtisticAction } from '../domain/artistic';
import {
  ART_NAMES,
  ART_POLICY_NAMES,
  AGENCY_CONDITIONS,
  artisticReason,
  artisticStartReason,
  artisticReadiness,
  auditionReason,
  comebackReason,
  artisticMonthlyCost,
  artisticNet,
} from '../engine/artistic';
import { designMoney, formatMoney } from '../domain/currency';
import { detailedBooks, discretionaryCount } from '../domain/rules';
type Props = { run: GameRun; act: (a: RunAction) => void; onBack: () => void };
export function ArtisticPanel({ run, act, onBack }: Props) {
  const [policy, setPolicy] = useState<ArtPolicy>(run.creative?.artist?.policy ?? 'technique'),
    [terms, setTerms] = useState<AgencyTerms>('balanced'),
    [closing, setClosing] = useState(false);
  const policyId = useId(),
    termsId = useId(),
    touch = useRef(false),
    lastTouch = useRef(-Infinity);
  if (!run.creative) return null;
  const p = run.creative.artist,
    reason = artisticReason(run),
    start = artisticStartReason(run),
    ready = artisticReadiness(run),
    audition = auditionReason(run),
    comeback = comebackReason(run),
    money = (n: number) => formatMoney(n, run);
  const send = (operation: ArtisticAction['operation'], extra: Partial<ArtisticAction> = {}) =>
    act({ type: 'artistic', operation, ...extra, expected: run.actions.length });
  const names = {
    training: 'Đang học và tập',
    audition: 'Đang chờ lượt xét',
    offered: 'Có đề nghị cần trả lời',
    active: 'Đang nhận lịch',
    resting: 'Đang nghỉ tập và show',
    retired: 'Đã khép lịch biểu diễn',
  };
  const offer = p?.auditions.find((a) => a.result === 'offered');
  return (
    <section
      className="panel-page artistic-panel"
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
      <span className="eyebrow">CÔNG TẬP ĐI TRƯỚC ÁNH ĐÈN</span>
      <h2>
        Một tiết mục.
        <br />
        <em>Nhiều phần phải học.</em>
      </h2>
      <p>
        Học nghề, thử tiết mục, chọn lịch tổ chức hoặc tự nhận sân khấu nhỏ. Có thể không được chọn,
        diễn không có phí, lỗ hoặc cần nghỉ. Fan không đồng nghĩa tiền và không sao chép từ người
        theo dõi kênh.
      </p>
      <p className="enterprise-personal">
        Quỹ cá nhân: {money(run.finance.cash)} · Đã theo {detailedBooks(run)}/4 hồ sơ tiệm, kênh, dự
        án và biểu diễn chi tiết.
      </p>
      <p className="fine-print">
        Còn {Math.max(0, 120 - discretionaryCount(run))} lượt quản lý chung. Lịch tháng tự ghi chi
        phí tập, xét và show; các cảnh năm vẫn giúp xử lý hồ sơ khi hết lượt quản lý.
      </p>
      {!p && (
        <>
          <h3>Chọn một chuyên môn để theo</h3>
          <p>
            Chuẩn bị ban đầu {money(designMoney(run, 15))}. Chuyên môn giữ nguyên trong đời này;
            chưa có fan hoặc hợp đồng khi bắt đầu.
          </p>
          <div className="client-service-grid">
            {(Object.keys(ART_NAMES) as ArtDiscipline[]).map((d) => (
              <article className="client-service" key={d} data-discipline={d}>
                <h4>{ART_NAMES[d]}</h4>
                <p>
                  {d === 'music'
                    ? 'Luyện nhạc, cách dẫn và tiết mục trước người nghe.'
                    : d === 'dance'
                      ? 'Tập động tác, nhịp và cách cùng dựng tiết mục.'
                      : 'Đọc cảnh, luyện lời và giữ nhịp với người cùng diễn.'}
                </p>
                <button
                  className="button secondary"
                  disabled={!!start}
                  onClick={() => send('start', { discipline: d })}
                >
                  Bắt đầu học nghề
                </button>
              </article>
            ))}
          </div>
          {start && <p className="fine-print">{start}</p>}
        </>
      )}
      {p && (
        <article className="client-project" data-testid="artistic-profile">
          <div className="client-heading">
            <h3>{ART_NAMES[p.discipline]}</h3>
            <span className="badge" data-testid="artist-status">
              {names[p.status]}
            </span>
          </div>
          <dl className="client-numbers">
            <div>
              <dt>Chuyên môn</dt>
              <dd>{p.skill}/100</dd>
            </div>
            <div>
              <dt>Làm chủ sân khấu</dt>
              <dd>{p.presence}/100</dd>
            </div>
            <div>
              <dt>Người theo dõi biểu diễn</dt>
              <dd data-testid="artist-fans">{p.fans.toLocaleString('vi-VN')}</dd>
            </div>
            <div>
              <dt>Uy tín / mệt vì nghề</dt>
              <dd>
                {p.reputation}/100 · {p.burnout}/100
              </dd>
            </div>
            <div>
              <dt>Đã tập thực tế</dt>
              <dd>{p.trainingMonths} tháng</dd>
            </div>
            <div>
              <dt>Tiết mục đã diễn</dt>
              <dd>{p.showCount}</dd>
            </div>
          </dl>
          <h4>Tiền của phần nghề này</h4>
          <dl className="client-numbers">
            <div>
              <dt>Phí show trước phần chia</dt>
              <dd>{money(p.totals.gross)}</dd>
            </div>
            <div>
              <dt>Phần tổ chức giữ</dt>
              <dd>{money(p.totals.agencyCut)}</dd>
            </div>
            <div>
              <dt>Phí show thực nhận</dt>
              <dd data-testid="artist-received">{money(p.totals.received)}</dd>
            </div>
            <div>
              <dt>Chi chuẩn bị và tập</dt>
              <dd>{money(p.totals.training)}</dd>
            </div>
            <div>
              <dt>Chi thực hiện sân khấu</dt>
              <dd>{money(p.totals.stage)}</dd>
            </div>
            <div>
              <dt>Chi thử / trở lại</dt>
              <dd>
                {money(p.totals.audition)} / {money(p.totals.comeback)}
              </dd>
            </div>
            <div>
              <dt>Lời/lỗ sau chi phí</dt>
              <dd data-testid="artist-net">{money(artisticNet(p))}</dd>
            </div>
          </dl>
          {p.management && (
            <p>
              {p.management === 'agency'
                ? `Lịch với tổ chức: ${AGENCY_CONDITIONS[p.agencyTerms!].name}. Hết kỳ vào năm ${run.player.birthYear + Math.floor(p.agencyThroughMonth! / 12)}, tháng ${(p.agencyThroughMonth! % 12) + 1}.`
                : 'Đang tự nhận lịch; tự chịu chi phí sân khấu, không có phần chia agency.'}
            </p>
          )}
          {reason && <p className="fine-print">{reason}</p>}
          {p.status !== 'retired' && (
            <>
              <div className="client-controls">
                <label htmlFor={policyId}>Nhịp tập và biểu diễn</label>
                <select
                  id={policyId}
                  value={policy}
                  onChange={(e) => setPolicy(e.target.value as ArtPolicy)}
                >
                  {Object.entries(ART_POLICY_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  className="button secondary"
                  disabled={!!reason}
                  onClick={() => send('policy', { policy })}
                >
                  Giữ nhịp biểu diễn
                </button>
              </div>
              <p className="fine-print">
                Đang theo: {ART_POLICY_NAMES[p.policy]}. Nhịp đang xem tốn{' '}
                {money(artisticMonthlyCost(run, policy))}/tháng tập; show có chi phí riêng, khoảng
                sáu tháng một kỳ khi đang nhận lịch. Đi làm hoặc học toàn thời gian làm lịch nặng
                hơn.
              </p>
              {offer && (
                <div className="enterprise-notice">
                  <h4>Đề nghị từ nhóm tổ chức</h4>
                  <p>
                    {AGENCY_CONDITIONS[offer.terms].name}. Kỳ 36 tháng thiết kế; có 18 tháng để trả
                    lời. Chỉ chia khi show thật có phí, không có tiền hoặc fan được cấp trước.
                  </p>
                  <div className="button-row">
                    <button
                      className="button secondary"
                      disabled={
                        !!reason ||
                        run.finance.cash <
                          artisticMonthlyCost(run, p.policy === 'rest' ? 'technique' : p.policy)
                      }
                      onClick={() => send('accept')}
                    >
                      Nhận lịch với tổ chức
                    </button>
                    <button
                      className="button secondary"
                      disabled={!!reason}
                      onClick={() => send('decline')}
                    >
                      Không nhận đề nghị này
                    </button>
                  </div>
                </div>
              )}
              {!offer && p.status !== 'audition' && p.management !== 'agency' && (
                <div className="client-controls">
                  <label htmlFor={termsId}>Điều kiện muốn thử</label>
                  <select
                    id={termsId}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value as AgencyTerms)}
                  >
                    {Object.entries(AGENCY_CONDITIONS).map(([id, t]) => (
                      <option key={id} value={id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="button secondary"
                    disabled={!!reason || !!audition}
                    onClick={() => send('audition', { terms })}
                  >
                    Gửi tiết mục audition
                  </button>
                  <p className="fine-print">
                    {audition ??
                      `Phí chuẩn bị ${money(designMoney(run, 4))}; xét sau sáu tháng, có thể bị từ chối. Tối đa bốn lượt chi tiết trong đời.`}
                  </p>
                </div>
              )}
              {p.status === 'audition' && (
                <p className="academic-result">
                  Đã gửi tiết mục, chưa có hợp đồng hay thu nhập. Quay lại câu chuyện để thời gian
                  tới kỳ xét.
                </p>
              )}
              {p.management !== 'agency' &&
                p.management !== 'independent' &&
                p.status !== 'audition' && (
                  <>
                    <button
                      className="button secondary"
                      disabled={!!reason || !!ready}
                      onClick={() => send('independent')}
                    >
                      Tự nhận tiết mục nhỏ
                    </button>
                    <p className="fine-print">
                      {ready ??
                        'Tự lo lịch và phí sân khấu, không cần được tổ chức chọn; vẫn có thể không có tiền show.'}
                    </p>
                  </>
                )}
              {!closing ? (
                <button
                  className="text-button"
                  disabled={!!reason}
                  onClick={() => setClosing(true)}
                >
                  Tính chuyện khép lịch biểu diễn
                </button>
              ) : (
                <div className="client-close">
                  <p>
                    Khép lịch sẽ dừng tập và show, giữ toàn bộ sổ và một cơ hội xét trở lại; không
                    hoàn chi phí cũ.
                  </p>
                  <div className="button-row">
                    <button
                      className="button secondary"
                      disabled={!!reason}
                      onClick={() => {
                        send('retire');
                        setClosing(false);
                      }}
                    >
                      Xác nhận khép lịch biểu diễn
                    </button>
                    <button className="text-button" onClick={() => setClosing(false)}>
                      Giữ lịch hiện tại
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {p.status === 'retired' && (
            <>
              <p>
                Lịch đã khép; những tiết mục, người theo dõi còn lại và chi phí vẫn thuộc hồ sơ này.
              </p>
              <button
                className="button secondary"
                disabled={!!reason || !!comeback}
                onClick={() => send('comeback')}
              >
                Xét một lần trở lại
              </button>
              <p className="fine-print">
                {comeback ??
                  `Chuẩn bị ${money(designMoney(run, 5))} từ tiền cá nhân, tập lại ít nhất sáu tháng trước khi xét nhận lịch. Không khôi phục fan hoặc tiền show từ quá khứ.`}
              </p>
            </>
          )}
          <details>
            <summary>Các lượt thử đã theo</summary>
            {p.auditions.length ? (
              <ol>
                {p.auditions.map((a) => (
                  <li key={a.id}>
                    {AGENCY_CONDITIONS[a.terms].name} ·{' '}
                    {
                      {
                        pending: 'Đang chờ',
                        offered: 'Có đề nghị',
                        rejected: 'Chưa được chọn',
                        accepted: 'Đã nhận lịch',
                        declined: 'Đã từ chối/khép',
                        expired: 'Đề nghị hết hạn',
                      }[a.result]
                    }
                  </li>
                ))}
              </ol>
            ) : (
              <p>Chưa gửi lượt thử nào.</p>
            )}
          </details>
          {p.recent.length > 0 && (
            <details>
              <summary>Các tiết mục gần đây</summary>
              <ol>
                {p.recent.map((s) => (
                  <li key={s.id}>
                    Tháng {(s.month % 12) + 1}/{run.player.birthYear + Math.floor(s.month / 12)} ·
                    chất lượng {s.quality}/100 · phí {money(s.gross)} · chia {money(s.agencyCut)} ·
                    thực nhận {money(s.received)} · chi sân khấu {money(s.cost)} · người theo dõi{' '}
                    {s.fansDelta > 0 ? '+' : ''}
                    {s.fansDelta}.
                  </li>
                ))}
              </ol>
            </details>
          )}
        </article>
      )}
      <p className="fine-print">
        Tổ chức, kỳ audition và mức phí là mô phỏng hư cấu theo sức mua thiết kế; không kết nối
        agency, tài khoản, hợp đồng hay tiền thật.
      </p>
    </section>
  );
}
