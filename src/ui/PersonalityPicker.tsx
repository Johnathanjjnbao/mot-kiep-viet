import { Dices, LockKeyhole, LockKeyholeOpen } from 'lucide-react';

export function PersonalityPicker<T extends string>({
  title,
  subject,
  options,
  selected,
  locked,
  hint,
  valid,
  onSelect,
  onLock,
  onRoll,
  onClear,
}: {
  title: string;
  subject: string;
  options: readonly T[];
  selected: T[];
  locked: T[];
  hint: string;
  valid: (items: T[]) => boolean;
  onSelect: (items: T[]) => void;
  onLock: (trait: T) => void;
  onRoll: () => void;
  onClear: () => void;
}) {
  return (
    <details
      className="personality-picker"
      open={subject === 'player'}
      data-testid={`traits-${subject}`}
    >
      <summary>
        <strong>{title}</strong>
        <span>{selected.join(', ') || 'Để số phận chọn'}</span>
      </summary>
      <fieldset>
        <legend className="sr-only">{title}</legend>
        <p className="fine-print">
          {hint} Chọn tối đa 3. Khóa từng tính cách để giữ qua những lần gieo.
        </p>
        <div className="trait-options">
          {options.map((trait) => {
            const checked = selected.includes(trait),
              keep = locked.includes(trait);
            return (
              <div className="personality-option" key={trait}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={keep || (!checked && !valid([...selected, trait]))}
                    onChange={() =>
                      onSelect(checked ? selected.filter((t) => t !== trait) : [...selected, trait])
                    }
                  />
                  {trait}
                </label>
                {checked && (
                  <button
                    type="button"
                    className="trait-lock"
                    aria-pressed={keep}
                    aria-label={`${keep ? 'Mở khóa' : 'Khóa'} ${trait}`}
                    onClick={() => onLock(trait)}
                  >
                    {keep ? (
                      <LockKeyhole size={16} aria-hidden="true" />
                    ) : (
                      <LockKeyholeOpen size={16} aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="personality-actions">
          <button
            type="button"
            className="text-button"
            onClick={onRoll}
            disabled={locked.length === 3}
          >
            <Dices size={16} aria-hidden="true" />
            Gieo lại
          </button>
          <button
            type="button"
            className="text-button"
            onClick={onClear}
            disabled={selected.length === locked.length}
          >
            Bỏ chọn chưa khóa
          </button>
        </div>
      </fieldset>
    </details>
  );
}
