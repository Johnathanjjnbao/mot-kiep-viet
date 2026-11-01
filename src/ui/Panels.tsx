import { designMoney, currencyOf } from '../domain/currency';
import { FamilyPanel } from './FamilyPanel';
import { AcademicPanel } from './AcademicPanel';
import { EmploymentPanel } from './EmploymentPanel';
import { jobProbability } from '../engine/employment';
import { SocialPanel } from './SocialPanel';
import {
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  Heart,
  Home,
  Landmark,
  PiggyBank,
  Wallet,
} from 'lucide-react';
import type { GameRun, RunAction } from '../domain/model';
import {
  CAREERS,
  ageOf,
  careerReason,
  currentCareer,
  monthlyExpense,
  monthlyIncome,
} from '../content/world';
import { netWorth } from '../engine/finance';
import { money } from './common';
import { PARENT_TRAITS } from '../domain/creator';
type Props = { run: GameRun; act: (a: RunAction) => void };
export function CareerPanel({ run, act }: Props) {
  const current = currentCareer(run),
    age = ageOf(run),
    studying = run.player.education.find((e) => e.endMonth > run.month);
  return (
    <section className="panel-page">
      <span className="eyebrow">MỘT CÁCH ĐỂ MƯU SINH</span>
      <h2>
        Nghề nuôi mình.
        <br />
        <em>Việc dạy mình.</em>
      </h2>
      <p className="muted">
        {age < 18
          ? 'Bạn đang tuổi học và khám phá. Từ 18 tuổi, những công việc đầu tiên sẽ mở ra.'
          : age >= 65
            ? 'Bạn đã nghỉ hưu trong mô phỏng. Những năm làm việc vẫn còn trong nhật ký.'
            : studying
              ? `Bạn đang học, dự kiến hoàn thành năm ${run.player.birthYear + Math.floor(studying.endMonth / 12)}. Hãy học xong trước khi nhận việc.`
              : 'Học vấn mở cửa; tay nghề, kinh nghiệm và hoàn cảnh quyết định bạn đi được bao xa.'}
      </p>
      <EmploymentPanel run={run} act={act} />
      <AcademicPanel run={run} act={act} />
      {current && (
        <div className="current-job">
          <BriefcaseBusiness aria-hidden="true" size={24} />
          <div>
            <h3>{CAREERS.find((c) => c.id === current.id)!.name}</h3>
            <p>
              {money(monthlyIncome(run), run)}/tháng · {Math.floor(current.experience / 12)} năm
              kinh nghiệm · bậc {current.level + 1}
              {current.contractEndMonth ? ' · hợp đồng tạm sáu tháng' : ''}
            </p>
          </div>
          <button
            className="text-button"
            onClick={() => act({ type: 'manage', action: 'quit-job' })}
          >
            Rời việc
          </button>
        </div>
      )}
      <div className="career-grid">
        {CAREERS.map((job) => {
          const reason = careerReason(run, job.id),
            same = current?.id === job.id;
          return (
            <article className="career-option" key={job.id} data-career={job.id}>
              <div className="career-option-top">
                <h3>{job.name}</h3>
                {same ? (
                  <span className="badge">
                    <Check size={13} aria-hidden="true" /> Đang làm
                  </span>
                ) : (
                  <span className="career-income">
                    ~
                    {money(
                      designMoney(run, Math.round(job.baseIncome * run.world.wageFactor)),
                      run,
                    )}
                    /tháng
                  </span>
                )}
              </div>
              <p>{job.description}</p>
              <p className="fine-print">{reason ?? job.progression}</p>
              {run.employment && !same && !reason && (
                <p className="fine-print">
                  Khả năng được nhận trong mô phỏng: khoảng{' '}
                  {Math.round(jobProbability(run, job.id) * 100)}%. Văn bằng, kinh nghiệm và kỹ năng
                  có thể giúp; kết quả chưa được bảo đảm.
                </p>
              )}
              <button
                className="text-button"
                disabled={Boolean(reason) || same}
                onClick={() => act({ type: 'manage', action: 'apply-job', career: job.id })}
              >
                {same
                  ? 'Công việc hiện tại'
                  : reason
                    ? 'Chưa thể ứng tuyển'
                    : run.employment
                      ? 'Ứng tuyển'
                      : 'Nhận công việc'}
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </article>
          );
        })}
      </div>
      <p className="fine-print">
        Mức tham khảo là tham số thiết kế. Thu nhập thực trong sổ chịu ảnh hưởng tay nghề, áp lực,
        bậc nghề và chu kỳ ổn định của từng công việc.
      </p>
    </section>
  );
}
export function FinancePanel({ run, act }: Props) {
  const enabled = ageOf(run) >= 18 && run.status !== 'ended',
    f = run.finance;
  const actions = [
    {
      id: 'save-money' as const,
      name: `Gửi ${money(designMoney(run, 50), run)}`,
      icon: PiggyBank,
      disabled: f.cash < designMoney(run, 50),
    },
    {
      id: 'withdraw-money' as const,
      name: `Rút tối đa ${money(designMoney(run, 50), run)}`,
      icon: Wallet,
      disabled: f.savings === 0,
    },
    {
      id: 'borrow' as const,
      name: `Vay ${money(designMoney(run, 50), run)}`,
      icon: Landmark,
      disabled: f.liability.principal > designMoney(run, 250),
    },
    {
      id: 'repay' as const,
      name: `Trả tối đa ${money(designMoney(run, 50), run)}`,
      icon: CircleDollarSign,
      disabled: f.cash === 0 || f.liability.principal === 0,
    },
  ];
  return (
    <section className="panel-page">
      <span className="eyebrow">ĐỒNG RA, ĐỒNG VÀO</span>
      <h2>
        Đủ sống hôm nay.
        <br />
        <em>Dành cho ngày mai.</em>
      </h2>
      <div className="finance-overview" data-currency={currencyOf(run)}>
        {[
          ['Tiền mặt', money(f.cash, run)],
          ['Để dành', money(f.savings, run)],
          ['Còn nợ', money(f.liability.principal, run)],
          ['Tài sản ròng', money(netWorth(run), run)],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="income-line">
        <span>
          Thu nhập nghề <b>{money(monthlyIncome(run), run)}/tháng</b>
        </span>
        <span>
          Sinh hoạt dự kiến <b>{money(monthlyExpense(run), run)}/tháng</b>
        </span>
      </div>
      <p className="fine-print">
        {currencyOf(run) === 'vnd-v1'
          ? 'VND theo sức mua thiết kế năm 2026, không phải giá danh nghĩa lịch sử.'
          : 'đSM là đơn vị sức mua của game, không phải VNĐ.'}{' '}
        Lãi vay 0,4%/tháng nhập gốc; tiết kiệm 0,15%/tháng, làm tròn xuống. Thiếu tiền cho sinh hoạt
        bắt buộc sẽ rút tiết kiệm, rồi ghi khoản vay bù.
      </p>
      <div className="finance-actions">
        {actions.map((a) => (
          <button
            className="button secondary"
            key={a.id}
            disabled={!enabled || a.disabled}
            onClick={() => act({ type: 'manage', action: a.id })}
          >
            <a.icon size={17} aria-hidden="true" />
            {a.name}
          </button>
        ))}
      </div>
      <div className="housing-card">
        <Home size={25} aria-hidden="true" />
        <div>
          <h3>
            {run.household.housing === 'family'
              ? 'Mái nhà gia đình'
              : run.household.housing === 'rent'
                ? 'Một căn phòng trọ'
                : 'Căn nhà của bạn'}
          </h3>
          <p>
            {run.household.housing === 'rent'
              ? 'Tiền thuê được tính trong sinh hoạt phí.'
              : 'Không có phí thuê nhà.'}
          </p>
        </div>
        <div className="button-row">
          <button
            className="text-button"
            disabled={!enabled || run.household.housing === 'owned'}
            onClick={() => act({ type: 'manage', action: 'move-home' })}
          >
            {run.household.housing === 'family' ? 'Ra ở trọ' : 'Về nhà gia đình'}
          </button>
          <button
            className="text-button"
            disabled={
              !enabled || f.cash < designMoney(run, 600) || f.assets.some((a) => a.id === 'home')
            }
            onClick={() => act({ type: 'manage', action: 'buy-home' })}
          >
            Mua nhà · {money(designMoney(run, 600), run)}
          </button>
        </div>
      </div>
      <h3 className="ledger-title">Những khoản gần đây</h3>
      <div className="ledger" role="table" aria-label="Sổ giao dịch gần đây">
        <div role="row" className="ledger-header">
          <span role="columnheader">Thời điểm</span>
          <span role="columnheader">Khoản ghi</span>
          <span role="columnheader">Biến động</span>
        </div>
        {f.transactions
          .slice(-18)
          .reverse()
          .map((t) => (
            <div role="row" key={t.id}>
              <span role="cell">
                {run.player.birthYear + Math.floor(t.month / 12)}
                <small>tháng {(t.month % 12) + 1}</small>
              </span>
              <span role="cell">{t.label}</span>
              <span role="cell">
                {t.cash !== 0
                  ? `${t.cash > 0 ? '+' : ''}${money(t.cash, run)}`
                  : t.debt
                    ? `Nợ +${money(t.debt, run)}`
                    : `Để dành +${money(t.savings, run)}`}
              </span>
            </div>
          ))}
      </div>
      <p className="fine-print">
        Toàn bộ {f.transactions.length} giao dịch được giữ trong tệp lưu; hiển thị 18 khoản mới
        nhất.
      </p>
    </section>
  );
}
export function PeoplePanel({ run, act }: Props) {
  const types = {
    family: 'Gia đình',
    friend: 'Bạn bè',
    partner: 'Bạn đời',
    ex: 'Người cũ',
    child: 'Người con',
  };
  return (
    <section className="panel-page">
      <span className="eyebrow">NHỮNG NGƯỜI ĐI CÙNG</span>
      <h2>
        Một đời mình.
        <br />
        <em>Có bóng hình nhau.</em>
      </h2>
      <p className="muted">
        Quan hệ gần gũi giúp giảm áp lực. Những lần sẻ chia hay xa cách được giữ lại trong ký ức
        chung.
      </p>
      <SocialPanel run={run} act={act} />
      <FamilyPanel run={run} act={act} />
      <div className="people-list">
        {run.relationships
          .filter(
            (r) =>
              !run.social?.people.some((p) => p.npcId === r.npcId) &&
              !run.family?.children.some((c) => c.npcId === r.npcId),
          )
          .map((r) => {
            const npc = run.npcs.find((n) => n.id === r.npcId)!;
            return (
              <article className="person" key={r.npcId}>
                <div className="person-avatar">
                  <Heart size={20} aria-hidden="true" />
                </div>
                <div>
                  <span className="eyebrow">
                    {types[r.type]} ·{' '}
                    {npc.presence === 'unknown'
                      ? 'Chưa rõ thông tin'
                      : npc.presence === 'nonresident'
                        ? 'Không sống cùng'
                        : npc.alive
                          ? `${run.world.year - npc.birthYear} tuổi`
                          : 'Đã qua đời'}
                  </span>
                  <h3>{npc.name}</h3>
                  {!!npc.personality?.length && (
                    <p>{npc.personality.map((t) => PARENT_TRAITS[t]).join(', ')}</p>
                  )}
                  <p>
                    {r.strength >= 70
                      ? 'Gắn bó'
                      : r.strength >= 40
                        ? 'Còn những điều muốn hiểu nhau'
                        : 'Có khoảng cách'}{' '}
                    · {Math.round(r.strength)}/100
                  </p>
                  {r.history.slice(-2).map((h, i) => (
                    <p className="fine-print" key={i}>
                      {h}
                    </p>
                  ))}
                </div>
              </article>
            );
          })}
      </div>
    </section>
  );
}
