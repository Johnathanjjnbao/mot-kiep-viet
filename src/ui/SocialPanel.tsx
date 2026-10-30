import { useState } from 'react';
import type { GameRun, RunAction } from '../domain/model';
import { romanceEvents } from '../content/romance-events';
import { socialEligible, SOCIAL_LABELS } from '../engine/social';
export function SocialPanel({ run, act }: { run: GameRun; act: (a: RunAction) => void }) {
  const [topics, setTopics] = useState<Record<string, string>>({});
  if (!run.social) return null;
  const s = run.social;
  return (
    <section className="social-panel" aria-labelledby="social-heading">
      <span className="eyebrow">NHỮNG LỜI CHƯA NÓI</span>
      <h2 id="social-heading">Mỗi người, một câu chuyện.</h2>
      <p>
        Thấu cảm {Math.round(s.empathy)}/100 · Điều hòa cảm xúc {Math.round(s.regulation)}/100. Hai
        khuynh hướng này phát triển từ cách bạn lắng nghe và tôn trọng ranh giới; không phải điểm
        bảo đảm được yêu.
      </p>
      {run.month < 216 && (
        <p>Những cuộc đối thoại tình cảm mở khi bạn và người ấy đều trưởng thành.</p>
      )}
      <div className="social-people">
        {s.people.map((p) => {
          const npc = run.npcs.find((n) => n.id === p.npcId)!;
          const options = romanceEvents.filter((e) => socialEligible(run, e.id, p.npcId, true));
          const selected =
            options.find((e) => e.id === topics[p.npcId])?.id ?? options[0]?.id ?? '';
          return (
            <article className="social-person" key={p.npcId} data-social-person={p.npcId}>
              <span className="eyebrow">
                {npc.alive ? `${run.world.year - npc.birthYear} tuổi` : 'Đã qua đời'} ·{' '}
                {SOCIAL_LABELS[p.status]}
              </span>
              <h3>{npc.name}</h3>
              <p>
                {p.personality.join(', ')} · coi trọng {p.values.join(', ').toLowerCase()}.
              </p>
              <p>{p.interests.join(', ')}.</p>
              <dl className="social-metrics">
                <div>
                  <dt>Tin cậy</dt>
                  <dd>{Math.round(p.trust)}</dd>
                </div>
                <div>
                  <dt>Gắn bó</dt>
                  <dd>{Math.round(p.affection)}</dd>
                </div>
                <div>
                  <dt>Hợp ý</dt>
                  <dd>{Math.round(p.compatibility)}</dd>
                </div>
              </dl>
              <p className="fine-print" data-interest={p.interest}>
                {!p.known
                  ? 'Chưa có cuộc đối thoại riêng.'
                  : p.interest === 'crush'
                    ? 'Có cảm tình riêng với bạn.'
                    : p.interest === 'admiration'
                      ? 'Có sự quý mến.'
                      : 'Tình cảm chưa được xác lập.'}{' '}
                Cảm tình của người này độc lập với những người khác.
              </p>
              {!!options.length && (
                <>
                  <label>
                    Chuyện muốn nói với {npc.name}
                    <select
                      value={selected}
                      onChange={(e) => setTopics({ ...topics, [p.npcId]: e.target.value })}
                    >
                      {options.map((e) => (
                        <option value={e.id} key={e.id}>
                          {e.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="button secondary small"
                    disabled={!!run.family?.focus}
                    onClick={() =>
                      act({
                        type: 'social',
                        templateId: selected,
                        npcId: p.npcId,
                        expected: run.actions.length,
                      })
                    }
                  >
                    Mở cuộc trò chuyện với {npc.name}
                  </button>
                </>
              )}
              <details>
                <summary>Ký ức chung ({p.memories.length})</summary>
                {p.memories.slice(-20).map((m, i) => (
                  <p className="fine-print" key={i}>
                    {run.player.birthYear + Math.floor(m.month / 12)} · {m.text}
                  </p>
                ))}
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
