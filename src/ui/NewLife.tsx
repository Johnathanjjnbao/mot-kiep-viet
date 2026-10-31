import { useState } from 'react';
import { ArrowLeft, ArrowRight, Dices } from 'lucide-react';
import type { GameRun, RunSetup, ParentTrait } from '../domain/model';
import { COHORTS, REGIONS } from '../content/world';
import { setupSchema, WEALTH, FAMILIES, PARENT_TRAITS } from '../domain/creator';
import { Avatar } from './Avatar';
import { createRun } from '../engine/engine';
import { PersonalityPicker } from './PersonalityPicker';
import { PLAYER_PERSONALITIES, playerPersonalitySchema } from '../domain/personality';
import { randomizeCreatorTraits } from '../application/creatorRandom';
import type {
  CreatorSubject,
  CreatorTraitGroups,
  CreatorCounters,
} from '../application/creatorRandom';
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
  const [generatedSeed] = useState(
    () => `viet-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
  );
  const [custom, setCustom] = useState(false),
    [seed, setSeed] = useState(''),
    [setup, setSetup] = useState<RunSetup>({
      cohort: 1995,
      region: 'northern-village',
      name: 'Nguyễn Minh An',
      birthplace: 'Một làng quê Bắc Bộ',
      environment: 'rural',
      wealth: 2,
      family: 'both',
      motherTraits: [],
      fatherTraits: [],
    }),
    [preview, setPreview] = useState(false),
    [error, setError] = useState('');
  const [counters, setCounters] = useState<CreatorCounters>({ player: 0, mother: 0, father: 0 });
  const [locked, setLocked] = useState<CreatorTraitGroups>({ player: [], mother: [], father: [] });
  const [rollNotice, setRollNotice] = useState('');
  const groups: CreatorTraitGroups = {
    player: setup.playerTraits ?? [],
    mother: setup.motherTraits ?? [],
    father: setup.fatherTraits ?? [],
  };
  const subjects: CreatorSubject[] = [
    'player',
    ...(setup.family === 'father-only' ? [] : ['mother' as const]),
    ...(setup.family === 'mother-only' ? [] : ['father' as const]),
  ];
  const portraitRun = createRun(
    seed.trim().slice(0, 100) || generatedSeed,
    custom && setupSchema.safeParse(setup).success ? setup : undefined,
  );
  function update(patch: Partial<RunSetup>) {
    setSetup({ ...setup, ...patch });
    setError('');
  }
  function rollTraits(targets: CreatorSubject[]) {
    try {
      const next = randomizeCreatorTraits(
        groups,
        seed.trim() || generatedSeed,
        targets,
        counters,
        { player: false, mother: false, father: false },
        locked,
      );
      update({
        ...(next.player.length ? { playerTraits: next.player } : { playerTraits: undefined }),
        motherTraits: next.mother,
        fatherTraits: next.father,
      });
      setCounters((previous) => ({
        ...previous,
        ...Object.fromEntries(targets.map((s) => [s, previous[s] + 1])),
      }));
      setRollNotice('Đã gieo tính cách. Những tính cách đã khóa được giữ lại.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể gieo tính cách.');
    }
  }
  function lockTrait(subject: CreatorSubject, trait: string) {
    setLocked((previous) => ({
      ...previous,
      [subject]: (previous[subject] as string[]).includes(trait)
        ? previous[subject].filter((t) => t !== trait)
        : [...previous[subject], trait],
    }));
  }
  function parent(which: 'mother' | 'father') {
    const hidden =
      (which === 'mother' && setup.family === 'father-only') ||
      (which === 'father' && setup.family === 'mother-only');
    if (hidden) return null;
    const key = which === 'mother' ? 'motherTraits' : 'fatherTraits',
      selected = setup[key] ?? [];
    const nonresident =
      (which === 'mother' && setup.family === 'with-father') ||
      (which === 'father' && setup.family === 'with-mother');
    const labels = Object.values(PARENT_TRAITS),
      ids = Object.keys(PARENT_TRAITS) as ParentTrait[];
    return (
      <PersonalityPicker
        title={`${which === 'mother' ? 'Tính cách mẹ' : 'Tính cách cha'}${nonresident ? ' · không sống cùng' : ''}`}
        subject={which}
        options={labels}
        selected={selected.map((t) => PARENT_TRAITS[t])}
        locked={locked[which].map((t) => PARENT_TRAITS[t])}
        hint="Chỉ người cùng chăm sóc mới tác động hằng năm."
        valid={(items) =>
          setupSchema.shape.motherTraits.safeParse(items.map((t) => ids[labels.indexOf(t)])).success
        }
        onSelect={(items) => update({ [key]: items.map((t) => ids[labels.indexOf(t)]) })}
        onLock={(trait) => lockTrait(which, ids[labels.indexOf(trait)])}
        onRoll={() => rollTraits([which])}
        onClear={() => update({ [key]: [...locked[which]] })}
      />
    );
  }
  function submit() {
    if (seed.length > 100) {
      setError('Hạt giống tối đa 100 ký tự.');
      return;
    }
    if (custom) {
      const result = setupSchema.safeParse(setup);
      if (!result.success) {
        setError(result.error.issues.map((i) => i.message).join(' '));
        return;
      }
      setPreview(true);
    } else onStart(seed.trim() || generatedSeed);
  }
  const availableSetup = {
    ...setup,
    ...(setup.family === 'father-only'
      ? { motherTraits: [] }
      : setup.family === 'mother-only'
        ? { fatherTraits: [] }
        : {}),
  };
  return (
    <div className="new-life-page creator">
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        Về trang đầu
      </button>
      <div className="new-life-grid">
        <aside className="new-life-intro">
          <span className="eyebrow">Trang đầu tiên là của bạn</span>
          <h1>Đặt tên cho một cuộc đời.</h1>
          <p>Chọn một khởi đầu, rồi xem điều gì thay đổi qua những năm tháng.</p>
          <div className="mini-scenery">
            <Avatar run={portraitRun} />
          </div>
          <p className="fine-print creator-explainer">
            Năm sinh 1975–2026. Vùng mô phỏng dùng dữ liệu thiết kế chung, địa danh cụ thể do bạn
            đặt. Mọi năm sau 2026 là tương lai giả định.
          </p>
        </aside>
        <div className="new-life-form">
          <div className="segmented" role="group" aria-label="Cách bắt đầu">
            <button
              type="button"
              aria-pressed={!custom}
              className={!custom ? 'selected' : ''}
              onClick={() => {
                setCustom(false);
                setPreview(false);
              }}
            >
              Để số phận chọn
            </button>
            <button
              type="button"
              aria-pressed={custom}
              className={custom ? 'selected' : ''}
              onClick={() => {
                setCustom(true);
                setPreview(false);
              }}
            >
              Tự chọn bối cảnh
            </button>
          </div>
          {preview ? (
            <section className="creator-preview">
              <h2>Xem lại khởi đầu</h2>
              <div className="preview-avatar">
                <Avatar run={portraitRun} />
              </div>
              <h3>{setup.name}</h3>
              <dl>
                <dt>Năm sinh</dt>
                <dd>{setup.cohort}</dd>
                <dt>Nơi sinh</dt>
                <dd>
                  {setup.birthplace} · {REGIONS.find((r) => r.id === setup.region)!.short}
                </dd>
                <dt>Môi trường</dt>
                <dd>{setup.environment === 'urban' ? 'Đô thị' : 'Nông thôn'}</dd>
                <dt>Gia cảnh</dt>
                <dd>{WEALTH[setup.wealth ?? 2]}</dd>
                <dt>Người chăm sóc</dt>
                <dd>{FAMILIES[setup.family ?? 'both']}</dd>
              </dl>
              <p data-testid="preview-player-traits">Bạn: {portraitRun.player.traits.join(', ')}</p>
              {subjects
                .filter((w) => w !== 'player')
                .map((w) => (
                  <p key={w}>
                    {w === 'mother' ? 'Mẹ' : 'Cha'}:{' '}
                    {(availableSetup[w === 'mother' ? 'motherTraits' : 'fatherTraits'] ?? [])
                      .map((t) => PARENT_TRAITS[t])
                      .join(', ') || 'Không chọn tính cách'}
                  </p>
                ))}
              <button className="button secondary" onClick={() => setPreview(false)}>
                Sửa trước khi bắt đầu
              </button>
              <button
                className="button primary full-width"
                onClick={() => onStart(seed.trim() || generatedSeed, availableSetup)}
              >
                Bắt đầu với nhân vật này
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </section>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              {custom ? (
                <>
                  <fieldset>
                    <legend>Bạn là ai?</legend>
                    <label htmlFor="character-name">Tên nhân vật</label>
                    <div className="name-entry">
                      <input
                        id="character-name"
                        value={setup.name ?? ''}
                        maxLength={80}
                        required
                        onChange={(e) => update({ name: e.target.value })}
                      />
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          update({
                            name: ['Nguyễn Minh An', 'Trần Hoài Linh', 'Võ Hà My', 'Lê Bảo Ngọc'][
                              crypto.getRandomValues(new Uint32Array(1))[0] % 4
                            ],
                          })
                        }
                      >
                        <Dices size={16} aria-hidden="true" />
                        Gợi ý tên
                      </button>
                    </div>
                    <label htmlFor="birth-year">Năm sinh (1975–2026)</label>
                    <input
                      id="birth-year"
                      type="number"
                      min={1975}
                      max={2026}
                      required
                      value={setup.cohort}
                      onChange={(e) => update({ cohort: Number(e.target.value) })}
                    />
                    <div className="cohort-options">
                      {COHORTS.map((y) => (
                        <label key={y} className={setup.cohort === y ? 'chosen' : ''}>
                          <input
                            type="radio"
                            name="cohort"
                            checked={setup.cohort === y}
                            onChange={() => update({ cohort: y })}
                          />
                          <strong>{y}</strong>
                          <span>Bối cảnh tham chiếu</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <PersonalityPicker
                    title="Tính cách nhân vật chính"
                    subject="player"
                    options={PLAYER_PERSONALITIES}
                    selected={groups.player}
                    locked={locked.player}
                    hint="Khuynh hướng ban đầu, không quyết định cả cuộc đời. Bỏ trống để số phận chọn một tính cách."
                    valid={(items) => playerPersonalitySchema.safeParse(items).success}
                    onSelect={(items) => update({ playerTraits: items.length ? items : undefined })}
                    onLock={(trait) => lockTrait('player', trait)}
                    onRoll={() => rollTraits(['player'])}
                    onClear={() =>
                      update({
                        playerTraits: locked.player.length ? [...locked.player] : undefined,
                      })
                    }
                  />
                  <fieldset>
                    <legend>Mái nhà đầu tiên</legend>
                    <div className="region-options">
                      {REGIONS.map((r) => (
                        <label key={r.id} className={setup.region === r.id ? 'chosen' : ''}>
                          <input
                            type="radio"
                            name="region"
                            checked={setup.region === r.id}
                            onChange={() => update({ region: r.id })}
                          />
                          <span>
                            <b>{r.name}</b>
                            <small>{r.short}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                    <label htmlFor="birthplace">Địa danh cụ thể</label>
                    <input
                      id="birthplace"
                      required
                      maxLength={80}
                      value={setup.birthplace ?? ''}
                      onChange={(e) => update({ birthplace: e.target.value })}
                    />
                    <label htmlFor="environment">Môi trường sống</label>
                    <select
                      id="environment"
                      value={setup.environment}
                      onChange={(e) => update({ environment: e.target.value as 'urban' | 'rural' })}
                    >
                      <option value="urban">Đô thị</option>
                      <option value="rural">Nông thôn</option>
                    </select>
                    <label htmlFor="wealth">Điều kiện kinh tế gia đình</label>
                    <select
                      id="wealth"
                      value={setup.wealth}
                      onChange={(e) =>
                        update({ wealth: Number(e.target.value) as RunSetup['wealth'] })
                      }
                    >
                      {WEALTH.map((w, i) => (
                        <option key={w} value={i}>
                          {w}
                        </option>
                      ))}
                    </select>
                    <p className="fine-print">
                      Gia cảnh đổi khoản để dành và hỗ trợ sinh hoạt, không quyết định bạn sẽ thành
                      công hay sống thế nào.
                    </p>
                  </fieldset>
                  <fieldset>
                    <legend>Những người chăm sóc</legend>
                    <label htmlFor="family">Cấu trúc gia đình</label>
                    <select
                      id="family"
                      value={setup.family}
                      onChange={(e) => {
                        update({
                          family: e.target.value as RunSetup['family'],
                          ...(e.target.value === 'father-only'
                            ? { motherTraits: [] }
                            : e.target.value === 'mother-only'
                              ? { fatherTraits: [] }
                              : {}),
                        });
                        if (e.target.value === 'father-only')
                          setLocked((l) => ({ ...l, mother: [] }));
                        if (e.target.value === 'mother-only')
                          setLocked((l) => ({ ...l, father: [] }));
                      }}
                    >
                      {Object.entries(FAMILIES).map(([id, label]) => (
                        <option key={id} value={id}>
                          {{
                            both: 'Cùng cha và mẹ',
                            'father-only': 'Chỉ có cha',
                            'mother-only': 'Chỉ có mẹ',
                            'with-father': 'Ly thân/ly hôn · với cha',
                            'with-mother': 'Ly thân/ly hôn · với mẹ',
                          }[id] ?? label}
                        </option>
                      ))}
                    </select>
                    <p className="fine-print">
                      Chỉ có cha/mẹ: người còn lại chưa rõ thông tin. Ly thân/ly hôn: người không
                      sống cùng vẫn tồn tại, không bị coi là đã qua đời.
                    </p>
                  </fieldset>
                  {parent('mother')}
                  {parent('father')}
                  <button
                    type="button"
                    className="button secondary full-width"
                    onClick={() => rollTraits(subjects)}
                  >
                    <Dices size={17} aria-hidden="true" />
                    Ngẫu nhiên tất cả tính cách
                  </button>
                  <p className="fine-print" role="status">
                    {rollNotice}
                  </p>
                </>
              ) : (
                <div className="fate-note">
                  <Dices size={40} aria-hidden="true" />
                  <h2>Một lần gieo, một kiếp người.</h2>
                  <p>
                    Game chọn năm sinh tham chiếu, quê nhà, gia cảnh và cấu trúc người chăm sóc. Bạn
                    chọn cách sống từ những sự kiện đầu tiên.
                  </p>
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
                />
              </details>
              {run && (
                <div className="new-run-note">
                  <p>
                    Kiếp mới sẽ thay bản tự lưu của {run.player.name}; lịch sử hoàn tất và các ô lưu
                    được giữ.
                  </p>
                  <button type="button" className="text-button" onClick={onSave}>
                    Mở các ô lưu
                  </button>
                </div>
              )}
              <p role="alert" className="creator-error">
                {error}
              </p>
              <button type="submit" className="button primary full-width">
                {custom ? 'Xem trước cuộc đời' : 'Gieo một cuộc đời'}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
