import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Category, Stat } from '../domain/model';
export const STAT_NAMES: Record<Stat, string> = {
  health: 'Sức khỏe',
  mood: 'Tinh thần',
  knowledge: 'Tri thức',
  skill: 'Tay nghề',
  social: 'Giao tiếp',
  stress: 'Áp lực',
};
export const CATEGORIES: Record<Category, string> = {
  childhood: 'Tuổi thơ',
  education: 'Học hành',
  career: 'Mưu sinh',
  relationship: 'Thương & nhớ',
  finance: 'Chuyện thường ngày',
  history: 'Dòng thời cuộc',
  humor: 'Chuyện để cười',
};
export const money = (n: number) =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n)} đSM`;
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    close = useRef(onClose),
    opener = useRef<HTMLElement | null>(null);
  close.current = onClose;
  useEffect(() => {
    const d = ref.current!;
    if (!opener.current && document.activeElement instanceof HTMLElement) {
      opener.current = document.activeElement;
    }
    d.showModal();
    return () => {
      d.close();
      if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal-wide' : ''}`}
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" aria-label="Đóng" onClick={() => close.current()}>
          <X size={21} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function downloadFile(content: string, filename: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type })),
    a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}
