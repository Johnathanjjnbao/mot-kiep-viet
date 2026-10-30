import { useState } from 'react';
import type { GameRun, RunAction } from '../domain/model';
import { childAge, familyEligible, PARENTING_LABELS, playerId } from '../engine/family';
import { parentingEvents } from '../content/parenting-events';
export function FamilyPanel({ run, act }: { run: GameRun; act: (a: RunAction) => void }) {
  const [topics, setTopics] = useState<Record<string, string>>({});
  const f = run.family;
  if (!f) return null;
  const name = (id: string) =>
    id === playerId(run) ? 'Bạn' : (run.npcs.find((n) => n.id === id)?.name ?? 'Người chăm sóc');
  return (
    <section className="social-panel" aria-labelledby="family-heading">
      <h2 id="family-heading">Những mùa con lớn.</h2>
      {f.nextBirth && (
        <p role="status">
          Gia đình đang chuẩn bị đón con vào khoảng năm{' '}
          {run.player.birthYear + Math.floor(f.nextBirth.dueMonth / 12)}.
        </p>
      )}
      {!f.children.length && (
        <p>
          Chuyện đón con bắt đầu từ một cuộc đối thoại có sự đồng ý của cả hai. Hiện chưa có người
          con được ghi nhận.
        </p>
      )}
      <div className="social-people">
        {f.children.map((c) => {
          const npc = run.npcs.find((n) => n.id === c.npcId)!,
            age = childAge(run, c);
          const options = parentingEvents.filter(
            (e) =>
              familyEligible(run, e.id, c.npcId) &&
              run.month - (f.encounters[e.id + ':' + c.npcId] ?? -999) >= 12 &&
              !f.queue.some((x) => x.templateId === e.id && x.childId === c.npcId),
          );
          const selected =
            options.find((e) => e.id === topics[c.npcId])?.id ?? options[0]?.id ?? '';
          const temperament = {
            curious: 'Hay tò mò',
            cautious: 'Thận trọng',
            intense: 'Cảm xúc mạnh',
            easygoing: 'Dễ thích nghi',
          }[c.temperament];
          const interest = {
            academic: 'Học thuật',
            practical: 'Thực hành',
            creative: 'Sáng tạo',
            technology: 'Công nghệ',
          }[c.interest];
          return (
            <article
              className="social-person family-child"
              key={c.npcId}
              data-family-child={c.npcId}
            >
              <span className="eyebrow">
                {age} tuổi · {npc.alive ? '' : 'Đã qua đời · '}
                {age < 6
                  ? 'Tuổi nhỏ'
                  : age < 13
                    ? 'Tuổi đi học'
                    : age < 18
                      ? 'Tuổi thiếu niên'
                      : 'Trưởng thành'}
              </span>
              <h3>{npc.name}</h3>
              <p>
                {temperament} · quan tâm {interest.toLowerCase()}.
              </p>
              <p>{c.education}</p>
              <p>{c.occupation ?? c.aspiration}</p>
              {c.parentPreference && (
                <p className="fine-print">
                  Gia đình từng mong hướng học thuật; con vẫn giữ quyền chọn.
                </p>
              )}
              <dl className="social-metrics">
                <div>
                  <dt>Gắn bó</dt>
                  <dd>{Math.round(c.bond)}</dd>
                </div>
                <div>
                  <dt>An tâm</dt>
                  <dd>{Math.round(c.wellbeing)}</dd>
                </div>
                <div>
                  <dt>Tự tin</dt>
                  <dd>{Math.round(c.tendencies.confidence)}</dd>
                </div>
              </dl>
              <p className="fine-print">
                Cha mẹ được ghi nhận: {c.parents.map(name).join(', ')}.{' '}
                {c.custody === 'independent'
                  ? 'Đang sống độc lập.'
                  : `Người chăm sóc: ${c.caregivers.map(name).join(', ')}.`}{' '}
                {c.visitingParents.length
                  ? `Giữ liên hệ: ${c.visitingParents.map(name).join(', ')}.`
                  : ''}
              </p>
              {!!options.length && (
                <>
                  <label>
                    Chuyện muốn nói với {npc.name}
                    <select
                      value={selected}
                      onChange={(e) => setTopics({ ...topics, [c.npcId]: e.target.value })}
                    >
                      {options.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="button secondary small"
                    onClick={() =>
                      act({
                        type: 'family-talk',
                        templateId: selected,
                        childId: c.npcId,
                        expected: run.actions.length,
                      })
                    }
                  >
                    Trò chuyện với {npc.name}
                  </button>
                </>
              )}
              <details>
                <summary>Những năm cùng lớn ({c.memories.length})</summary>
                <p className="fine-print">
                  {Object.entries(c.patterns)
                    .map(
                      ([style, count]) =>
                        `${PARENTING_LABELS[style as keyof typeof PARENTING_LABELS]} ${count}`,
                    )
                    .join(' · ')}
                </p>
                {c.memories.slice(-20).map((m, i) => (
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
