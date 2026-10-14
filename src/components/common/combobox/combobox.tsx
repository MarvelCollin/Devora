import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { clsx } from "clsx";
import { HiChevronUpDown, HiCheck } from "react-icons/hi2";

export interface IComboOption {
  value: string;
  label: string;
  hint?: string;
}

interface IComboboxProps {
  label: string;
  options: IComboOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  clearOnSelect?: boolean;
  limit?: number;
}

export const Combobox = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  clearOnSelect = false,
  limit = 80,
}: IComboboxProps) => {
  const id = useId();
  const listId = `${id}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value) ?? null;
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const terms = (query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = terms.length
      ? options.filter((option) => {
          const text = `${option.label} ${option.value} ${option.hint ?? ""}`.toLowerCase();
          return terms.every((term) => text.includes(term));
        })
      : options;
    return filtered.slice(0, limit);
  }, [options, query, limit]);

  const safeActive = Math.min(active, Math.max(0, matches.length - 1));

  useEffect(() => {
    if (open) document.getElementById(`${id}-option-${safeActive}`)?.scrollIntoView({ block: "nearest" });
  }, [open, safeActive, id]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery(null);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const choose = (option: IComboOption) => {
    onChange(option.value);
    setQuery(null);
    setOpen(false);
    if (clearOnSelect) inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActive(Math.min(matches.length - 1, safeActive + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(0, safeActive - 1));
    } else if (event.key === "Enter" && open && matches[safeActive]) {
      event.preventDefault();
      choose(matches[safeActive]);
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
      setQuery(null);
    } else if (event.key === "Tab") {
      setOpen(false);
      setQuery(null);
    }
  };

  const shownText = query ?? (clearOnSelect ? "" : selected?.label ?? "");

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="flex min-h-8 items-center text-sm font-medium text-ink">
        {label}
      </label>
      <div ref={rootRef} className="relative">
        <div className="flex h-10 items-center rounded-lg border border-line bg-raised focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && matches.length > 0 ? `${id}-option-${safeActive}` : undefined}
            value={shownText}
            placeholder={placeholder ?? selected?.label}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={(e) => e.target.select()}
            onClick={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-ink placeholder:text-muted/80 focus-visible:outline-none"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Show ${label.toLowerCase()} options`}
            onClick={() => {
              setOpen(!open);
              inputRef.current?.focus();
            }}
            className="flex h-full w-9 items-center justify-center text-muted hover:text-ink"
          >
            <HiChevronUpDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {open && (
          <div
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute left-0 top-full z-30 mt-1 max-h-72 w-full min-w-64 animate-pop-in overflow-y-auto rounded-lg border border-rule bg-raised p-1 shadow-pop"
          >
            {matches.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted">Nothing matches "{query}". Try a city or region name.</p>
            ) : (
              matches.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <div
                    key={option.value}
                    id={`${id}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseMove={() => {
                      if (safeActive !== index) setActive(index);
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(option)}
                    className={clsx(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                      index === safeActive && "bg-tint",
                      isSelected ? "font-semibold text-strong" : "text-ink"
                    )}
                  >
                    <HiCheck
                      className={clsx("h-4 w-4 shrink-0", isSelected ? "text-strong" : "invisible")}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.hint && <span className="shrink-0 text-xs font-normal text-muted">{option.hint}</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
