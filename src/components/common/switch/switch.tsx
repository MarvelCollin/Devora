import { clsx } from "clsx";
import type { ISwitchProps } from "../../../interfaces/ICommon";

export const Switch = ({
  label,
  checked,
  onChange,
  disabled = false,
}: ISwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group inline-flex min-h-8 items-center gap-2.5 rounded-md text-sm text-ink disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={clsx(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150 ease-out",
          checked ? "border-primary bg-primary" : "border-line bg-surface"
        )}
      >
        <span
          className={clsx(
            "h-3.5 w-3.5 rounded-full transition-transform duration-150 ease-out",
            checked
              ? "translate-x-[18px] bg-on-primary"
              : "translate-x-[2px] bg-line"
          )}
        />
      </span>
      {label}
    </button>
  );
};
