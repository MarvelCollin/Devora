import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { clsx } from "clsx";
import { HiChevronUpDown, HiCheck } from "react-icons/hi2";

export interface ISelectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface ISelectProps<T extends string> {
  label: string;
  options: ISelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export const Select = <T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className = "",
}: ISelectProps<T>) => {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const typeahead = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [upward, setUpward] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [active, setActive] = useState(selectedIndex);
  const selected = options[selectedIndex];
  const optionId = (index: number) => `${id}-option-${index}`;

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, id]);

  const openList = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setUpward(below < 280 && rect.top > below);
    }
    setActive(selectedIndex);
    setOpen(true);
  };

  const choose = (index: number) => {
    onChange(options[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const findByTypeahead = (char: string) => {
    const now = Date.now();
    const buffer = now - typeahead.current.time > 600 ? char : typeahead.current.text + char;
    typeahead.current = { text: buffer, time: now };
    const start = open ? active : selectedIndex;
    const ordered = [...options.slice(start + 1), ...options.slice(0, start + 1)];
    const match = ordered.find((option) => option.label.toLowerCase().startsWith(buffer.toLowerCase()));
    return match ? options.indexOf(match) : -1;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      } else if (event.key.length === 1 && /\S/.test(event.key)) {
        const index = findByTypeahead(event.key);
        if (index >= 0) onChange(options[index].value);
      }
      return;
    }
    const moves: Record<string, () => number> = {
      ArrowDown: () => Math.min(options.length - 1, active + 1),
      ArrowUp: () => Math.max(0, active - 1),
      Home: () => 0,
      End: () => options.length - 1,
      PageDown: () => Math.min(options.length - 1, active + 8),
      PageUp: () => Math.max(0, active - 8),
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]());
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key.length === 1 && /\S/.test(event.key)) {
      const index = findByTypeahead(event.key);
      if (index >= 0) setActive(index);
    }
  };

  return (
    <div className={clsx("flex min-w-0 flex-col gap-2", className)}>
      <span id={labelId} className="flex min-h-8 items-center text-sm font-medium text-ink">
        {label}
      </span>
      <div ref={rootRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${labelId} ${id}-value`}
          aria-activedescendant={open ? optionId(active) : undefined}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={handleKeyDown}
          className="flex h-10 min-w-44 items-center justify-between gap-3 rounded-lg border border-line bg-raised px-3 text-left text-sm text-ink transition-colors duration-150 hover:bg-tint disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span id={`${id}-value`} className="truncate">
            {selected?.label}
          </span>
          <HiChevronUpDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        </button>
        {open && (
          <div
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            className={clsx(
              "absolute left-0 z-30 max-h-72 min-w-full animate-pop-in overflow-y-auto rounded-lg border border-rule bg-raised p-1 shadow-pop",
              upward ? "bottom-full mb-1" : "top-full mt-1",
            )}
          >
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseMove={() => {
                    if (active !== index) setActive(index);
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(index)}
                  className={clsx(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm whitespace-nowrap",
                    index === active ? "bg-tint" : "",
                    isSelected ? "font-semibold text-strong" : "text-ink",
                  )}
                >
                  <HiCheck
                    className={clsx("h-4 w-4 shrink-0", isSelected ? "text-strong" : "invisible")}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{option.label}</span>
                  {option.hint && <span className="text-xs font-normal text-muted">{option.hint}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
