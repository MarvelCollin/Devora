import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { clsx } from "clsx";
import { HiOutlineMagnifyingGlass, HiXMark } from "react-icons/hi2";
import type { ITool } from "../../../interfaces/ITool";
import { useFocusTrap } from "../../../hooks/use-focus-trap";
import { useRecentTools } from "../../../hooks/use-recent-tools";
import { routeHref } from "../../../hooks/use-hash-route";
import { searchTools } from "../../../utils/tool-search";

interface ICommandPaletteProps {
  open: boolean;
  onClose: () => void;
  tools: ITool[];
}

interface ISection {
  label: string;
  items: ITool[];
}

const Kbd = ({ children }: { children: string }) => (
  <kbd className="rounded-sm border border-rule px-1.5 py-0.5 font-mono text-xs text-muted">
    {children}
  </kbd>
);

const PaletteDialog = ({ onClose, tools }: Omit<ICommandPaletteProps, "open">) => {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const recentIds = useRecentTools();

  useFocusTrap(dialogRef, true, onClose);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sections: ISection[] = useMemo(() => {
    if (query.trim()) return [{ label: "Results", items: searchTools(tools, query) }];
    const recent = recentIds
      .map((id) => tools.find((tool) => tool.id === id))
      .filter((tool): tool is ITool => Boolean(tool));
    const rest = tools.filter((tool) => !recentIds.includes(tool.id));
    return recent.length > 0
      ? [
          { label: "Recent", items: recent },
          { label: "All tools", items: rest },
        ]
      : [{ label: "All tools", items: tools }];
  }, [query, tools, recentIds]);

  const options = useMemo(() => sections.flatMap((section) => section.items), [sections]);
  const optionId = (index: number) => `${listId}-option-${index}`;
  const safeActive = Math.min(active, Math.max(0, options.length - 1));

  const offsets = sections.map((_, i) =>
    sections.slice(0, i).reduce((total, section) => total + section.items.length, 0)
  );

  useEffect(() => {
    document.getElementById(`${listId}-option-${safeActive}`)?.scrollIntoView({ block: "nearest" });
  }, [listId, safeActive]);

  const choose = (tool: ITool) => {
    window.location.hash = routeHref(tool.id);
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (options.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((safeActive + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((safeActive - 1 + options.length) % options.length);
    } else if (event.key === "PageDown") {
      event.preventDefault();
      setActive(Math.min(options.length - 1, safeActive + 5));
    } else if (event.key === "PageUp") {
      event.preventDefault();
      setActive(Math.max(0, safeActive - 5));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(options[safeActive]);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        className={clsx(
          "absolute inset-x-0 top-0 flex max-h-[min(80dvh,34rem)] animate-pop-in flex-col overflow-hidden rounded-b-xl border border-rule bg-raised shadow-pop",
          "sm:inset-x-auto sm:left-1/2 sm:top-[12vh] sm:w-[min(36rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:rounded-xl"
        )}
      >
        <div className="flex items-center gap-3 border-b border-rule px-4">
          <HiOutlineMagnifyingGlass className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search tools, like json or image"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={options.length > 0 ? optionId(safeActive) : undefined}
            aria-label="Search tools"
            autoComplete="off"
            spellCheck={false}
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-muted/80 focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted hover:bg-tint hover:text-ink"
          >
            <HiXMark className="h-4 w-4" aria-hidden="true" />
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {options.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-ink">No tool matches "{query.trim()}".</p>
              <p className="mt-1 text-sm text-muted">
                Try a broader word like json, image, time or test.
              </p>
            </div>
          ) : (
            <div id={listId} role="listbox" aria-label="Tools">
              {sections.map((section, sectionIndex) => {
                const headingId = `${listId}-${section.label.replace(/\s+/g, "-")}`;
                return (
                  <div key={section.label} role="group" aria-labelledby={headingId} className="mb-2 last:mb-0">
                    <p id={headingId} className="px-3 pb-1 pt-2 text-xs font-medium text-muted">
                      {section.label}
                    </p>
                    {section.items.map((tool, itemIndex) => {
                      const current = offsets[sectionIndex] + itemIndex;
                      const Icon = tool.icon;
                      const selected = current === safeActive;
                      return (
                        <div
                          key={`${section.label}-${tool.id}`}
                          id={optionId(current)}
                          role="option"
                          aria-selected={selected}
                          onMouseMove={() => {
                            if (!selected) setActive(current);
                          }}
                          onClick={() => choose(tool)}
                          className={clsx(
                            "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5",
                            selected ? "bg-tint" : "bg-transparent"
                          )}
                        >
                          <Icon
                            className={clsx("h-5 w-5 shrink-0", selected ? "text-strong" : "text-muted")}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className={clsx("block text-sm", selected ? "font-semibold text-strong" : "font-medium text-ink")}>
                              {tool.name}
                            </span>
                            <span className="block truncate text-xs text-muted">{tool.description}</span>
                          </span>
                          <span className="hidden shrink-0 text-xs text-muted sm:block">{tool.group}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-rule px-4 py-2.5 text-xs text-muted sm:flex">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            to move
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>Enter</Kbd>
            to open
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>Esc</Kbd>
            to close
          </span>
          <span className="ml-auto">
            {options.length} {options.length === 1 ? "tool" : "tools"}
          </span>
        </div>
        <span className="sr-only" aria-live="polite">
          {query.trim() ? `${options.length} ${options.length === 1 ? "tool" : "tools"} found` : ""}
        </span>
      </div>
    </div>
  );
};

export const CommandPalette = ({ open, onClose, tools }: ICommandPaletteProps) =>
  open ? <PaletteDialog onClose={onClose} tools={tools} /> : null;
