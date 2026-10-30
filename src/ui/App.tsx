import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Feather,
  Save,
  Settings,
  Sprout,
  Users,
  Wallet,
} from 'lucide-react';
import { useGameSession } from '../application/useGameSession';
import { ERAS, ageOf } from '../content/world';
import { Modal } from './common';
import { HomeScreen } from './HomeScreen';
import { NewLife } from './NewLife';
import { BirthIntro, Character, Story, Summary } from './LifeScreens';
import { SaveManager } from './SaveManager';
import { LifeHistory } from './LifeHistory';
import { LegacyLife } from './LegacyLife';
import { Journal } from './Journal';
import { CareerPanel, FinancePanel, PeoplePanel } from './Panels';
import { useAccount } from '../application/useAccount';
import { AccountPanel } from './AccountPanel';
import { guestRepository } from '../persistence/repository';
type Screen = 'home' | 'new' | 'play' | 'journal' | 'history';
type GameTab = 'story' | 'career' | 'finance' | 'people';
type Dialog = 'help' | 'settings' | 'saves' | 'account' | null;
function readSetting(key: string) {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}
export function App() {
  const auth = useAccount();
  if (auth.loading)
    return (
      <main className="account-loading" role="status">
        Đang mở dữ liệu của bạn…
      </main>
    );
  return <GameApp key={auth.account?.userId ?? 'guest'} auth={auth} />;
}
function GameApp({ auth }: { auth: ReturnType<typeof useAccount> }) {
  const repository = auth.account ?? guestRepository;
  const session = useGameSession(repository),
    { run, act } = session;
  const [screen, setScreen] = useState<Screen>('home'),
    [dialog, setDialog] = useState<Dialog>(null),
    [tab, setTab] = useState<GameTab>('story');
  const [largeText, setLargeText] = useState(() => readSetting('mkv-large-text')),
    [still, setStill] = useState(() => readSetting('mkv-still'));
  const focusRef = useRef<HTMLElement>(null);
  useEffect(() => {
    document.documentElement.dataset.large = String(largeText);
    document.documentElement.dataset.still = String(still);
    try {
      localStorage.setItem('mkv-large-text', String(largeText));
      localStorage.setItem('mkv-still', String(still));
    } catch {
      /* Optional settings storage. */
    }
  }, [largeText, still]);
  useEffect(() => {
    if (screen === 'play' && tab === 'story' && run?.status === 'playing') return;
    focusRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen, tab, run?.status]);
  const resume = () => {
    setTab('story');
    setScreen('play');
  };
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Đến nội dung chính
      </a>
      <header className="site-header">
        <button className="wordmark" title="Về trang đầu" onClick={() => setScreen('home')}>
          <span className="brand-symbol">
            <Sprout size={25} strokeWidth={1.3} aria-hidden="true" />
          </span>
          <span>
            một kiếp việt<span className="brand-sub">MỘT ĐỜI NGƯỜI, VẠN NGÃ RẼ</span>
          </span>
        </button>
        <nav aria-label="Điều hướng chính">
          <button
            className={screen === 'home' ? 'nav-active' : ''}
            onClick={() => setScreen('home')}
          >
            Trang đầu
          </button>
          <button
            className={screen === 'play' ? 'nav-active' : ''}
            disabled={!run}
            onClick={resume}
          >
            Cuộc đời
          </button>
          <button
            className={screen === 'journal' ? 'nav-active' : ''}
            disabled={!run}
            onClick={() => setScreen('journal')}
          >
            <BookOpen size={16} aria-hidden="true" />
            <span>Nhật ký</span>
          </button>
          <button
            aria-current={screen === 'history' ? 'page' : undefined}
            onClick={() => setScreen('history')}
          >
            Lịch sử cuộc đời
          </button>
        </nav>
        <div className="header-actions">
          <button
            className="account-trigger"
            onClick={() => setDialog('account')}
            title={auth.account ? 'Tài khoản của tôi' : 'Đăng nhập'}
            aria-label={auth.account ? 'Tài khoản của tôi' : 'Đăng nhập'}
          >
            <Users size={18} aria-hidden="true" />
            <span>{auth.account ? 'Tài khoản của tôi' : 'Đăng nhập'}</span>
          </button>
          <button
            className="icon-button"
            aria-label="Lưu và tải game"
            onClick={() => setDialog('saves')}
          >
            <Save size={19} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            aria-label="Cài đặt"
            onClick={() => setDialog('settings')}
          >
            <Settings size={19} aria-hidden="true" />
          </button>
        </div>
      </header>
      <main id="main-content" ref={focusRef} tabIndex={-1}>
        {screen === 'home' && (
          <>
            {!auth.account && (
              <div className="guest-entry">
                <button
                  className="text-button"
                  disabled={!session.ready}
                  onClick={() => setScreen('new')}
                >
                  Chơi không đăng nhập
                </button>
              </div>
            )}
            <HomeScreen
              ready={session.ready}
              run={run}
              onNew={() => setScreen('new')}
              onContinue={resume}
              onHelp={() => setDialog('help')}
            />
          </>
        )}
        {screen === 'new' && (
          <NewLife
            run={run}
            onBack={() => setScreen('home')}
            onSave={() => setDialog('saves')}
            onStart={(seed, setup) => {
              session.start(seed, setup);
              setTab('story');
              setScreen('play');
            }}
          />
        )}
        {screen === 'history' && (
          <LifeHistory
            key={auth.account?.userId ?? 'guest'}
            repository={repository}
            run={run}
            identity={session.identity}
            onNew={() => setScreen('new')}
          />
        )}
        {screen === 'play' &&
          run &&
          (run.engineVersion === '1.0.0' ? (
            <LegacyLife run={run} onNew={() => setScreen('new')} />
          ) : run.status === 'intro' ? (
            <BirthIntro run={run} onBegin={() => act({ type: 'advance' })} />
          ) : run.status === 'ended' ? (
            <Summary
              run={run}
              onNew={() => setScreen('new')}
              onJournal={() => setScreen('journal')}
            />
          ) : (
            <div className="game-shell">
              <div className="chapter-bar">
                <div>
                  <span className="eyebrow">
                    CHƯƠNG{' '}
                    {ageOf(run) < 18
                      ? 'I · NHỮNG NGÀY LỚN LÊN'
                      : ageOf(run) < 40
                        ? 'II · ĐI TÌM MỘT LỐI'
                        : ageOf(run) < 60
                          ? 'III · ĐỜI THÀNH CÂU CHUYỆN'
                          : 'IV · NHỮNG ĐIỀU Ở LẠI'}
                  </span>
                  <h1>
                    {ageOf(run) < 18
                      ? 'Từ những điều bé nhỏ.'
                      : ageOf(run) < 40
                        ? 'Giữa những ngã rẽ.'
                        : ageOf(run) < 60
                          ? 'Mỗi ngày, một dấu chân.'
                          : 'Đi qua những mùa đời.'}
                  </h1>
                </div>
                <div className="year-stamp">
                  <strong>{run.world.year}</strong>
                  <span>{run.world.fictional ? 'TƯƠNG LAI GIẢ ĐỊNH' : run.world.eraName}</span>
                </div>
              </div>
              <div className="game-grid">
                <aside className="profile" aria-label="Nhân vật của bạn">
                  <Character run={run} />
                  <div className="sidebar-note">
                    <Feather size={22} aria-hidden="true" />
                    <p>
                      Không có một cách duy nhất
                      <br />
                      để sống một cuộc đời.
                    </p>
                  </div>
                </aside>
                <div className="game-center">
                  <nav className="game-tabs" aria-label="Các mặt của cuộc đời">
                    {(
                      [
                        { id: 'story', label: 'Câu chuyện', Icon: Feather },
                        { id: 'career', label: 'Nghề nghiệp', Icon: BriefcaseBusiness },
                        { id: 'finance', label: 'Tài chính', Icon: Wallet },
                        { id: 'people', label: 'Người thân', Icon: Users },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        className={tab === t.id ? 'tab-active' : ''}
                        aria-current={tab === t.id ? 'page' : undefined}
                        onClick={() => setTab(t.id)}
                      >
                        <t.Icon size={16} aria-hidden="true" />
                        {t.label}
                      </button>
                    ))}
                  </nav>
                  {tab === 'story' ? (
                    <Story
                      run={run}
                      onChoice={(eventId, choiceId, token) =>
                        act({ type: 'choose', eventId, choiceId }, token)
                      }
                      onAdvance={() => act({ type: 'advance' })}
                    />
                  ) : tab === 'career' ? (
                    <CareerPanel run={run} act={act} />
                  ) : tab === 'finance' ? (
                    <FinancePanel run={run} act={act} />
                  ) : (
                    <PeoplePanel run={run} />
                  )}
                </div>
                <aside className="world-sidebar" aria-label="Thời cuộc và ký ức">
                  <div className="world-context">
                    <span className="eyebrow">THẾ GIỚI NGOÀI KIA</span>
                    <h2>{run.world.eraName}</h2>
                    <p>{ERAS.find((e) => e.id === run.world.eraId)!.text}</p>
                    <span className="badge">
                      {run.world.fictional
                        ? 'Bối cảnh tương lai hư cấu'
                        : 'Bối cảnh thời kỳ · tình huống hư cấu'}
                    </span>
                  </div>
                  <Journal run={run} compact />
                  <button className="text-button journal-link" onClick={() => setScreen('journal')}>
                    Mở cả cuốn nhật ký
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </aside>
              </div>
              <div className="game-bottom">
                <span>
                  <Check size={13} aria-hidden="true" />
                  {session.saveStatus}
                </span>
                <span>Đời của bạn. Nhịp của bạn.</span>
              </div>
            </div>
          ))}
        {screen === 'journal' && run && (
          <div className="journal-page">
            <button className="text-button" onClick={resume}>
              <ArrowLeft size={16} aria-hidden="true" />
              Trở về cuộc đời
            </button>
            <Journal run={run} />
          </div>
        )}
      </main>
      {session.error && (
        <div className="error-notice" role="alert">
          <span>{session.error}</span>
          <button className="text-button" onClick={() => session.setError('')}>
            Đã hiểu
          </button>
        </div>
      )}
      <footer className="site-footer">
        <span>
          Một Kiếp Việt <span className="footer-dot">·</span> Chuyện đời do bạn viết
        </span>
        <button onClick={() => setDialog('help')} className="text-button">
          Cách chơi & đôi lời
          <ArrowRight size={14} aria-hidden="true" />
        </button>
        <span className="footer-version">BETA · 0.3</span>
      </footer>
      {dialog && (
        <Modal
          title={
            dialog === 'account'
              ? 'Tài khoản của tôi'
              : dialog === 'saves'
                ? 'Giữ lại một cuộc đời'
                : dialog === 'settings'
                  ? 'Chậm lại một chút'
                  : 'Vài điều trước khi sống'
          }
          wide={dialog === 'saves' || dialog === 'account'}
          onClose={() => setDialog(null)}
        >
          {dialog === 'account' ? (
            <AccountPanel
              auth={auth}
              onLoad={(s) => {
                session.restore(s);
                setDialog(null);
                setScreen('play');
              }}
            />
          ) : dialog === 'saves' ? (
            <SaveManager
              repository={repository}
              identity={session.identity}
              run={run}
              onLoad={(loaded) => {
                session.restore(loaded);
                setDialog(null);
                resume();
              }}
            />
          ) : dialog === 'settings' ? (
            <div className="settings">
              <label>
                <span>
                  <b>Chữ lớn hơn</b>
                  <small>Thêm khoảng thở cho những trang truyện.</small>
                </span>
                <input
                  type="checkbox"
                  checked={largeText}
                  onChange={(e) => setLargeText(e.target.checked)}
                />
              </label>
              <label>
                <span>
                  <b>Giảm chuyển động</b>
                  <small>Hệ thống cũng tự theo tùy chọn của thiết bị.</small>
                </span>
                <input
                  type="checkbox"
                  checked={still}
                  onChange={(e) => setStill(e.target.checked)}
                />
              </label>
              <p className="fine-print">
                Trò chơi không có âm thanh tự phát. Tiến độ được lưu trên trình duyệt; không cần tài
                khoản.
              </p>
            </div>
          ) : (
            <div className="help-content">
              <p className="lead">
                Bạn không cần có một cuộc đời hoàn hảo.
                <br />
                Chỉ cần sống tiếp và xem điều gì ở lại.
              </p>
              <ol>
                <li>
                  <b>Bắt đầu một kiếp.</b> Để số phận chọn, hoặc tự chọn năm sinh và vùng quê.
                </li>
                <li>
                  <b>Đọc và quyết định.</b> Gợi ý cho biết đánh đổi trước mắt. Có chuyện sẽ trở lại
                  nhiều năm sau.
                </li>
                <li>
                  <b>Chủ động khi trưởng thành.</b> Tìm việc, đổi nghề, gửi tiết kiệm, trả nợ hay ra
                  ở riêng trong các mục tương ứng.
                </li>
                <li>
                  <b>Nhìn lại.</b> Nhật ký giữ những gì đã xảy ra; cuối đời có hồi ký và thẻ kỷ niệm
                  để tải xuống.
                </li>
              </ol>
              <div className="help-note">
                <h3>Một thế giới có chủ đích</h3>
                <p>
                  Ba vùng quê là bối cảnh hư cấu, không đại diện cho mọi người tại đó. đSM là đồng
                  sức mua thiết kế cho game, không phải giá hay thu nhập lịch sử bằng VNĐ. Từ năm
                  2027, tất cả bối cảnh tương lai là giả định.
                </p>
                <p>
                  Mốc Đổi Mới 1986 tham khảo{' '}
                  <a
                    href="https://documents1.worldbank.org/curated/en/353311468314062406/pdf/450750ENGLISH01Aug0110200801PUBLIC1.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    World Bank
                  </a>
                  ; bối cảnh COVID-19 tham khảo{' '}
                  <a
                    href="https://vietnam.un.org/en/89079-game-changers-viet-nam%E2%80%99s-successful-covid-19-response"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Liên Hợp Quốc Việt Nam
                  </a>
                  . Tình huống cá nhân và mọi thông số là sáng tác.
                </p>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
