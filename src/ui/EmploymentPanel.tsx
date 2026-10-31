import type { GameRun, RunAction } from '../domain/model';
import { CAREERS, currentCareer } from '../content/world';
import { temporaryReason, trainingReason } from '../engine/employment';
export function EmploymentPanel({ run, act }: { run: GameRun; act: (a: RunAction) => void }) {
  const state = run.employment;
  if (!state) return null;
  const job = currentCareer(run),
    open = state.periods.at(-1);
  const months = open?.endMonth === null ? run.month - open.startMonth : 0;
  const locked =
    !!(run.academics?.focus || run.social?.focus || run.family?.focus) || run.status !== 'playing';
  const temporary = temporaryReason(run),
    training = trainingReason(run);
  return (
    <section className="academic-panel employment-panel" aria-label="Tìm việc và chuyển hướng">
      <h3>{job ? 'Công việc và chặng tiếp theo' : 'Tìm một hướng mưu sinh'}</h3>
      <p>
        {job
          ? 'Bạn có thể ứng tuyển nơi khác khi vẫn đang làm. Hồ sơ bị từ chối sẽ giữ nguyên việc hiện tại.'
          : run.month < 216
            ? 'Từ 18 tuổi, bạn có thể tìm việc, học thêm hoặc chọn một ca làm tạm.'
            : open?.endMonth === null
              ? `Bạn đã có ${months} tháng liên tiếp chưa có việc. Chi phí vẫn được ghi theo tháng; còn những hướng có thể thử.`
              : 'Bạn đang học hoặc đã qua chặng tìm việc. Khi hoàn cảnh phù hợp, hồ sơ có thể mở lại.'}
      </p>
      {!!state.applications.length && (
        <p className="academic-result" data-testid="job-result" role="status">
          Hồ sơ gần nhất: {CAREERS.find((j) => j.id === state.applications.at(-1)!.career)!.name}.{' '}
          {state.applications.at(-1)!.result === 'accepted'
            ? 'Đã được nhận.'
            : 'Chưa được nhận; có thể thử nơi khác hoặc nộp lại cùng nghề sau 6 tháng.'}
        </p>
      )}
      <div className="academic-actions">
        <button
          type="button"
          className="button secondary"
          disabled={locked || !!temporary}
          onClick={() => act({ type: 'manage', action: 'temporary-job' })}
        >
          Nhờ giới thiệu việc tạm
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={locked || !!training}
          onClick={() => act({ type: 'manage', action: 'train-job' })}
        >
          Học kỹ năng · 20 đSM
        </button>
      </div>
      <p className="fine-print">
        {temporary ??
          'Điểm hỗ trợ có ca lao động phổ thông sáu tháng. Đây là đường phục hồi của mô phỏng; lương chỉ tính khi đang làm.'}
      </p>
      <p className="fine-print">
        {training ?? 'Lớp ngắn hạn rèn kỹ năng, chưa cấp bằng và không bảo đảm tuyển dụng.'}
      </p>
      {!!state.applications.length && (
        <details className="academic-history">
          <summary>Hồ sơ và những khoảng chưa có việc</summary>
          <ul>
            {state.applications.map((a) => (
              <li key={a.id}>
                {run.player.birthYear + Math.floor(a.month / 12)} ·{' '}
                {CAREERS.find((j) => j.id === a.career)!.name}:{' '}
                {a.result === 'accepted' ? 'Được nhận' : 'Chưa được nhận'}
                {a.source === 'support' ? ' qua điểm hỗ trợ việc tạm' : ''}
              </li>
            ))}
          </ul>
          <ul>
            {state.periods.map((p, i) => (
              <li key={i}>
                Chưa có việc từ {run.player.birthYear + Math.floor(p.startMonth / 12)}:{' '}
                {(p.endMonth ?? run.month) - p.startMonth} tháng
                {p.endMonth === null ? ' · đang tiếp diễn' : ''}
              </li>
            ))}
          </ul>
          <ul>
            {run.player.careers.map((c, i) => (
              <li key={i}>
                {CAREERS.find((j) => j.id === c.id)!.name} · {c.experience} tháng kinh nghiệm
                {c.field === 'outside'
                  ? ' · ngoài hướng ngành đã học'
                  : c.field === 'related'
                    ? ' · có liên hệ ngành học'
                    : ''}
                {c.ending
                  ? ` · ${{ resigned: 'chủ động rời việc', switched: 'chuyển công việc', layoff: 'cắt giảm vị trí', 'contract-ended': 'hết hợp đồng', retired: 'nghỉ hưu', story: 'khép lại chặng việc' }[c.ending]}`
                  : ''}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
