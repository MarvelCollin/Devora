import { useId, useState } from "react";
import { clsx } from "clsx";

interface IColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hideLabel?: boolean;
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

const normalizeHex = (text: string): string | null => {
  const match = text.trim().match(HEX);
  if (!match) return null;
  const digits = match[1].length === 3 ? match[1].split("").map((c) => c + c).join("") : match[1];
  return `#${digits.toLowerCase()}`;
};

export const ColorField = ({ label, value, onChange, hideLabel = false }: IColorFieldProps) => {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;
  const invalid = draft !== null && normalizeHex(draft) === null;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className={clsx("text-sm font-medium text-ink", hideLabel && "sr-only")}>
        {label}
      </label>
      <div
        className={clsx(
          "flex h-10 w-36 items-center gap-2 rounded-lg border bg-raised pl-2 pr-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
          invalid ? "border-danger" : "border-line"
        )}
      >
        <span className="h-6 w-6 shrink-0 rounded-md border border-rule" style={{ backgroundColor: value }} aria-hidden="true" />
        <input
          id={id}
          type="text"
          value={shown}
          onChange={(e) => {
            setDraft(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex) onChange(hex);
          }}
          onBlur={() => setDraft(null)}
          aria-invalid={invalid || undefined}
          spellCheck={false}
          autoComplete="off"
          className="h-full w-full min-w-0 bg-transparent font-mono text-sm text-ink focus-visible:outline-none"
        />
      </div>
      {invalid && <p className="text-xs text-danger">Use a hex color like #2f7d6d.</p>}
    </div>
  );
};
