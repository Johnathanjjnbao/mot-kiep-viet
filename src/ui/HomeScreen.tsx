import { ArrowDown, ArrowRight, Feather, Sprout } from 'lucide-react';
import type { GameRun } from '../domain/model';
import { Scenery } from './Scenery';
export function HomeScreen({
  ready,
  run,
  onNew,
  onContinue,
  onHelp,
}: {
  ready: boolean;
  run: GameRun | null;
  onNew: () => void;
  onContinue: () => void;
  onHelp: () => void;
}) {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow hero-kicker">
            <span className="small-dash" />
            MỘT TRÒ CHƠI VỀ NHỮNG CUỘC ĐỜI
          </span>
          <h1>
            Nếu được sống
            <br />
            thêm một đời,
            <br />
            <em>bạn sẽ chọn gì?</em>
          </h1>
          <p className="hero-description">
            Sinh ra ở một miền quê. Lớn lên giữa một thời đại.
            <br className="desktop-break" /> Đi qua những ngã rẽ, để lại một câu chuyện
            <br className="desktop-break" /> chỉ riêng bạn mới có.
          </p>
          <div className="hero-actions">
            <button className="button primary" disabled={!ready} onClick={onNew}>
              <Sprout size={19} aria-hidden="true" />
              Bắt đầu một kiếp mới
              <ArrowRight size={19} aria-hidden="true" />
            </button>
            {run ? (
              <button className="text-button continue-button" onClick={onContinue}>
                Tiếp tục cuộc đời của {run.player.name}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button className="text-button" onClick={onHelp}>
                Lần đầu ghé qua? Đọc cách chơi
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="hero-meta">
            <span>01 NGƯỜI CHƠI</span>
            <span>03 THẾ HỆ</span>
            <span>VÔ VÀN NGÃ RẼ</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-topline">
            <span>VIỆT NAM · NHỮNG MÙA ĐỜI</span>
            <span>01 / 03</span>
          </div>
          <Scenery />
          <div className="art-caption">
            <span>Một nơi nào đó, một ngày bạn chào đời.</span>
            <Feather size={17} strokeWidth={1.3} aria-hidden="true" />
          </div>
          <span className="art-side-note">MỖI CUỘC ĐỜI LÀ MỘT BẢN THẢO DUY NHẤT</span>
        </div>
      </section>
      <section className="home-bottom">
        <div className="bottom-invitation">
          <ArrowDown size={22} strokeWidth={1.3} aria-hidden="true" />
          <p>
            Có những điều rất nhỏ,
            <br />
            <em>đi cùng ta cả một đời.</em>
          </p>
        </div>
        <div className="home-feature">
          <span className="feature-number">01</span>
          <div>
            <h2>Mỗi lần sinh, một khởi đầu</h2>
            <p>
              Gia đình, tính cách, quê nhà.
              <br />
              Bạn không chọn mọi điều đầu tiên.
            </p>
          </div>
        </div>
        <div className="home-feature">
          <span className="feature-number">02</span>
          <div>
            <h2>Mỗi lựa chọn, một dấu vết</h2>
            <p>
              Học hành, mưu sinh, thương nhớ.
              <br />
              Thời gian giữ lại điều bạn đã chọn.
            </p>
          </div>
        </div>
        <div className="home-feature">
          <span className="feature-number">03</span>
          <div>
            <h2>Một đời để nhìn lại</h2>
            <p>
              Chẳng có một đích đến chung.
              <br />
              Chỉ có câu chuyện của riêng mình.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
