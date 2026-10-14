import { useId } from "react";
import { clsx } from "clsx";

export interface IToggleOption {
  value: string;
  label: string;
  hint?: string;
}

interface IToggleGroupProps {
  label: string;
  options: IToggleOption[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export const ToggleGroup = ({ label, options, value, onChange, className = "" }: IToggleGroupProps) => {
  const labelId = useId();

  const toggle = (option: string) =>
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);

  return (
    <div className={clsx("flex min-w-0 flex-col gap-2", className)}>
      <span id={labelId} className="text-sm font-medium text-ink">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg border border-rule bg-surface p-1"
      >
        {options.map((option) => {
          const pressed = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={pressed}
              onClick={() => toggle(option.value)}
              className={clsx(
                "flex h-8 items-center gap-2 rounded-md px-2.5 text-sm transition-colors duration-150 ease-out",
                pressed
                  ? "bg-raised font-semibold text-strong shadow-lift ring-1 ring-line"
                  : "font-medium text-muted hover:bg-tint hover:text-ink"
              )}
            >
              <span className="font-mono">{option.label}</span>
              {option.hint && <span className="hidden text-xs font-normal sm:inline">{option.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
