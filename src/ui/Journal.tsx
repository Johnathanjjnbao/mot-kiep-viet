import { useState } from 'react';
import type { GameRun } from '../domain/model';
import { CATEGORIES } from './common';
import { PARENT_TRAITS } from '../domain/creator';
export function Journal({ run, compact = false }: { run: GameRun; compact?: boolean }) {
  const [filter, setFilter] = useState('all');
  const entries = compact
    ? run.journal.slice(-3).reverse()
    : run.journal.filter((j) => filter === 'all' || j.category === filter);
  return (
    <>
      <div className="section-heading">
        <span className="eyebrow">NHỮNG DẤU CHÂN</span>
        <h2>{compact ? 'Vừa thành ký ức' : 'Nhật ký một đời'}</h2>
      </div>
      {!compact && (
        <label className="journal-filter">
          Xem những chuyện
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tất cả ký ức</option>
            {Object.entries(CATEGORIES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
            <option value="life">Những cột mốc</option>
          </select>
        </label>
      )}
      <ol className={`journal ${compact ? 'journal-compact' : ''}`}>
        {entries.map((j) => (
          <li key={j.id}>
            <div className="journal-date">
              <span>{run.player.birthYear + Math.floor(j.month / 12)}</span>
              <span>{Math.floor(j.month / 12)} tuổi</span>
            </div>
            <div className="journal-content">
              <h3>{j.title}</h3>
              {j.choice && !compact && <p className="journal-choice">Bạn đã chọn: {j.choice}</p>}
              <p>{j.text}</p>
              {j.month === 0 && !compact && run.engineVersion !== '1.0.0' && (
                <p>
                  {run.setup.environment === 'urban' ? 'Môi trường đô thị' : 'Môi trường nông thôn'}
                  .{' '}
                  {run.npcs
                    .filter((n) => n.id === 'mother' || n.id === 'father')
                    .map(
                      (n) =>
                        `${n.name}: ${n.presence === 'unknown' ? 'chưa rõ thông tin' : (n.personality ?? []).map((t) => PARENT_TRAITS[t]).join(', ') || 'không chọn tính cách'}`,
                    )
                    .join('; ')}
                  .
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {!entries.length && <p className="muted">Chưa có ký ức thuộc nhóm này.</p>}
    </>
  );
}
