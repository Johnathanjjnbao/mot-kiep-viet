import { useState } from 'react';
import type { GameRun, RunAction } from '../domain/model';
import { PROGRAMS, programById } from '../content/programs';
import { admissionReason, currentStudy, studyCosts } from '../engine/academics';
import { CAREERS } from '../content/world';
import { money, STAT_NAMES } from './common';

export function AcademicPanel({ run, act }: { run: GameRun; act: (a: RunAction) => void }) {
  const [query, setQuery] = useState('');
  const state = run.academics;
  if (!state) return null;
  const study = currentStudy(run),
    program = study && programById(study.programId);
  const locked =
    !!(state.focus || run.social?.focus || run.family?.focus) || run.status !== 'playing';
  const operate = (operation: 'pause' | 'resume' | 'dropout') =>
    act({ type: 'academic', operation, expected: run.actions.length });
  return (
    <section className="academic-panel" aria-label="Học tập">
      <h3>Học tập và những hướng đi</h3>
      <p>
        Được nhận là điểm bắt đầu. Văn bằng chỉ được ghi khi bạn hoàn thành đủ các năm học đạt yêu
        cầu.
      </p>
      {!!state.applications.length && (
        <p className="academic-result" role="status">
          Hồ sơ gần nhất: {programById(state.applications.at(-1)!.programId)!.name}.{' '}
          {state.applications.at(-1)!.result === 'accepted'
            ? 'Bạn đã được nhận.'
            : 'Chưa được nhận; có thể chuẩn bị thêm hoặc thử ngành khác.'}
        </p>
      )}
      {study && program && (
        <article className="current-study" data-testid="current-study">
          <h4>{program.name}</h4>
          <p>
            {study.status === 'paused' ? 'Đang bảo lưu' : 'Đang học'} · Đã đạt{' '}
            {study.completedYears}/{program.years} năm{study.internship ? ' · Có thực tập' : ''}
          </p>
          <p>
            {study.status === 'paused'
              ? 'Bạn có thể đi làm để chuẩn bị học phí, rồi trở lại phần còn lại.'
              : `Kỳ đánh giá tiếp theo: năm ${run.player.birthYear + Math.floor(study.nextTermMonth / 12)}. Tiếp tục câu chuyện để đi tới mốc học tập.`}
          </p>
          {run.setup.lifeRules === 'annual-v1' && study.status === 'paused' && (
            <p>
              Giữ nguyên tiến độ và học phí đã đóng. Không thu học phí mới khi bảo lưu; có thể trở
              lại sau ít nhất 6 tháng.
            </p>
          )}
          <div className="academic-actions">
            <button
              type="button"
              className="text-button"
              disabled={
                locked ||
                (run.setup.lifeRules === 'annual-v1' &&
                  study.status === 'paused' &&
                  run.month - study.pausedMonth! < 6)
              }
              onClick={() => operate(study.status === 'paused' ? 'resume' : 'pause')}
            >
              {study.status === 'paused' ? 'Trở lại học' : 'Bảo lưu'}
            </button>
            <button
              type="button"
              className="text-button"
              disabled={locked}
              onClick={() => operate('dropout')}
            >
              Nghỉ chương trình
            </button>
          </div>
        </article>
      )}
      {!!state.qualifications.length && (
        <div data-testid="qualifications">
          <h4>Văn bằng đã đạt</h4>
          <ul>
            {state.qualifications.map((q) => (
              <li key={q.studyId}>
                {programById(q.programId)!.name} ·{' '}
                {run.player.birthYear + Math.floor(q.awardedMonth / 12)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!state.applications.length && (
        <details className="academic-history">
          <summary>Hồ sơ và quá trình đã học</summary>
          <ul>
            {state.applications.map((a) => (
              <li key={a.id}>
                {run.player.birthYear + Math.floor(a.month / 12)} · {programById(a.programId)!.name}
                : {a.result === 'accepted' ? 'Được nhận' : 'Chưa được nhận'}
              </li>
            ))}
          </ul>
          <ul>
            {state.studies
              .filter((s) => !['studying', 'paused'].includes(s.status))
              .map((s) => (
                <li key={s.id}>
                  {programById(s.programId)!.name}:{' '}
                  {
                    {
                      dropped: 'Đã nghỉ học',
                      switched: 'Đã chuyển ngành',
                      graduated: 'Đã tốt nghiệp',
                      failed: 'Chưa hoàn thành',
                    }[s.status as 'dropped' | 'switched' | 'graduated' | 'failed']
                  }{' '}
                  ({s.completedYears} năm đạt)
                </li>
              ))}
          </ul>
        </details>
      )}
      <details
        className="academic-catalog"
        open={!!run.flags['academic-interest'] && !study && !state.qualifications.length}
      >
        <summary>{study ? 'Tìm ngành để chuyển' : 'Xem 12 ngành đại học'}</summary>
        <label htmlFor="program-query">Tìm ngành</label>
        <input
          id="program-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ví dụ: Công nghệ thông tin"
        />
        <p className="fine-print">
          Học phí dùng đSM trong game. Học bổng và hỗ trợ được xét lại từng năm, không phải cam kết
          tuyển sinh hay mức giá ngoài đời.
        </p>
        <div className="career-grid">
          {PROGRAMS.filter((p) =>
            p.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')),
          ).map((p) => {
            const same = study?.programId === p.id,
              reason = admissionReason(run, p.id, !!study),
              cost = studyCosts(run, p.id);
            return (
              <article key={p.id} className="career-option" data-program={p.id}>
                <h4>{p.name}</h4>
                <p>{p.description}</p>
                <dl>
                  <dt>Thời gian</dt>
                  <dd>{p.years} năm đạt yêu cầu</dd>
                  <dt>Học phí</dt>
                  <dd>{money(p.tuition)}/năm</dd>
                  <dt>Đầu vào</dt>
                  <dd>
                    {p.knowledge} tri thức, từ năm {p.from} trong mô phỏng
                  </dd>
                  <dt>Hướng nghề</dt>
                  <dd>
                    {p.careers.map((id) => CAREERS.find((c) => c.id === id)!.name).join(', ')}
                  </dd>
                  <dt>Rèn luyện</dt>
                  <dd>{p.skills.map((skill) => STAT_NAMES[skill]).join(', ')}</dd>
                </dl>
                <p className="fine-print">
                  Chuẩn bị năm đầu: {money(cost.required)} sau học bổng {money(cost.scholarship)} và
                  hỗ trợ {money(cost.support)} đang đủ điều kiện.
                </p>
                <p className="fine-print">
                  {same
                    ? 'Đây là ngành bạn đang theo học.'
                    : (reason ?? 'Có thể nộp hồ sơ; kết quả tuyển sinh chưa được bảo đảm.')}
                </p>
                <button
                  type="button"
                  className="button secondary"
                  disabled={locked || !!reason || same}
                  onClick={() =>
                    act({
                      type: 'academic',
                      operation: study ? 'switch' : 'apply',
                      program: p.id,
                      expected: run.actions.length,
                    })
                  }
                >
                  {study ? 'Nộp hồ sơ chuyển ngành' : 'Nộp hồ sơ'}
                </button>
              </article>
            );
          })}
        </div>
      </details>
    </section>
  );
}
