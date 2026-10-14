import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { clsx } from "clsx";
import { HiArrowPath, HiOutlineCheckCircle, HiOutlinePauseCircle } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";

interface IKeyEvent {
  key: string;
  code: string;
  keyCode: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  location: number;
  repeat: boolean;
}

const KEYBOARD_ROWS: string[][] = [
  ["Escape", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"],
  ["Backquote", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "Backspace"],
  ["Tab", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", "Backslash"],
  ["CapsLock", "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", "Enter"],
  ["ShiftLeft", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "ShiftRight"],
  ["ControlLeft", "MetaLeft", "AltLeft", "Space", "AltRight", "MetaRight", "ControlRight"],
];

const ALL_KEYS = new Set(KEYBOARD_ROWS.flat());

const KEY_LABELS: Record<string, string> = {
  Escape: "Esc",
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  Backspace: "Backspace",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  CapsLock: "Caps",
  Semicolon: ";",
  Quote: "'",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
  ControlLeft: "Ctrl",
  ControlRight: "Ctrl",
  MetaLeft: "Win",
  MetaRight: "Win",
  AltLeft: "Alt",
  AltRight: "Alt",
  Comma: ",",
  Period: ".",
  Slash: "/",
};

const keyLabel = (code: string) =>
  KEY_LABELS[code] ?? code.replace(/^Key/, "").replace(/^Digit/, "");

const KEY_WIDTHS: Record<string, string> = {
  Backspace: "flex-[2]",
  Tab: "flex-[1.5]",
  Backslash: "flex-[1.5]",
  CapsLock: "flex-[1.75]",
  Enter: "flex-[2.25]",
  ShiftLeft: "flex-[2.25]",
  ShiftRight: "flex-[2.75]",
  ControlLeft: "flex-[1.25]",
  ControlRight: "flex-[1.25]",
  MetaLeft: "flex-[1.25]",
  MetaRight: "flex-[1.25]",
  AltLeft: "flex-[1.25]",
  AltRight: "flex-[1.25]",
  Space: "flex-[6.25]",
};

const LOCATIONS = ["Standard", "Left", "Right", "Numpad"];

export const KeyboardTestPage = () => {
  const areaRef = useRef<HTMLDivElement>(null);
  const [lastEvent, setLastEvent] = useState<IKeyEvent | null>(null);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [tested, setTested] = useState<Set<string>>(new Set());
  const [presses, setPresses] = useState(0);
  const [listening, setListening] = useState(false);

  const record = useCallback(
    (event: globalThis.KeyboardEvent | KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Tab") event.preventDefault();
      setLastEvent({
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        location: event.location,
        repeat: event.repeat,
      });
      setActiveKeys((prev) => new Set(prev).add(event.code));
      setTested((prev) => (prev.has(event.code) ? prev : new Set(prev).add(event.code)));
      if (!event.repeat) setPresses((prev) => prev + 1);
    },
    []
  );

  useEffect(() => {
    areaRef.current?.focus();
    const handleIdleKeyDown = (event: globalThis.KeyboardEvent) => {
      const active = document.activeElement;
      const idle =
        !active || active === document.body || active.id === "page-title" || active.id === "main";
      if (!idle || event.key === "Tab" || event.target !== active) return;
      areaRef.current?.focus();
      record(event);
    };
    const handleKeyUp = (event: globalThis.KeyboardEvent) => {
      setActiveKeys((prev) => {
        if (!prev.has(event.code)) return prev;
        const next = new Set(prev);
        next.delete(event.code);
        return next;
      });
    };
    window.addEventListener("keydown", handleIdleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleIdleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [record]);

  const reset = () => {
    setLastEvent(null);
    setActiveKeys(new Set());
    setTested(new Set());
    setPresses(0);
    areaRef.current?.focus();
  };

  const testedOnBoard = [...tested].filter((code) => ALL_KEYS.has(code)).length;
  const modifiers = lastEvent
    ? [
        lastEvent.ctrlKey && "Ctrl",
        lastEvent.shiftKey && "Shift",
        lastEvent.altKey && "Alt",
        lastEvent.metaKey && "Meta",
      ].filter(Boolean)
    : [];

  return (
    <ToolPage
      title="Keyboard Test"
      description="Press keys to see which ones register. Keys light up while held and stay marked once tested."
      actions={
        <Button label="Reset test" variant="secondary" icon={HiArrowPath} onClick={reset} />
      }
    >
      <SummaryStrip
        label="Keyboard test results"
        items={[
          {
            label: "Keys tested",
            value: `${testedOnBoard} of ${ALL_KEYS.size}`,
            context: `${presses.toLocaleString()} presses in total`,
            lead: true,
          },
          {
            label: "Last key",
            value: lastEvent ? (lastEvent.key === " " ? "Space" : lastEvent.key) : "None yet",
            context: modifiers.length > 0 ? `With ${modifiers.join(" and ")}` : "No modifiers",
          },
          { label: "Code", value: lastEvent?.code || "None yet" },
          { label: "Key code", value: lastEvent ? String(lastEvent.keyCode) : "None yet" },
          {
            label: "Location",
            value: lastEvent ? LOCATIONS[lastEvent.location] ?? "Unknown" : "None yet",
            context: lastEvent?.repeat ? "Held down and repeating" : undefined,
          },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm" aria-live="polite">
          {listening ? (
            <>
              <HiOutlineCheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
              <span className="font-medium text-success">Listening.</span>
              <span className="text-muted">Tab moves focus out of the test area.</span>
            </>
          ) : (
            <>
              <HiOutlinePauseCircle className="h-5 w-5 text-warning" aria-hidden="true" />
              <span className="font-medium text-warning">Paused.</span>
              <span className="text-muted">Press any key or click the keyboard below to keep testing.</span>
            </>
          )}
        </p>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted" aria-label="Legend">
          <li className="flex items-center gap-2">
            <span className="h-4 w-5 rounded-sm bg-primary" aria-hidden="true" />
            Held now
          </li>
          <li className="flex items-center gap-2">
            <span className="h-4 w-5 rounded-sm border border-line bg-tint shadow-[inset_0_-3px_0_var(--color-primary)]" aria-hidden="true" />
            Tested
          </li>
          <li className="flex items-center gap-2">
            <span className="h-4 w-5 rounded-sm border border-rule bg-raised" aria-hidden="true" />
            Not tested
          </li>
        </ul>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          ref={areaRef}
          tabIndex={0}
          role="application"
          aria-label="Keyboard test area. Press any key to test it."
          aria-roledescription="keyboard tester"
          onKeyDown={record}
          onFocus={() => setListening(true)}
          onBlur={() => {
            setListening(false);
            setActiveKeys(new Set());
          }}
          onClick={() => areaRef.current?.focus()}
          className={clsx(
            "mx-auto flex min-w-[46rem] max-w-5xl flex-col gap-1.5 rounded-xl border bg-surface p-3 transition-colors duration-150",
            listening ? "border-line" : "border-rule"
          )}
        >
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className={clsx("flex gap-1.5", rowIndex === 0 && "mb-2")}>
              {row.map((code) => {
                const isActive = activeKeys.has(code);
                const wasTested = tested.has(code);
                return (
                  <div
                    key={code}
                    className={clsx(
                      "flex h-11 min-w-0 flex-1 select-none items-center justify-center rounded-md border font-mono text-xs transition-[background-color,color,transform] duration-100",
                      KEY_WIDTHS[code],
                      isActive
                        ? "translate-y-px border-primary bg-primary font-semibold text-on-primary"
                        : wasTested
                          ? "border-line bg-tint font-semibold text-strong shadow-[inset_0_-3px_0_var(--color-primary)]"
                          : "border-rule bg-raised text-muted"
                    )}
                  >
                    {keyLabel(code)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </ToolPage>
  );
};
