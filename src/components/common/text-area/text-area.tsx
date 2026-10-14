import { useId } from "react";
import { clsx } from "clsx";
import type { ITextAreaProps } from "../../../interfaces/ICommon";

export const TextArea = ({
  value,
  onChange,
  label,
  hint,
  actions,
  placeholder = "",
  readOnly = false,
  invalid = false,
  describedBy,
  className = "",
  prose = false,
  compact = false,
}: ITextAreaProps) => {
  const id = useId();

  return (
    <div className={clsx("flex min-h-0 min-w-0 flex-col gap-2", className)}>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-center gap-3">
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
          </label>
          {hint && <span className="text-sm text-muted">{hint}</span>}
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <textarea
        id={id}
        className={clsx(
          "w-full flex-1 resize-none rounded-lg border px-4 py-3 leading-relaxed text-ink transition-colors duration-150",
          "placeholder:text-muted/80",
          prose ? "font-sans text-base" : "font-mono text-sm",
          compact ? "min-h-40" : "min-h-64",
          readOnly ? "bg-surface" : "bg-raised",
          invalid ? "border-danger" : readOnly ? "border-rule" : "border-line",
        )}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  );
};
