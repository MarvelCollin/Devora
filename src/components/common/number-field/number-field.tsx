import { useId, useState } from "react";
import type { KeyboardEvent } from "react";
import { HiMinus, HiPlus } from "react-icons/hi2";

interface INumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  hint?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const NumberField = ({ label, value, onChange, min, max, step = 1, hint }: INumberFieldProps) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (next: number) => {
    setDraft(null);
    const clamped = clamp(Math.round(next / step) * step, min, max);
    if (clamped !== value) onChange(clamped);
  };

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = Number(draft.trim());
    if (draft.trim() === "" || Number.isNaN(parsed)) setDraft(null);
    else commit(parsed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const moves: Record<string, number> = {
      ArrowUp: step,
      ArrowDown: -step,
      PageUp: step * 10,
      PageDown: -step * 10,
    };
    if (event.key in moves) {
      event.preventDefault();
      commit(value + moves[event.key]);
    } else if (event.key === "Home") {
      event.preventDefault();
      commit(min);
    } else if (event.key === "End") {
      event.preventDefault();
      commit(max);
    } else if (event.key === "Enter") {
      commitDraft();
    }
  };

  const buttonClass =
    "flex h-10 w-10 shrink-0 items-center justify-center text-muted transition-colors duration-150 hover:bg-tint hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="flex min-h-8 items-center text-sm font-medium text-ink">
        {label}
      </label>
      <div className="flex w-fit items-center overflow-hidden rounded-lg border border-line bg-raised focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Decrease ${label.toLowerCase()}`}
          onClick={() => commit(value - step)}
          disabled={value <= min}
          className={buttonClass}
        >
          <HiMinus className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          id={id}
          type="text"
          role="spinbutton"
          inputMode="numeric"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-describedby={hint ? hintId : undefined}
          value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="h-10 w-20 border-x border-rule bg-transparent text-center font-mono text-sm tabular-nums text-ink focus-visible:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={() => commit(value + step)}
          disabled={value >= max}
          className={buttonClass}
        >
          <HiPlus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
};
