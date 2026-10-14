import { useId, useRef } from "react";
import type { KeyboardEvent } from "react";
import { clsx } from "clsx";
import type { ISegmentedControlProps } from "../../../interfaces/ICommon";

export const SegmentedControl = <T extends string | number>({
  label,
  hideLabel = false,
  options,
  value,
  onChange,
  disabled = false,
  fullWidth = false,
  className = "",
}: ISegmentedControlProps<T>) => {
  const labelId = useId();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    let next: number | null = null;
    if (event.key in moves) {
      next = (index + moves[event.key] + options.length) % options.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = options.length - 1;
    }
    if (next === null) return;
    event.preventDefault();
    onChange(options[next].value);
    buttonRefs.current[next]?.focus();
  };

  return (
    <div className={clsx("flex min-w-0 flex-col gap-2", className)}>
      <span
        id={labelId}
        className={clsx("text-sm font-medium text-ink", hideLabel && "sr-only")}
      >
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-disabled={disabled || undefined}
        className={clsx(
          "flex gap-1 rounded-lg border border-rule bg-surface p-1",
          fullWidth ? "w-full" : "w-fit max-w-full"
        )}
      >
        {options.map((option, index) => {
          const checked = index === selectedIndex;
          return (
            <button
              key={String(option.value)}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={clsx(
                "h-8 min-w-0 rounded-md px-3 text-sm whitespace-nowrap transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50",
                fullWidth && "flex-1",
                checked
                  ? "bg-raised font-semibold text-strong shadow-lift ring-1 ring-line"
                  : "font-medium text-muted hover:bg-tint hover:text-ink"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
