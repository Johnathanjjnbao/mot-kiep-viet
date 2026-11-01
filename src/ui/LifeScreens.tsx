import { STORY_ARCS } from '../content/arcs';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Download,
  Feather,
  MapPin,
} from 'lucide-react';
import { lifeSummary, summaryCardSvg } from '../application/summary';
import type { GameRun } from '../domain/model';
import { CAREERS, REGIONS, ageOf, currentCareer } from '../content/world';
import { activeDefinition, choiceReason } from '../engine/engine';
import { CATEGORIES, STAT_NAMES, downloadFile, money } from './common';
import { birthplaceOf, familyText } from '../domain/creator';
import { Scenery } from './Scenery';
import { Avatar } from './Avatar';
import { useLayoutEffect, useRef } from 'react';
import { decisionKey, recentResults } from '../application/story-flow';
export function BirthIntro({ run, onBegin }: { run: GameRun; onBegin: () => void }) {
  const region = REGIONS.find((r) => r.id === run.player.region)!;
  return (
    <section className="birth-page">
      <div className="birth-picture">
        <Scenery />
        <div className="birth-avatar">
          <Avatar run={run} />
        </div>
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
          {birthplaceOf(run)}
        </div>
        <p className="lead">
          {region.id === 'southern-city'
            ? 'Một con hẻm, giàn hoa giấy và những tiếng gọi nhau buổi sáng.'
            : region.id === 'northern-village'
              ? 'Sau mái nhà là khoảng vườn, xa hơn là cánh đồng.'
              : 'Gió biển đi qua khe cửa, ngoài sân là một khoảng trời rộng.'}
        </p>
        <p>
          {run.household.background}. {familyText(run)}. Người chăm sóc đón bạn vào một buổi sáng
          bình thường, mà với họ lại chẳng bình thường chút nào.
        </p>
        <div className="birth-traits">
          <span className="badge">{run.player.traits[0]}</span>
          <span className="badge">Khoản để dành: {money(run.finance.cash, run)}</span>
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
  const occupation = job
    ? CAREERS.find((c) => c.id === job.id)!.name
    : ageOf(run) < 18
      ? 'Đang lớn lên'
      : ageOf(run) >= 65
        ? 'Đã nghỉ hưu'
        : run.player.education.some((e) => e.endMonth > run.month)
          ? 'Đang theo học'
          : 'Chưa có việc';
  return (
    <div className="character-hud" data-testid="character-hud">
      <div className="hud-illustration">
        <Avatar run={run} />
      </div>
      <div className="character-head">
        <div className="hud-mini-avatar">
          <Avatar run={run} portrait />
        </div>
        <div>
          <h2>{run.player.name}</h2>
          <p>
            <span data-testid="hud-age">{ageOf(run)} tuổi</span> ·{' '}
            <span data-testid="hud-year">{run.world.year}</span>
            <span className="hud-birth"> · Sinh năm {run.player.birthYear}</span>
          </p>
        </div>
        <div className="hud-cash">
          <span>Trong túi</span>
          <strong data-testid="hud-cash">{money(run.finance.cash, run)}</strong>
        </div>
      </div>
      <dl className="hud-stats" aria-label="Chỉ số nhân vật">
        {Object.entries(STAT_NAMES).map(([key, label]) => (
          <div key={key} data-stat={key}>
            <dt>{label}</dt>
            <dd data-testid={`hud-${key}`}>
              {Math.round(run.player.stats[key as keyof typeof STAT_NAMES])}
              <span className="sr-only">
                {' '}
                trên 100{key === 'stress' ? ', thấp hơn là nhẹ nhõm hơn' : ''}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="hud-occupation">
        <BriefcaseBusiness size={14} aria-hidden="true" /> {occupation}
      </p>
      <p className="hud-place">
        <MapPin size={13} aria-hidden="true" />
        {birthplaceOf(run)}
      </p>
    </div>
  );
}
export function Story({
  run,
  onChoice,
  onAdvance,
}: {
  run: GameRun;
  onChoice: (eventId: string, choiceId: string, token: string) => void;
  onAdvance: () => void;
}) {
  const event = activeDefinition(run);
  const token = decisionKey(run);
  const heading = useRef<HTMLHeadingElement>(null);
  const card = useRef<HTMLElement>(null);
  const decisions = useRef<HTMLDivElement>(null);
  const touchInput = useRef(false),
    lastTouchDecision = useRef(-Infinity);
  const results = recentResults(run);
  useLayoutEffect(() => {
    const place = () => {
      const section = card.current;
      if (!section) return;
      const grid = section.closest('.game-grid');
      if (grid)
        window.scrollBy({ top: grid.getBoundingClientRect().top - 12, behavior: 'instant' });
      const list = decisions.current;
      if (list) {
        const available = Math.max(64, window.innerHeight - list.getBoundingClientRect().top - 6);
        list.style.maxHeight = `${available}px`;
      }
    };
    heading.current?.focus({ preventScroll: true });
    if (decisions.current) decisions.current.scrollTop = 0;
    place();
    const observer = new ResizeObserver(place);
    const narrative = card.current?.querySelector('.story-narrative');
    const hud = card.current?.closest('.game-grid')?.querySelector('.profile');
    if (narrative) observer.observe(narrative);
    if (hud) observer.observe(hud);
    window.addEventListener('resize', place);
    // Font loading/orientation/large-text changes must not leave a stale viewport budget.
    void document.fonts.ready.then(place);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [token]);
  return (
    <section
      className="story-card"
      ref={card}
      aria-labelledby="event-heading"
      onDoubleClick={() => heading.current?.focus({ preventScroll: true })}
    >
      <div className="story-narrative">
        <div className="story-top">
          <span className="eyebrow">
            {event ? CATEGORIES[event.category] : 'MỘT LỰA CHỌN ĐÃ THÀNH KÝ ỨC'}
          </span>
          <span className="story-age">{ageOf(run)} tuổi</span>
        </div>
        <h2 id="event-heading" ref={heading} tabIndex={-1}>
          {event?.title ?? 'Rồi đời sẽ kể tiếp.'}
        </h2>
        <p className="story-text">
          {event?.text ?? run.lastOutcome ?? 'Bạn đã sẵn sàng cho trang tiếp theo.'}
        </p>
        {event?.arc && (
          <div className="story-thread">
            Một câu chuyện dài <span>·</span>{' '}
            {STORY_ARCS.find((a) => a.id === event.arc)?.title ?? 'Những năm tháng đi cùng nhau'}
          </div>
        )}
      </div>
      {event ? (
        <div className="choices">
          <p className="choice-prompt">Bạn sẽ chọn thế nào?</p>
          <div
            className="decision-list"
            ref={decisions}
            role="group"
            aria-label="Lựa chọn của bạn"
            tabIndex={0}
          >
            {event.choices
              .filter((c) => !choiceReason(run, c))
              .map((choice, i) => {
                const reason = choiceReason(run, choice);
                return (
                  <button
                    className="choice"
                    data-testid="event-choice"
                    data-choice-id={choice.id}
                    data-event-id={event.id}
                    disabled={Boolean(reason)}
                    key={i}
                    onPointerDown={(e) => {
                      touchInput.current = e.pointerType === 'touch';
                    }}
                    onClick={(e) => {
                      // Touch click.detail may stay 1 across two taps. Guard only
                      // the brief gesture boundary, with no loading delay or timer.
                      if (
                        e.detail > 1 ||
                        (e.detail !== 0 &&
                          touchInput.current &&
                          e.timeStamp - lastTouchDecision.current < 300)
                      ) {
                        heading.current?.focus({ preventScroll: true });
                        return;
                      }
                      if (e.detail !== 0 && touchInput.current)
                        lastTouchDecision.current = e.timeStamp;
                      onChoice(event.id, choice.id, token);
                    }}
                    onKeyDown={(e) => {
                      if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
                    }}
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
      <div className="recent-outcome" role="status" aria-live="polite" aria-atomic="true">
        {results.length > 0 && (
          <p>
            <strong>Vừa xảy ra:</strong> {results[0].text}
          </p>
        )}
      </div>
      {results.length > 1 && (
        <details className="recent-details">
          <summary>Những điều diễn ra trước cảnh này ({results.length - 1})</summary>
          <ol>
            {results.slice(1).map((entry) => (
              <li key={entry.id}>
                <strong>
                  {run.player.birthYear + Math.floor(entry.month / 12)} · {entry.title}.
                </strong>{' '}
                {entry.text}
              </li>
            ))}
          </ol>
        </details>
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
        <div className="memoir-avatar">
          <Avatar run={run} />
        </div>
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
            <strong>{money(summary.netWorth, run)}</strong>
            <span>tài sản ròng</span>
          </div>
        </div>
        <blockquote>“Mỗi điều bình thường, một lần thành ký ức.”</blockquote>
        <p className="fine-print">
          Tài sản:{' '}
          {money(
            run.finance.assets.reduce((n, a) => n + a.value, 0),
            run,
          )}{' '}
          · Để dành: {money(run.finance.savings, run)} · Còn nợ:{' '}
          {money(run.finance.liability.principal, run)}
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
