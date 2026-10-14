import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { clsx } from "clsx";
import {
  HiOutlineCalendarDays,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { useFocusTrap } from "../../../hooks/use-focus-trap";
import {
  addDays,
  addMonths,
  formatDateKey,
  formatDateTime,
  isSameDay,
  parseDateTime,
} from "../../../utils/date-utils";

interface IDateTimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const monthLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const fullDayLabel = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const buildGrid = (view: Date): Date[] => {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};

export const DateTimeField = ({ label, value, onChange, error, hint }: IDateTimeFieldProps) => {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const [open, setOpen] = useState(false);
  const [focusDay, setFocusDay] = useState<Date>(() => new Date());
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);

  const selected = parseDateTime(value);
  const today = new Date();

  const close = () => setOpen(false);
  useFocusTrap(dialogRef, open, close);

  useEffect(() => {
    if (!open || !moveFocus.current) return;
    moveFocus.current = false;
    dialogRef.current
      ?.querySelector<HTMLButtonElement>(`[data-day="${formatDateKey(focusDay)}"]`)
      ?.focus();
  }, [open, focusDay]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (dialogRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const openPicker = () => {
    const base = parseDateTime(value) ?? new Date();
    moveFocus.current = true;
    setFocusDay(new Date(base.getFullYear(), base.getMonth(), base.getDate()));
    setOpen(true);
  };

  const focusOn = (date: Date) => {
    moveFocus.current = true;
    setFocusDay(date);
  };

  const choose = (day: Date) => {
    const time = selected ?? new Date(day.getFullYear(), day.getMonth(), day.getDate());
    onChange(
      formatDateTime(
        new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          time.getHours(),
          time.getMinutes(),
          time.getSeconds()
        )
      )
    );
    setOpen(false);
  };

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const weekday = (focusDay.getDay() + 6) % 7;
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDay, -1),
      ArrowRight: () => addDays(focusDay, 1),
      ArrowUp: () => addDays(focusDay, -7),
      ArrowDown: () => addDays(focusDay, 7),
      Home: () => addDays(focusDay, -weekday),
      End: () => addDays(focusDay, 6 - weekday),
      PageUp: () => addMonths(focusDay, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focusDay, event.shiftKey ? 12 : 1),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    focusOn(move());
  };

  const days = buildGrid(focusDay);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {hint && (
          <span id={hintId} className="text-sm text-muted">
            {hint}
          </span>
        )}
      </div>
      <div className="relative flex flex-wrap gap-2">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="2026-10-14 09:30:00"
          spellCheck={false}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={clsx(hint && hintId, error && errorId) || undefined}
          className={clsx(
            "h-12 min-w-0 flex-1 basis-64 rounded-lg border bg-raised px-4 font-mono text-lg text-ink placeholder:text-muted/80",
            error ? "border-danger" : "border-line"
          )}
        />
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? close() : openPicker())}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex h-12 items-center gap-2 rounded-lg border border-line bg-raised px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-tint"
        >
          <HiOutlineCalendarDays className="h-5 w-5" aria-hidden="true" />
          Pick a date
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-30 animate-fade-in bg-scrim sm:hidden" aria-hidden="true" />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Choose a date"
              className={clsx(
                "z-40 animate-pop-in border border-rule bg-raised p-4 shadow-pop",
                "fixed inset-x-0 bottom-0 rounded-t-xl",
                "sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-max sm:rounded-lg"
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setFocusDay(addMonths(focusDay, -1))}
                  className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm text-muted hover:bg-tint hover:text-ink"
                >
                  <HiChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </button>
                <h2 aria-live="polite" className="font-mono text-sm font-semibold text-ink">
                  {monthLabel(focusDay)}
                </h2>
                <button
                  type="button"
                  onClick={() => setFocusDay(addMonths(focusDay, 1))}
                  className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm text-muted hover:bg-tint hover:text-ink"
                >
                  Next
                  <HiChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <table className="mx-auto border-collapse">
                <thead>
                  <tr>
                    {WEEKDAYS.map((day) => (
                      <th key={day} scope="col" className="h-8 w-10 text-xs font-medium text-muted">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }, (_, week) => (
                    <tr key={week}>
                      {days.slice(week * 7, week * 7 + 7).map((day) => {
                        const inMonth = day.getMonth() === focusDay.getMonth();
                        const isSelected = selected ? isSameDay(day, selected) : false;
                        const isFocus = isSameDay(day, focusDay);
                        const isToday = isSameDay(day, today);
                        return (
                          <td key={formatDateKey(day)} className="p-0.5">
                            <button
                              type="button"
                              data-day={formatDateKey(day)}
                              tabIndex={isFocus ? 0 : -1}
                              aria-label={fullDayLabel(day)}
                              aria-pressed={isSelected}
                              aria-current={isToday ? "date" : undefined}
                              onClick={() => choose(day)}
                              onKeyDown={handleDayKeyDown}
                              className={clsx(
                                "relative h-9 w-9 rounded-md font-mono text-sm tabular-nums transition-colors duration-150",
                                isSelected
                                  ? "bg-primary font-semibold text-on-primary"
                                  : inMonth
                                    ? "text-ink hover:bg-tint"
                                    : "text-muted/70 hover:bg-tint",
                                isToday && !isSelected && "font-semibold text-strong underline underline-offset-4"
                              )}
                            >
                              {day.getDate()}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-rule pt-3">
                <button
                  type="button"
                  onClick={() => focusOn(new Date(today.getFullYear(), today.getMonth(), today.getDate()))}
                  className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-strong hover:bg-tint"
                >
                  Go to today
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted hover:bg-tint hover:text-ink"
                >
                  Cancel
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">
                Arrow keys move by day and week. Page Up and Page Down change month.
              </p>
            </div>
          </>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-sm text-danger">
          <HiOutlineExclamationTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};
