import { clsx } from "clsx";
import { HiArrowPath } from "react-icons/hi2";
import type { IButtonProps } from "../../../interfaces/ICommon";

const VARIANTS = {
  primary:
    "bg-primary text-on-primary shadow-lift hover:bg-primary-hover active:translate-y-px",
  secondary:
    "border border-line bg-raised text-ink hover:bg-tint active:translate-y-px",
  ghost: "text-muted hover:bg-tint hover:text-ink",
  danger: "text-danger hover:bg-danger-tint",
};

const SIZES = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-10 gap-2 px-4 text-sm",
};

export const Button = ({
  label,
  onClick,
  variant = "secondary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  icon: Icon,
  iconPosition = "left",
  type = "button",
  ariaLabel,
}: IButtonProps) => {
  const ShownIcon = loading ? HiArrowPath : Icon;

  return (
    <button
      type={type}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors duration-150 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
    >
      {ShownIcon && iconPosition === "left" && (
        <ShownIcon
          className={clsx("h-4 w-4 shrink-0", loading && "animate-spin")}
          aria-hidden="true"
        />
      )}
      {label}
      {ShownIcon && iconPosition === "right" && (
        <ShownIcon
          className={clsx("h-4 w-4 shrink-0", loading && "animate-spin")}
          aria-hidden="true"
        />
      )}
    </button>
  );
};
