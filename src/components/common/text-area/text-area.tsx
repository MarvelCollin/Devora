import { clsx } from "clsx";
import type { ITextAreaProps } from "../../../interfaces/ICommon";

export const TextArea = ({
  value,
  onChange,
  placeholder = "",
  rows = 10,
  readOnly = false,
  className = "",
  label,
}: ITextAreaProps) => {
  return (
    <div className="flex flex-col gap-2 flex-1">
      {label && (
        <label className="text-sm font-medium text-dark-300">{label}</label>
      )}
      <textarea
        className={clsx(
          "w-full h-full min-h-[200px] p-4 rounded-xl border transition-all duration-200 resize-none",
          "bg-dark-900 border-dark-700 text-dark-100",
          "font-mono text-sm leading-relaxed",
          "placeholder:text-dark-500",
          "focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20",
          readOnly && "bg-dark-850 cursor-default",
          className
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        readOnly={readOnly}
        spellCheck={false}
      />
    </div>
  );
};
