import { useId, useState } from 'react';
import type { GameRun, RunAction } from '../domain/model';
import type { CreatorChannel } from '../domain/creator-economy';
import type {
  CreativeAction,
  CreatorCollaboration,
  GamingPolicy,
  CollabPeer,
  CollabTerms,
} from '../domain/creative-careers';
import {
  gamingStartReason,
  gamingMonthlyCost,
  gamingContestReason,
  gamingNet,
  creativeReason,
  collaborationReason,
  currentCollaboration,
} from '../engine/creative-careers';
import { COLLAB_CONDITIONS, CREATIVE_PEERS, peerById } from '../content/creative-peers';
import { designMoney, formatMoney } from '../domain/currency';
import { channelProfit } from '../engine/creator-economy';

type Props = { run: GameRun; act: (a: RunAction) => void; c: CreatorChannel };
const policies: Record<GamingPolicy, string> = {
  practice: 'Luyện kỹ năng',
  community: 'Chăm cộng đồng',
  competition: 'Chuẩn bị thi và giữ người xem',
  rest: 'Nghỉ tập hồi sức',
};
function CollabCard({ run, act, x }: Omit<Props, 'c'> & { x: CreatorCollaboration }) {
  const [terms, setTerms] = useState<CollabTerms>('balanced'),
    [cancel, setCancel] = useState(false),
    label = useId();
  const reason = creativeReason(run),
    channel = run.creator?.channels.find((c) => c.id === x.channelId),
    acceptReason =
      reason ??
      (channel?.status !== 'active' ? 'Cần mở lại kênh trước khi nhận lịch làm chung.' : null),
    money = (n: number) => formatMoney(n, run),
    open = ['proposal', 'offered', 'working'].includes(x.status);
  const send = (operation: CreativeAction['operation'], extra: Partial<CreativeAction> = {}) =>
    act({ type: 'creative', operation, id: x.id, ...extra, expected: run.actions.length });
  const statuses = {
    proposal: 'Đang trao đổi',
    offered: 'Đã chọn điều kiện',
    working: 'Đang làm chung',
    settled: 'Đã có kết quả',
    rejected: 'Lời mời chưa được chọn',
    cancelled: 'Đã khép lời hẹn',
  };
  return (
    <article className="client-project" data-collab={x.id}>
      <div className="client-heading">
        <h4>{peerById(x.peer).name}</h4>
        <span className="badge" data-testid="collab-status">
          {statuses[x.status]}
        </span>
      </div>
      <p>
        Phần khán giả dự kiến trùng {x.overlap}% · Mức hợp chủ đề {x.compatibility}/100 · Chất lượng
        chung {x.quality}/100.
      </p>
      <p>
        Đã chi {money(x.cost)} · Thay đổi theo dõi khi có kết quả:{' '}
        <strong data-testid="collab-delta">
          {x.audienceDelta > 0 ? '+' : ''}
          {x.audienceDelta}
        </strong>
        .
      </p>
      {x.terms && <p>Điều kiện đã chọn: {COLLAB_CONDITIONS[x.terms].name}.</p>}
      {x.outcome && <p className="academic-result">{x.outcome}</p>}
      {open && reason && <p className="fine-print">{reason}</p>}
      {x.status === 'proposal' && (
        <div className="client-controls">
          <label htmlFor={label}>Điều kiện hợp tác</label>
          <select
            id={label}
            value={terms}
            onChange={(e) => setTerms(e.target.value as CollabTerms)}
          >
            {Object.entries(COLLAB_CONDITIONS).map(([id, t]) => (
              <option key={id} value={id}>
                {t.name} · {money(designMoney(run, t.cost))} nếu nhận sản xuất
              </option>
            ))}
          </select>
          <button
            className="button secondary"
            disabled={!!reason}
            onClick={() => send('collab-negotiate', { terms })}
          >
            Gửi điều kiện hợp tác
          </button>
        </div>
      )}
      {x.status === 'offered' && (
        <>
          <p>
            Nhận lịch sẽ chi {money(designMoney(run, COLLAB_CONDITIONS[x.terms!].cost))}; chưa tạo
            lượt xem hoặc tiền công.
          </p>
          <button
            className="button secondary"
            disabled={
              !!acceptReason ||
              run.finance.cash < designMoney(run, COLLAB_CONDITIONS[x.terms!].cost)
            }
            onClick={() => send('collab-accept')}
          >
            Nhận lịch làm chung
          </button>
          {acceptReason && <p className="fine-print">{acceptReason}</p>}
        </>
      )}
      {x.status === 'working' && (
        <p>
          Chờ kỳ nội dung sau sáu tháng thiết kế. Quay lại câu chuyện để thời gian đi; kết quả có
          thể tăng, đứng yên hoặc giảm người theo dõi.
        </p>
      )}
      {open &&
        (!cancel ? (
          <button className="text-button" disabled={!!reason} onClick={() => setCancel(true)}>
            Tính chuyện khép lời hẹn
          </button>
        ) : (
          <div className="client-close">
            <p>Chi phí đã bỏ ra giữ nguyên; không thu khoản hứa hoặc xóa hồ sơ.</p>
            <button
              className="button secondary"
              disabled={!!reason}
              onClick={() => send('collab-cancel')}
            >
              Xác nhận khép lời hẹn
            </button>
            <button className="text-button" onClick={() => setCancel(false)}>
              Giữ lời hẹn
            </button>
          </div>
        ))}
    </article>
  );
}
export function ChannelCareers({ run, act, c }: Props) {
  const [policy, setPolicy] = useState<GamingPolicy>(run.creative?.gaming?.policy ?? 'practice'),
    [peer, setPeer] = useState<CollabPeer>('club-host'),
    [retiring, setRetiring] = useState(false);
  const policyLabel = useId(),
    peerLabel = useId();
  if (!run.creative) return null;
  const g = run.creative.gaming,
    own = g?.channelId === c.id,
    reason = creativeReason(run),
    policyReason =
      reason ??
      (policy !== 'rest' &&
      (c.status !== 'active' || c.policy.niche !== 'gaming' || c.policy.format !== 'live')
        ? 'Cần kênh trò chơi đang LIVE để tập tiếp; bạn vẫn có thể chọn nghỉ tập.'
        : null),
    start = gamingStartReason(run, c),
    contest = gamingContestReason(run),
    collab = collaborationReason(run, c, peer),
    money = (n: number) => formatMoney(n, run);
  const send = (operation: CreativeAction['operation'], extra: Partial<CreativeAction> = {}) =>
    act({ type: 'creative', operation, ...extra, expected: run.actions.length });
  const linked = run.creative.collaborations.filter((x) => x.channelId === c.id),
    jointCost = linked.reduce((n, x) => n + x.cost, 0);
  return (
    <section className="channel-careers">
      {(c.policy.niche === 'gaming' || own) && (
        <div className="gaming-career" data-testid="gaming-career">
          <h4>Đường gaming độc lập</h4>
          <p>
            Kỹ năng chơi, cách giữ người xem và cộng đồng có hồ sơ riêng. Số theo dõi và tiền nền
            tảng vẫn chỉ lấy từ kênh phía trên.
          </p>
          {!g && (
            <>
              <button
                className="button secondary"
                disabled={!!start}
                onClick={() =>
                  send('gaming-start', { channelId: c.id as CreativeAction['channelId'] })
                }
              >
                Theo nghề gaming trên kênh này
              </button>
              {start && <p className="fine-print">{start}</p>}
            </>
          )}
          {g && !own && (
            <p className="fine-print">Đường gaming đã gắn với một kênh khác trong đời này.</p>
          )}
          {own && g && (
            <>
              <p role="status" data-testid="gaming-status">
                {g.status === 'retired'
                  ? 'Đã khép lịch gaming'
                  : g.status === 'resting'
                    ? 'Đang nghỉ tập'
                    : 'Đang theo nghề'}
              </p>
              <dl className="client-numbers">
                <div>
                  <dt>Kỹ năng trò chơi</dt>
                  <dd>{g.skill}/100</dd>
                </div>
                <div>
                  <dt>Gắn kết cộng đồng</dt>
                  <dd>{g.community}/100</dd>
                </div>
                <div>
                  <dt>Giữ người xem</dt>
                  <dd>{g.retention}/100</dd>
                </div>
                <div>
                  <dt>Mệt vì tập và thi</dt>
                  <dd>{g.fatigue}/100</dd>
                </div>
                <div>
                  <dt>Đã chi luyện tập</dt>
                  <dd>{money(g.totals.training)}</dd>
                </div>
                <div>
                  <dt>Đã chi dự giải</dt>
                  <dd>{money(g.totals.entries)}</dd>
                </div>
                <div>
                  <dt>Giải thưởng đã nhận</dt>
                  <dd>{money(g.totals.prizes)}</dd>
                </div>
                <div>
                  <dt>Riêng tập và giải: lời/lỗ</dt>
                  <dd>{money(gamingNet(run))}</dd>
                </div>
              </dl>
              {g.status !== 'retired' && (
                <>
                  <div className="client-controls">
                    <label htmlFor={policyLabel}>Nhịp nghề gaming</label>
                    <select
                      id={policyLabel}
                      value={policy}
                      onChange={(e) => setPolicy(e.target.value as GamingPolicy)}
                    >
                      {Object.entries(policies).map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="button secondary"
                      disabled={!!policyReason}
                      onClick={() => send('gaming-policy', { policy })}
                    >
                      Giữ nhịp gaming
                    </button>
                    {policyReason && <p className="fine-print">{policyReason}</p>}
                  </div>
                  <p className="fine-print">
                    Nhịp đang xem tốn {money(gamingMonthlyCost(run, policy))}/tháng tập, ngoài sản
                    xuất kênh. Đi làm hoặc tập dồn tăng mệt; nghỉ tập không tự dừng kênh.
                  </p>
                  <button
                    className="button secondary"
                    disabled={!!reason || !!contest}
                    onClick={() => send('gaming-contest')}
                  >
                    Đăng ký kỳ thi đấu
                  </button>
                  <p className="fine-print">
                    {contest ??
                      `Phí dự giải ${money(designMoney(run, 12))}; xét sau sáu tháng, có thể không nhận giải. Tối đa tám kỳ chi tiết trong đời.`}
                  </p>
                  {!retiring ? (
                    <button
                      className="text-button"
                      disabled={!!reason}
                      onClick={() => setRetiring(true)}
                    >
                      Tính chuyện khép lịch gaming
                    </button>
                  ) : (
                    <div className="client-close">
                      <p>
                        Lịch tập dừng và kỳ chưa thi khép không hoàn phí. Kênh và toàn bộ hồ sơ vẫn
                        giữ; không mở lại hồ sơ gaming thứ hai.
                      </p>
                      <button
                        className="button secondary"
                        disabled={!!reason}
                        onClick={() => send('gaming-retire')}
                      >
                        Xác nhận khép lịch gaming
                      </button>
                      <button className="text-button" onClick={() => setRetiring(false)}>
                        Tiếp tục theo nghề
                      </button>
                    </div>
                  )}
                  {reason && <p className="fine-print">{reason}</p>}
                </>
              )}
              {g.rounds.length > 0 && (
                <details>
                  <summary>Các kỳ thi đã theo</summary>
                  <ol>
                    {g.rounds.map((x) => (
                      <li key={x.id}>
                        {x.result === 'pending'
                          ? 'Đang chờ'
                          : x.result === 'won'
                            ? 'Đạt giải chính'
                            : x.result === 'placed'
                              ? 'Đạt giải phụ'
                              : x.result === 'cancelled'
                                ? 'Đã dừng'
                                : 'Không có giải'}{' '}
                        · phí {money(x.entryFee)} · thực nhận {money(x.prize)}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </>
          )}
        </div>
      )}
      <h4>Cùng làm một nội dung</h4>
      <p>
        Đối tác hư cấu có cách làm và khán giả trùng khác nhau. Hợp tác cần chia công, chi phí và
        kết quả thực tế; không tự trả thêm một khoản nền tảng.
      </p>
      {linked.map((x) => (
        <CollabCard key={x.id} run={run} act={act} x={x} />
      ))}
      {c.status !== 'closed' &&
        !currentCollaboration(run) &&
        run.creative.collaborations.length < 6 && (
          <div className="client-controls">
            <label htmlFor={peerLabel}>Người muốn cùng làm</label>
            <select
              id={peerLabel}
              value={peer}
              onChange={(e) => setPeer(e.target.value as CollabPeer)}
            >
              {CREATIVE_PEERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p>{peerById(peer).description}</p>
            <button
              className="button secondary"
              disabled={!!collab}
              onClick={() =>
                send('collab-inquire', { channelId: c.id as CreativeAction['channelId'], peer })
              }
            >
              Gửi lời hỏi hợp tác
            </button>
            <p className="fine-print">
              {collab ?? `Phí chuẩn bị ${money(designMoney(run, 1))}. Lời mời có thể bị từ chối.`}
            </p>
          </div>
        )}
      <p className="fine-print">
        Đã theo {run.creative.collaborations.length}/6 cuộc hợp tác chi tiết cả đời. Tổng lời/lỗ
        kênh này sau cả tập, giải và hợp tác:{' '}
        <strong>{money(channelProfit(c) + (own ? gamingNet(run) : 0) - jointCost)}</strong>. Phí,
        chi phí và giải thưởng tách rõ trong từng sổ.
      </p>
    </section>
  );
}
