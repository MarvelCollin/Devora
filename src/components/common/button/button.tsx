import { clsx } from "clsx";
import type { IButtonProps } from "../../../interfaces/ICommon";

export const Button = ({
  label,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  icon: Icon,
  iconPosition = "left",
}: IButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-accent-600 text-white hover:bg-accent-500 focus:ring-accent-500 shadow-lg shadow-accent-600/20",
    secondary:
      "bg-dark-700 text-dark-200 hover:bg-dark-600 focus:ring-dark-500 border border-dark-600",
    ghost:
      "bg-transparent text-dark-300 hover:text-dark-100 hover:bg-dark-800 focus:ring-dark-600",
    danger:
      "bg-error-500 text-white hover:bg-error-400 focus:ring-error-500 shadow-lg shadow-error-500/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && iconPosition === "left" && <Icon className="w-4 h-4" />}
      {label}
      {Icon && iconPosition === "right" && <Icon className="w-4 h-4" />}
    </button>
  );
};
