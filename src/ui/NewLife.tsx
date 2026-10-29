import { useState } from 'react';
import { ArrowLeft, ArrowRight, Dices, MapPin } from 'lucide-react';
import type { Cohort, GameRun, RegionId, RunSetup } from '../domain/model';
import { COHORTS, REGIONS } from '../content/world';
import { Scenery } from './Scenery';
export function NewLife({
  run,
  onStart,
  onBack,
  onSave,
}: {
  run: GameRun | null;
  onStart: (seed: string, setup?: RunSetup) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  const [custom, setCustom] = useState(false),
    [cohort, setCohort] = useState<Cohort>(1995),
    [region, setRegion] = useState<RegionId>('northern-village'),
    [seed, setSeed] = useState('');
  return (
    <div className="new-life-page">
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        Về trang đầu
      </button>
      <div className="new-life-grid">
        <div className="new-life-intro">
          <span className="eyebrow">LẬT MỘT TRANG TRẮNG</span>
          <h1>
            Mỗi đời bắt đầu
            <br />
            từ một <em>nơi nào đó.</em>
          </h1>
          <p>
            Ta không chọn được nơi mình sinh ra.
            <br />
            Nhưng lần này, bạn có thể thử.
          </p>
          <blockquote>“Một đời người, vạn ngã rẽ.”</blockquote>
          <div className="mini-scenery">
            <Scenery small />
          </div>
        </div>
        <form
          className="new-life-form"
          onSubmit={(e) => {
            e.preventDefault();
            onStart(seed, custom ? { cohort, region } : undefined);
          }}
        >
          <div className="segmented" role="group" aria-label="Cách bắt đầu">
            <button
              type="button"
              aria-pressed={!custom}
              className={!custom ? 'selected' : ''}
              onClick={() => setCustom(false)}
            >
              <Dices size={17} aria-hidden="true" />
              Để số phận chọn
            </button>
            <button
              type="button"
              aria-pressed={custom}
              className={custom ? 'selected' : ''}
              onClick={() => setCustom(true)}
            >
              Tự chọn bối cảnh
            </button>
          </div>
          {custom ? (
            <>
              <fieldset>
                <legend>Bạn sinh vào năm nào?</legend>
                <div className="cohort-options">
                  {COHORTS.map((y) => (
                    <label className={cohort === y ? 'chosen' : ''} key={y}>
                      <input
                        type="radio"
                        name="cohort"
                        value={y}
                        checked={cohort === y}
                        onChange={() => setCohort(y)}
                      />
                      <strong>{y}</strong>
                      <span>
                        {y === 1975
                          ? 'Lớn cùng Đổi Mới'
                          : y === 1995
                            ? 'Hai phía thiên niên kỷ'
                            : 'Tuổi trẻ thời kết nối'}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Mái nhà đầu tiên của bạn</legend>
                <div className="region-options">
                  {REGIONS.map((r) => (
                    <label key={r.id} className={region === r.id ? 'chosen' : ''}>
                      <input
                        type="radio"
                        name="region"
                        value={r.id}
                        checked={region === r.id}
                        onChange={() => setRegion(r.id)}
                      />
                      <span>
                        <b>{r.name}</b>
                        <small>{r.short}</small>
                      </span>
                      <MapPin size={18} aria-hidden="true" />
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          ) : (
            <div className="fate-note">
              <Dices size={40} strokeWidth={1} aria-hidden="true" />
              <h2>Một lần gieo, một kiếp người.</h2>
              <p>
                Năm sinh, quê nhà và gia cảnh sẽ được chọn ngẫu nhiên. Tính cách và những cơ hội đầu
                đời cũng mang theo một chút bất ngờ.
              </p>
              <div className="fate-years">
                1975 <span>·</span> 1995 <span>·</span> 2005
              </div>
            </div>
          )}
          <details className="seed-details">
            <summary>Một hạt giống để gặp lại cuộc đời này</summary>
            <label htmlFor="seed">Hạt giống (tùy chọn)</label>
            <input
              id="seed"
              maxLength={100}
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Để trống cho một khởi đầu bất ngờ"
            />
            <p className="fine-print">
              Cùng hạt giống, bối cảnh và quyết định sẽ cho cùng một cuộc đời trong phiên bản này.
            </p>
          </details>
          {run && (
            <div className="new-run-note">
              <p>
                Kiếp mới sẽ thay bản tự lưu của {run.player.name}. Bạn có thể giữ cuộc đời ấy trong
                một ô lưu trước.
              </p>
              <button type="button" className="text-button" onClick={onSave}>
                Mở các ô lưu
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          )}
          <button type="submit" className="button primary full-width">
            Gieo một cuộc đời
            <ArrowRight size={19} aria-hidden="true" />
          </button>
          <p className="fine-print center">Không cần đăng nhập. Mọi ký ức được giữ trên máy bạn.</p>
        </form>
      </div>
    </div>
  );
}
