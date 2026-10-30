import { useRef, useState } from 'react';
import type { GameRun, RunAction, WardrobeAction, WearSlot } from '../domain/model';
import { CLOTHING, clothingById, wearable } from '../content/clothing';
import { Avatar } from './Avatar';
import { money } from './common';
import { Garment } from './Garment';
const slots: Record<WearSlot, string> = {
  top: 'Áo & váy',
  bottom: 'Quần & chân váy',
  outer: 'Áo khoác',
  shoes: 'Giày dép',
  hair: 'Tóc & mũ',
  accessory: 'Phụ kiện',
};
export function Wardrobe({ run, act }: { run: GameRun; act: (action: RunAction) => void }) {
  const lastTouch = useRef(-Infinity), suppressTouchClick = useRef(false);
  const [slot, setSlot] = useState<WearSlot>('top'),
    [view, setView] = useState<'shop' | 'owned'>('shop'),
    [preview, setPreview] = useState(''),
    [outfitName, setOutfitName] = useState('Ngày bình thường');
  if (!run.wardrobe)
    return (
      <section className="panel-page">
        <h2>Tủ đồ của một cuộc đời mới</h2>
        <p>
          Cuộc đời này tiếp tục bằng bộ luật cũ. Bạn vẫn giữ nguyên trang phục và toàn bộ tiến độ;
          hãy bắt đầu một đời Life Expansion để dùng cửa hàng.
        </p>
      </section>
    );
  const w = run.wardrobe,
    p = clothingById(preview),
    previewRun =
      p && wearable(run, p)
        ? { ...run, wardrobe: { ...w, equipped: { ...w.equipped, [p.slot]: p.id } } }
        : run;
  const send = (operation: WardrobeAction['operation'], item: string) =>
    act({ type: 'wardrobe', operation, item, expected: run.actions.length });
  return (
    <section className="panel-page wardrobe-page"
      onPointerDownCapture={e => {
        suppressTouchClick.current = e.pointerType === 'touch' && performance.now() - lastTouch.current < 350;
        if (e.pointerType === 'touch') lastTouch.current = performance.now();
      }}
      onClickCapture={e => {
        if (e.detail > 1 || (e.detail !== 0 && suppressTouchClick.current)) { e.preventDefault(); e.stopPropagation(); }
        suppressTouchClick.current = false;
      }}>
      <span className="eyebrow">MẶC THEO CÁCH CỦA MÌNH</span>
      <h2>Tủ đồ qua những mùa.</h2>
      <p className="muted">
        Đồ mặc không quyết định giá trị của bạn. Sự phù hợp có thể giúp một buổi gặp, còn tình cảm
        cần thời gian.
      </p>
      <div className="wardrobe-layout">
        <aside className="wardrobe-preview">
          <Avatar run={previewRun} />
          <strong>{p ? `Đang thử: ${p.name}` : 'Bộ đồ đang mặc'}</strong>
          <p role="status">Trong túi: {money(run.finance.cash)}</p>
          {p && (
            <button className="text-button" onClick={() => setPreview('')}>
              Bỏ xem thử
            </button>
          )}
          <p className="fine-print">
            Xem thử không mua hay thay bản lưu. Giá là đSM mô phỏng, không phải VNĐ.
          </p>
          <ul className="equipped-list">
            {Object.entries(w.equipped).map(([s, id]) => (
              <li key={s}>
                <span>{clothingById(id!)?.name}</span>
                <button
                  className="text-button"
                  aria-label={`Tháo ${clothingById(id!)?.name}`}
                  onClick={() => {
                    setPreview('');
                    send('unequip', s);
                  }}
                >
                  Tháo
                </button>
              </li>
            ))}
          </ul>
          <label>
            Tên bộ đồ
            <input
              value={outfitName}
              maxLength={40}
              onChange={(e) => setOutfitName(e.target.value)}
            />
          </label>
          <button
            className="button secondary small"
            disabled={!outfitName.trim() || w.outfits.length >= 8}
            onClick={() => send('save-outfit', outfitName)}
          >
            Lưu cách phối này
          </button>
          {w.outfits.map((o) => (
            <button
              className="text-button"
              key={o.id}
              onClick={() => {
                setPreview('');
                send('wear-outfit', o.id);
              }}
            >
              Mặc bộ {o.name}
            </button>
          ))}
        </aside>
        <div className="wardrobe-stock">
          <div className="segmented" aria-label="Cửa hàng và đồ đã có">
            <button
              aria-pressed={view === 'shop'}
              className={view === 'shop' ? 'selected' : ''}
              onClick={() => setView('shop')}
            >
              Cửa hàng
            </button>
            <button
              aria-pressed={view === 'owned'}
              className={view === 'owned' ? 'selected' : ''}
              onClick={() => setView('owned')}
            >
              Đã sở hữu ({w.owned.length})
            </button>
          </div>
          <label>
            Loại trang phục
            <select value={slot} onChange={(e) => setSlot(e.target.value as WearSlot)}>
              {Object.entries(slots).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <div className="clothing-grid">
            {CLOTHING.filter(
              (c) => c.slot === slot && (view === 'shop' || w.owned.includes(c.id)),
            ).map((c) => {
              const owned = w.owned.includes(c.id),
                allowed = wearable(run, c),
                equipped = w.equipped[c.slot] === c.id;
              return (
                <article
                  className={`clothing-card ${equipped ? 'is-equipped' : ''}`}
                  key={c.id}
                  data-clothing={c.id}
                >
                  <div
                    className="cloth-swatch"
                    aria-hidden="true"
                  >
                    <Garment item={c} />
                  </div>
                  <div>
                    <h3>{c.name}</h3>
                    <p>{c.description}</p>
                    <strong>
                      {owned ? (equipped ? 'Đang mặc' : 'Đã sở hữu') : money(c.price)}
                    </strong>
                    {!allowed && (
                      <p className="fine-print">
                        Từ {c.minAge} tuổi · năm {c.from} trở đi
                      </p>
                    )}
                  </div>
                  <div className="clothing-actions">
                    <button
                      className="button secondary small"
                      disabled={!allowed}
                      onClick={() => setPreview(c.id)}
                    >
                      Xem thử
                    </button>
                    {owned ? (
                      <button
                        className="button primary small"
                        disabled={!allowed || equipped}
                        onClick={() => {
                          setPreview('');
                          send('equip', c.id);
                        }}
                      >
                        Mặc
                      </button>
                    ) : (
                      <button
                        className="button primary small"
                        disabled={!allowed || run.finance.cash < c.price}
                        onClick={() => send('buy', c.id)}
                      >
                        Mua · {money(c.price)}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
