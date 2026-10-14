import { useId, useRef } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { clsx } from "clsx";
import type { ISliderProps } from "../../../interfaces/ICommon";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const Slider = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  valueText,
  trackBackground,
  hint,
}: ISliderProps) => {
  const labelId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const percent = ((clamp(value, min, max) - min) / (max - min)) * 100;
  const shownValue = valueText ?? String(value);

  const snap = (raw: number) => {
    const stepped = Math.round((raw - min) / step) * step + min;
    return clamp(Number(stepped.toFixed(6)), min, max);
  };

  const valueFromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return snap(min + ratio * (max - min));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    thumbRef.current?.focus();
    onChange(valueFromPointer(event.clientX));
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const next = valueFromPointer(event.clientX);
    if (next !== value) onChange(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const big = Math.max(step, (max - min) / 10);
    const moves: Record<string, number> = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: big,
      PageDown: -big,
    };
    let next: number | null = null;
    if (event.key in moves) next = snap(value + moves[event.key]);
    else if (event.key === "Home") next = min;
    else if (event.key === "End") next = max;
    if (next === null) return;
    event.preventDefault();
    if (next !== value) onChange(next);
  };

  return (
    <div className={clsx("flex flex-col gap-2", disabled && "opacity-50")}>
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} className="text-sm font-medium text-ink">
          {label}
        </span>
        <span className="font-mono text-sm tabular-nums text-muted">
          {shownValue}
        </span>
      </div>
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className={clsx(
          "relative flex h-6 touch-none items-center",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <div
          className="relative h-2 w-full overflow-hidden rounded-full border border-rule bg-surface"
          style={trackBackground ? { background: trackBackground } : undefined}
        >
          {!trackBackground && (
            <div
              className="absolute inset-y-0 left-0 bg-primary"
              style={{ width: `${percent}%` }}
            />
          )}
        </div>
        <div
          ref={thumbRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={labelId}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={shownValue}
          aria-disabled={disabled || undefined}
          onKeyDown={handleKeyDown}
          className="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-raised shadow-lift"
          style={{ left: `${percent}%` }}
        />
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
};
