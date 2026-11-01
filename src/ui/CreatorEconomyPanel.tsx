import { useState } from 'react';
import { ArrowLeft, Video } from 'lucide-react';
import type { GameRun, RunAction } from '../domain/model';
import type { CreatorAction, CreatorChannel, CreatorPolicy } from '../domain/creator-economy';
import { CREATOR_NICHES } from '../domain/creator-economy';
import {
  PLATFORM_NAMES,
  NICHE_NAMES,
  creatorReason,
  creatorCosts,
  creatorPolicyReason,
  monetizationReady,
  channelProfit,
} from '../engine/creator-economy';
import { designMoney } from '../domain/currency';
import { money } from './common';
const count = new Intl.NumberFormat('vi-VN');
type Props = { run: GameRun; act: (a: RunAction) => void };
function Policy({
  value,
  set,
  prefix,
  disabled,
  allowLive = false,
}: {
  value: CreatorPolicy;
  set: (p: CreatorPolicy) => void;
  prefix: string;
  disabled: boolean;
  allowLive?: boolean;
}) {
  return (
    <fieldset className="enterprise-policy" disabled={disabled}>
      <legend>Cách làm nội dung</legend>
      <label htmlFor={prefix + '-format'}>Hình thức</label>
      <select
        id={prefix + '-format'}
        value={value.format}
        onChange={(e) => set({ ...value, format: e.target.value as CreatorPolicy['format'] })}
      >
        <option value="video">Video có biên tập</option>
        {(allowLive || value.format === 'live') && (
          <option value="live" disabled={!allowLive}>
            TikTok LIVE{allowLive ? '' : ' · cần đủ điều kiện để trở lại'}
          </option>
        )}
      </select>
      <label htmlFor={prefix + '-niche'}>Chủ đề</label>
      <select
        id={prefix + '-niche'}
        value={value.niche}
        onChange={(e) => set({ ...value, niche: e.target.value as CreatorPolicy['niche'] })}
      >
        {CREATOR_NICHES.map((n) => (
          <option value={n} key={n}>
            {NICHE_NAMES[n]}
          </option>
        ))}
      </select>
      <label htmlFor={prefix + '-rhythm'}>Nhịp sản xuất</label>
      <select
        id={prefix + '-rhythm'}
        value={value.rhythm}
        onChange={(e) => set({ ...value, rhythm: e.target.value as CreatorPolicy['rhythm'] })}
      >
        <option value="light">Nhẹ · giữ sức, ít nội dung</option>
        <option value="steady">Đều · thêm thời gian và chi phí</option>
        <option value="intense">Dày · dễ kiệt sức, chưa chắc tăng khán giả</option>
      </select>
      <label htmlFor={prefix + '-focus'}>Điều muốn chăm hơn</label>
      <select
        id={prefix + '-focus'}
        value={value.focus}
        onChange={(e) => set({ ...value, focus: e.target.value as CreatorPolicy['focus'] })}
      >
        <option value="craft">Tay nghề và chất lượng</option>
        <option value="community">Tương tác và cộng đồng</option>
        <option value="reach">Đưa nội dung đi xa hơn</option>
      </select>
    </fieldset>
  );
}
function Channel({ run, act, c }: Props & { c: CreatorChannel }) {
  const [policy, setPolicy] = useState(c.policy),
    [closing, setClosing] = useState(false);
  const reason = creatorReason(run),
    invalid = creatorPolicyReason(run, c, policy),
    closed = c.status === 'closed';
  const send = (operation: CreatorAction['operation'], extra: Partial<CreatorAction> = {}) =>
    act({
      type: 'creator',
      operation,
      id: c.id as CreatorAction['id'],
      expected: run.actions.length,
      ...extra,
    });
  const recent = c.recent.at(-1),
    ready = monetizationReady(run, c),
    canApply =
      ready &&
      !['approved', 'pending'].includes(c.monetization) &&
      (c.appliedMonth === null || run.month - c.appliedMonth >= 12);
  const figures: [string, string][] = [
    ['Người theo dõi', count.format(c.audience)],
    ['Tương tác', `${c.engagement}/100`],
    ['Uy tín', `${c.reputation}/100`],
    ['Chất lượng', `${c.quality}/100`],
    ['Kỹ năng làm nội dung', `${c.skill}/100`],
    ['Kiệt sức', `${c.burnout}/100`],
    ['Thiết bị', `Bậc ${c.equipment}/3`],
    ['Lời/lỗ cộng dồn', money(channelProfit(c), run)],
  ];
  return (
    <article className="enterprise-card" data-channel={c.id}>
      <div className="enterprise-card-head">
        <h3>
          {PLATFORM_NAMES[c.platform]} · {NICHE_NAMES[c.policy.niche].toLowerCase()}
        </h3>
        <span className="badge">
          {closed ? 'Đã khép kênh' : c.status === 'paused' ? 'Đang nghỉ' : 'Đang sản xuất'}
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
      {c.pauseReason && (
        <p className="enterprise-notice">
          {
            {
              manual: 'Bạn đã chọn nghỉ.',
              funds: 'Chưa đủ tiền sản xuất; kênh không tự vay.',
              burnout: 'Cần hồi sức trước khi trở lại.',
              eligibility: 'Điều kiện LIVE hoặc giới thiệu hàng đã đổi. Hãy xem lại hình thức.',
            }[c.pauseReason]
          }
        </p>
      )}
      {recent && (
        <section className="enterprise-month" aria-label="Kết quả kênh gần nhất">
          <h4>Kỳ gần nhất · tháng đời {recent.month}</h4>
          <p className={recent.profit < 0 ? 'enterprise-loss' : 'enterprise-result'}>
            {recent.profit < 0 ? 'Lỗ' : 'Thu trừ chi'} {money(Math.abs(recent.profit), run)}
          </p>
          <dl className="enterprise-metrics">
            {[
              ['Thu từ nền tảng', recent.platformIncome],
              ['Phí hợp tác có nội dung', recent.sponsorIncome],
              ['Chi phí sản xuất', recent.cost],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt>{label}</dt>
                <dd>{money(Number(value), run)}</dd>
              </div>
            ))}
          </dl>
          <p className="fine-print">
            Đã làm {recent.published} nội dung · Thêm {count.format(recent.gained)} người · Rời đi{' '}
            {count.format(recent.lost)} người{recent.viral ? ' · Có nội dung lan nhanh' : ''}
          </p>
        </section>
      )}
      <p data-testid="channel-monetization" className="enterprise-notice">
        {
          {
            none: 'Chưa gửi xét kiếm tiền.',
            pending: 'Đang chờ xét; tối thiểu hai tháng kể từ lần nộp.',
            approved: 'Được xét nhận thu trong mô phỏng; mỗi tháng vẫn có thể nhận 0 đồng.',
            rejected:
              'Chưa đạt hoặc không còn đủ điều kiện. Có thể nộp lại sau 12 tháng tính từ lần gửi.',
          }[c.monetization]
        }
      </p>
      {c.sponsor && (
        <p>
          Hợp tác còn {c.sponsor.remaining} kỳ có sản xuất, phí mỗi kỳ {money(c.sponsor.fee, run)}.
          Nghỉ không nhận phí.
        </p>
      )}
      {!closed && (
        <>
          {reason && (
            <p role="status" className="enterprise-notice">
              {reason}
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send('policy', { policy });
            }}
          >
            <Policy
              value={policy}
              set={setPolicy}
              prefix={c.id}
              disabled={!!reason}
              allowLive={c.platform === 'tiktok' && run.world.year >= 2023 && c.audience >= 1000}
            />
            <p className="fine-print">
              Chi phí mỗi tháng đang chọn: {money(creatorCosts(run, policy), run)}. {invalid}
            </p>
            <button
              className="button secondary"
              disabled={
                !!reason || !!invalid || JSON.stringify(policy) === JSON.stringify(c.policy)
              }
            >
              Giữ cách làm này
            </button>
          </form>
          <div className="button-row enterprise-lifecycle">
            <button
              className="button secondary"
              disabled={
                !!reason ||
                c.equipment >= 3 ||
                run.finance.cash < designMoney(run, 40 * (c.equipment + 1))
              }
              onClick={() => send('equipment')}
            >
              Nâng thiết bị · {money(designMoney(run, 40 * (c.equipment + 1)), run)}
            </button>
            <button
              className="button secondary"
              disabled={!!reason || !canApply}
              onClick={() => send('apply')}
            >
              Gửi xét kiếm tiền
            </button>
          </div>
          <div className="button-row">
            <button
              className="text-button"
              disabled={
                !!reason ||
                (c.status === 'paused' &&
                  (c.burnout > 60 ||
                    run.finance.cash < creatorCosts(run, c.policy) ||
                    !!creatorPolicyReason(run, c, c.policy)))
              }
              onClick={() => send(c.status === 'active' ? 'pause' : 'resume')}
            >
              {c.status === 'active' ? 'Nghỉ làm nội dung' : 'Trở lại làm nội dung'}
            </button>
            <button
              className="text-button"
              disabled={!!reason}
              onClick={() => setClosing(!closing)}
            >
              Tính chuyện khép kênh
            </button>
          </div>
          {closing && (
            <div className="enterprise-notice">
              <p>
                Khép kênh giữ nguyên lịch sử, dừng thu chi và kết thúc hợp tác. Chi phí thiết lập đã
                tiêu dùng không bán lại thành tiền.
              </p>
              <button
                className="button secondary"
                disabled={!!reason}
                onClick={() => send('close')}
              >
                Xác nhận khép kênh
              </button>
              <button className="text-button" onClick={() => setClosing(false)}>
                Giữ kênh lúc này
              </button>
            </div>
          )}
        </>
      )}
      <details className="enterprise-ledger">
        <summary>Sổ {c.recent.length} kỳ nội dung gần nhất</summary>
        <div className="enterprise-table" role="region" tabIndex={0} aria-label={`Sổ kênh ${c.id}`}>
          <table>
            <thead>
              <tr>
                <th>Tháng đời</th>
                <th>Khán giả</th>
                <th>Nội dung</th>
                <th>Nền tảng</th>
                <th>Hợp tác</th>
                <th>Chi phí</th>
                <th>Lời/lỗ</th>
              </tr>
            </thead>
            <tbody>
              {c.recent.map((m) => (
                <tr key={m.month}>
                  <th>{m.month}</th>
                  <td>{count.format(m.audience)}</td>
                  <td>{m.published}</td>
                  <td>{money(m.platformIncome, run)}</td>
                  <td>{money(m.sponsorIncome, run)}</td>
                  <td>{money(m.cost, run)}</td>
                  <td>{money(m.profit, run)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}
export function CreatorEconomyPanel({ run, act, onBack }: Props & { onBack: () => void }) {
  const [platform, setPlatform] = useState<CreatorChannel['platform']>('youtube'),
    [policy, setPolicy] = useState<CreatorPolicy>({
      format: 'video',
      rhythm: 'light',
      focus: 'craft',
      niche: 'education',
    });
  if (!run.creator) return null;
  const reason = creatorReason(run),
    countBooks = run.creator.channels.length + (run.enterprise?.ventures.length ?? 0),
    era =
      run.world.year >= (platform === 'youtube' ? 2014 : 2018) &&
      run.world.technologies.includes('internet');
  const invalid = creatorPolicyReason(run, { platform, audience: 0, equipment: 1 }, policy);
  return (
    <section
      className="panel-page enterprise-panel creator-economy-panel"
      onClickCapture={(e) => {
        if (e.detail > 1) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        Về việc làm và học tập
      </button>
      <span className="eyebrow">MỘT TIẾNG NÓI, NHIỀU NGÀY LÀM</span>
      <h2>
        Kể điều mình biết.
        <br />
        <em>Giữ sức để đi lâu.</em>
      </h2>
      <p>
        Khán giả cần thời gian để ở lại. Thiết bị, sản xuất và lịch làm đều có giá; một kênh đông
        người vẫn có thể lỗ. Tiền kênh dùng chung sổ cá nhân, còn thu bán hàng giữ riêng trong sổ
        tiệm.
      </p>
      <p className="enterprise-personal">
        Tiền mặt của bạn: <b>{money(run.finance.cash, run)}</b>
      </p>
      {run.creator.channels.map((c) => (
        <Channel key={c.id + JSON.stringify(c.policy)} run={run} act={act} c={c} />
      ))}
      {countBooks < 4 &&
        run.month >= 216 &&
        run.world.year >= 2014 &&
        run.world.technologies.includes('internet') && (
          <form
            className="enterprise-launch channel-launch"
            onSubmit={(e) => {
              e.preventDefault();
              act({
                type: 'creator',
                operation: 'start',
                platform,
                policy,
                expected: run.actions.length,
              });
            }}
          >
            <h3>
              <Video size={22} aria-hidden="true" />
              Bắt đầu một kênh
            </h3>
            {reason && (
              <p role="status" className="enterprise-notice">
                {reason}
              </p>
            )}
            <label htmlFor="new-channel-platform">Nền tảng</label>
            <select
              id="new-channel-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as CreatorChannel['platform'])}
            >
              <option value="youtube">YouTube · từ 2014 trong game</option>
              {run.world.year >= 2018 && (
                <option value="tiktok">TikTok · video từ 2018 trong game</option>
              )}
            </select>
            <Policy value={policy} set={setPolicy} prefix="new-channel" disabled={!!reason} />
            <p className="fine-print">
              Thiết lập {money(designMoney(run, 40), run)}; chi phí sản xuất{' '}
              {money(creatorCosts(run, policy), run)}/tháng. Thiết lập tính là chi phí, không tạo
              tài sản thanh lý. {invalid}
              {!era ? ' Nền tảng chưa mở trong thời kỳ này.' : ''}
            </p>
            <button
              className="button primary"
              disabled={!!reason || !!invalid || !era || run.finance.cash < designMoney(run, 40)}
            >
              Bắt đầu kênh
            </button>
          </form>
        )}
      {countBooks >= 4 && (
        <p className="fine-print">Đã giữ đủ bốn sổ tiệm và kênh cho cuộc đời này, kể cả đã đóng.</p>
      )}
      {run.month < 216 || run.world.year < 2014 ? (
        <p className="enterprise-notice">
          Những năm đầu vẫn dành cho lớn lên và học hỏi. Cơ hội tự xây kênh mở từ 18 tuổi, trong bối
          cảnh trực tuyến từ năm 2014 của mô phỏng.
        </p>
      ) : null}
      {run.month >= 216 && run.world.year >= 2014 && (
        <details className="enterprise-notice">
          <summary>Điều kiện của mô phỏng</summary>
          <p>
            Để gửi xét nhận thu: kênh hoạt động ít nhất 12 tháng, có 1.000 người theo dõi, chất
            lượng 50, uy tín 50 và tương tác 35.{' '}
            {run.world.year >= 2023 ? 'TikTok cần LIVE; LIVE trò chơi cần thiết bị bậc 2. ' : ''}Xét
            ít nhất hai tháng, có thể từ chối, lượt mới cách lần gửi trước 12 tháng. Những ngưỡng
            này là luật game, không phải chính sách của nền tảng thật.
          </p>
          <p>
            Giới thiệu hàng cần tiệm đang hoạt động và LIVE; không nhận thêm tiền nền tảng từ cùng
            hoạt động bán hàng. Năm sau 2026 là tương lai hư cấu. Không kết nối tài khoản, API hay
            tiền thật.
          </p>
        </details>
      )}
    </section>
  );
}
