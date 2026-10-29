import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Download,
  Feather,
  Heart,
  MapPin,
  Sprout,
  Wallet,
} from 'lucide-react';
import { lifeSummary, summaryCardSvg } from '../application/summary';
import type { GameRun } from '../domain/model';
import { CAREERS, REGIONS, ageOf, currentCareer } from '../content/world';
import { activeDefinition, choiceReason } from '../engine/engine';
import { CATEGORIES, STAT_NAMES, downloadFile, money } from './common';
import { Scenery } from './Scenery';
export function BirthIntro({ run, onBegin }: { run: GameRun; onBegin: () => void }) {
  const region = REGIONS.find((r) => r.id === run.player.region)!;
  return (
    <section className="birth-page">
      <div className="birth-picture">
        <Scenery />
        <div className="postcard-stamp">
          VIỆT NAM
          <br />
          <b>{run.player.birthYear}</b>
        </div>
      </div>
      <div className="birth-story">
        <span className="eyebrow">TRANG ĐẦU TIÊN · {run.player.birthYear}</span>
        <h1>
          Chào đời,
          <br />
          <em>{run.player.name}.</em>
        </h1>
        <div className="birth-location">
          <MapPin size={17} aria-hidden="true" />
          {region.name}
        </div>
        <p className="lead">{region.story}</p>
        <p>
          {run.household.background}. Cha Thành và mẹ Thu đón bạn vào một buổi sáng bình thường, mà
          với cả nhà lại chẳng bình thường chút nào.
        </p>
        <div className="birth-traits">
          <span className="badge">{run.player.traits[0]}</span>
          <span className="badge">Khoản để dành: {money(run.finance.cash)}</span>
        </div>
        <div className="birth-future">{run.world.eraName} · Câu chuyện gia đình hư cấu</div>
        <button className="button primary" onClick={onBegin}>
          Bắt đầu câu chuyện
          <ArrowRight size={18} aria-hidden="true" />
        </button>
        <p className="fine-print">Hạt giống: {run.seed}</p>
      </div>
    </section>
  );
}
export function Character({ run }: { run: GameRun }) {
  const job = currentCareer(run);
  return (
    <>
      <div className="character-head">
        <div className="avatar">
          <Sprout size={32} strokeWidth={1.1} aria-hidden="true" />
        </div>
        <div>
          <h2>{run.player.name}</h2>
          <p>
            {ageOf(run)} tuổi <span>·</span> Sinh năm {run.player.birthYear}
          </p>
        </div>
      </div>
      <p className="character-region">
        <MapPin size={13} aria-hidden="true" />
        {REGIONS.find((r) => r.id === run.player.region)!.short}
      </p>
      <span className="trait-tag">{run.player.traits[0]}</span>
      <details className="stats-details">
        <summary>
          Những điều làm nên bạn <ChevronRight size={14} aria-hidden="true" />
        </summary>
        <div className="stats-list">
          {Object.entries(STAT_NAMES).map(([key, label]) => (
            <div className={`stat stat-${key}`} key={key}>
              <div>
                <label htmlFor={`stat-${key}`}>{label}</label>
                <span>{Math.round(run.player.stats[key as keyof typeof STAT_NAMES])}</span>
              </div>
              <meter
                id={`stat-${key}`}
                min={0}
                max={100}
                value={run.player.stats[key as keyof typeof STAT_NAMES]}
              >
                {Math.round(run.player.stats[key as keyof typeof STAT_NAMES])}/100
              </meter>
            </div>
          ))}
        </div>
      </details>
      <div className="profile-facts">
        <div>
          <BriefcaseBusiness size={16} aria-hidden="true" />
          <span>
            Nghề hiện tại
            <strong>
              {job
                ? CAREERS.find((c) => c.id === job.id)!.name
                : ageOf(run) < 18
                  ? 'Đang lớn lên'
                  : ageOf(run) >= 65
                    ? 'Đã nghỉ hưu'
                    : run.player.education.some((e) => e.endMonth > run.month)
                      ? 'Đang theo học'
                      : 'Chưa có việc'}
            </strong>
          </span>
        </div>
        <div>
          <Wallet size={16} aria-hidden="true" />
          <span>
            Trong túi<strong>{money(run.finance.cash)}</strong>
          </span>
        </div>
        <div>
          <Heart size={16} aria-hidden="true" />
          <span>
            Mái nhà
            <strong>
              {run.household.housing === 'family'
                ? 'Cùng gia đình'
                : run.household.housing === 'rent'
                  ? 'Đang ở trọ'
                  : 'Nhà của mình'}
            </strong>
          </span>
        </div>
      </div>
    </>
  );
}
export function Story({
  run,
  onChoice,
  onAdvance,
}: {
  run: GameRun;
  onChoice: (eventId: string, choiceId: string) => void;
  onAdvance: () => void;
}) {
  const event = activeDefinition(run);
  return (
    <section className="story-card" key={event?.id ?? 'outcome'}>
      <div className="story-top">
        <span className="eyebrow">
          {event ? CATEGORIES[event.category] : 'MỘT LỰA CHỌN ĐÃ THÀNH KÝ ỨC'}
        </span>
        <span className="story-age">{ageOf(run)} tuổi</span>
      </div>
      <div className="story-ornament">
        <span />
        <Feather size={22} strokeWidth={1.1} aria-hidden="true" />
        <span />
      </div>
      <h2>{event?.title ?? 'Rồi đời sẽ kể tiếp.'}</h2>
      <p className="story-text">
        {event?.text ?? run.lastOutcome ?? 'Bạn đã sẵn sàng cho trang tiếp theo.'}
      </p>
      {event?.arc && (
        <div className="story-thread">
          Một câu chuyện dài <span>·</span>{' '}
          {event.arc === 'business'
            ? 'Tiệm nhỏ của hai người'
            : event.arc === 'family'
              ? 'Mái nhà qua mùa mưa'
              : 'Sau ca làm cuối'}
        </div>
      )}
      {event ? (
        <div className="choices">
          <p className="choice-prompt">Bạn sẽ chọn thế nào?</p>
          {event.choices.map((choice, i) => {
            const reason = choiceReason(run, choice);
            return (
              <button
                className="choice"
                data-testid="event-choice"
                disabled={Boolean(reason)}
                key={choice.id}
                onClick={() => onChoice(event.id, choice.id)}
              >
                <span className="choice-letter">{String.fromCharCode(65 + i)}</span>
                <span className="choice-copy">
                  <strong>{choice.text}</strong>
                  <small>
                    {choice.hint}
                    {reason ? ` · ${reason}` : ''}
                  </small>
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="consequence">
          <div className="outcome-seal">
            <Check size={23} strokeWidth={1.4} aria-hidden="true" />
          </div>
          <p>
            Nhật ký đã giữ lại điều bạn chọn.
            <br />
            Những hệ quả dài lâu vẫn đang chờ ở phía trước.
          </p>
          <button className="button primary" data-testid="advance-life" onClick={onAdvance}>
            Viết tiếp cuộc đời
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      <div className="story-footnote">
        {run.world.fictional
          ? 'Bối cảnh tương lai do trò chơi sáng tác.'
          : 'Mọi tình huống cá nhân là hư cấu.'}
      </div>
    </section>
  );
}
export function Summary({
  run,
  onNew,
  onJournal,
}: {
  run: GameRun;
  onNew: () => void;
  onJournal: () => void;
}) {
  const summary = lifeSummary(run);
  return (
    <div className="summary-page">
      <div className="summary-opening">
        <Feather size={34} strokeWidth={1} aria-hidden="true" />
        <span className="eyebrow">
          {run.ending === 'death' ? 'MỘT KIẾP KHÉP LẠI' : 'TRANG HỒI KÝ CUỐI'}
        </span>
        <h1>
          Một đời đã sống.
          <br />
          <em>Một câu chuyện ở lại.</em>
        </h1>
      </div>
      <article className="summary-card">
        <span className="eyebrow">HỒI KÝ CỦA</span>
        <h2>{run.player.name}</h2>
        <p className="summary-years">
          {run.player.birthYear} — {run.world.year} <span>·</span> {ageOf(run)} tuổi
        </p>
        <div className="summary-rule" />
        <p className="biography">{summary.biography}</p>
        <div className="summary-numbers">
          <div>
            <strong>{run.choices.length}</strong>
            <span>ngã rẽ đã chọn</span>
          </div>
          <div>
            <strong>{summary.careerYears}</strong>
            <span>năm mưu sinh</span>
          </div>
          <div>
            <strong>{money(summary.netWorth)}</strong>
            <span>tài sản ròng</span>
          </div>
        </div>
        <blockquote>“Mỗi điều bình thường, một lần thành ký ức.”</blockquote>
        <p className="fine-print">
          Tài sản: {money(run.finance.assets.reduce((n, a) => n + a.value, 0))} · Để dành:{' '}
          {money(run.finance.savings)} · Còn nợ: {money(run.finance.liability.principal)}
        </p>
      </article>
      <div className="summary-actions">
        <button
          className="button primary"
          onClick={() =>
            downloadFile(summaryCardSvg(run), 'mot-kiep-viet-hoi-ky.svg', 'image/svg+xml')
          }
        >
          <Download size={17} aria-hidden="true" />
          Tải thẻ kỷ niệm
        </button>
        <button className="button secondary" onClick={onJournal}>
          <BookOpen size={17} aria-hidden="true" />
          Đọc lại nhật ký
        </button>
        <button className="text-button" onClick={onNew}>
          Sống một kiếp khác
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="summary-memories">
        <section>
          <h2>Những ngã rẽ còn nhớ</h2>
          {summary.important.length ? (
            summary.important.map((c, i) => (
              <p key={i}>
                <b>{run.player.birthYear + Math.floor(c.month / 12)}</b> — {c.outcome}
              </p>
            ))
          ) : (
            <p>Mỗi lựa chọn nhỏ đã được ghi lại trong nhật ký.</p>
          )}
        </section>
        <section>
          <h2>Những chuyện để mỉm cười</h2>
          {summary.humor.length ? (
            summary.humor.slice(-4).map((j) => (
              <p key={j.id}>
                <b>{j.title}.</b> {j.text}
              </p>
            ))
          ) : (
            <p>Không có sự kiện hài hước được ghi nhận trong kiếp này.</p>
          )}
        </section>
      </div>
      <p className="fine-print center">
        Hồi ký được dựng từ những điều đã xảy ra. Các năm sau 2026 thuộc tương lai giả định của
        game.
      </p>
    </div>
  );
}
