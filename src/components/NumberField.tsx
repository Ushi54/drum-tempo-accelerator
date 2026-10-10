import { useState } from 'react';

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

// 入力中だけ文字のまま持ち（draft）、確定（フォーカスが外れる / Enter）したときに範囲内の数に直す。
// 入力中でなければ、親から渡された value をそのまま表示する。
export function NumberField({ value, min, max, onChange, label, disabled, className }: Props) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    const parsed = Number.parseInt(draft ?? '', 10);
    setDraft(null);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(max, Math.max(min, parsed));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <input
      className={`number-field ${className ?? ''}`}
      type="number"
      inputMode="numeric"
      aria-label={label}
      min={min}
      max={max}
      value={draft ?? String(value)}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}
