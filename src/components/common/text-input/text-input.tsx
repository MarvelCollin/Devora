import { useId } from "react";
import { clsx } from "clsx";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import type { ITextInputProps } from "../../../interfaces/ICommon";

export const TextInput = ({
  value,
  onChange,
  label,
  hint,
  actions,
  error,
  placeholder,
  prefix,
  suffix,
  size = "md",
  inputMode = "text",
  className = "",
}: ITextInputProps) => {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={clsx("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-center gap-3">
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
          </label>
          {hint && <span className="text-sm text-muted">{hint}</span>}
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div
        className={clsx(
          "flex items-center rounded-lg border bg-raised transition-colors duration-150 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
          error ? "border-danger" : "border-line"
        )}
      >
        {prefix && (
          <span className="pl-4 font-mono text-sm text-muted" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          spellCheck={false}
          autoComplete="off"
          className={clsx(
            "w-full min-w-0 bg-transparent font-mono text-ink placeholder:text-muted/80 focus-visible:outline-none",
            size === "lg" ? "h-12 text-lg" : "h-10 text-sm",
            prefix ? "pl-1" : size === "lg" ? "pl-4" : "pl-3",
            suffix ? "pr-1" : size === "lg" ? "pr-4" : "pr-3"
          )}
        />
        {suffix && (
          <span className="pr-4 font-mono text-sm text-muted" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-sm text-danger"
        >
          <HiOutlineExclamationTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};
