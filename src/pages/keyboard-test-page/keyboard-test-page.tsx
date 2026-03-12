import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import {
  HiOutlineComputerDesktop,
  HiOutlineTrash,
} from "react-icons/hi2";
import { Button } from "../../components/common/button/button";

interface IKeyEvent {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  location: number;
  repeat: boolean;
  timestamp: number;
}

const KEYBOARD_ROWS: string[][] = [
  ["Escape", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"],
  ["Backquote", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "Backspace"],
  ["Tab", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", "Backslash"],
  ["CapsLock", "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", "Enter"],
  ["ShiftLeft", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "ShiftRight"],
  ["ControlLeft", "MetaLeft", "AltLeft", "Space", "AltRight", "MetaRight", "ControlRight"],
];

const KEY_LABELS: Record<string, string> = {
  Escape: "Esc",
  Backquote: "`",
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",
  Digit0: "0",
  Minus: "-",
  Equal: "=",
  Backspace: "Backspace",
  Tab: "Tab",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  CapsLock: "Caps",
  Semicolon: ";",
  Quote: "'",
  Enter: "Enter",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
  ControlLeft: "Ctrl",
  ControlRight: "Ctrl",
  MetaLeft: "Win",
  MetaRight: "Win",
  AltLeft: "Alt",
  AltRight: "Alt",
  Space: "Space",
  Comma: ",",
  Period: ".",
  Slash: "/",
  KeyQ: "Q",
  KeyW: "W",
  KeyE: "E",
  KeyR: "R",
  KeyT: "T",
  KeyY: "Y",
  KeyU: "U",
  KeyI: "I",
  KeyO: "O",
  KeyP: "P",
  KeyA: "A",
  KeyS: "S",
  KeyD: "D",
  KeyF: "F",
  KeyG: "G",
  KeyH: "H",
  KeyJ: "J",
  KeyK: "K",
  KeyL: "L",
  KeyZ: "Z",
  KeyX: "X",
  KeyC: "C",
  KeyV: "V",
  KeyB: "B",
  KeyN: "N",
  KeyM: "M",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
};

const WIDE_KEYS = new Set([
  "Backspace",
  "Tab",
  "CapsLock",
  "Enter",
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
]);

const EXTRA_WIDE_KEYS = new Set(["Space"]);

const getLocationLabel = (location: number): string => {
  switch (location) {
    case 0:
      return "Standard";
    case 1:
      return "Left";
    case 2:
      return "Right";
    case 3:
      return "Numpad";
    default:
      return "Unknown";
  }
};

export const KeyboardTestPage = () => {
  const [lastEvent, setLastEvent] = useState<IKeyEvent | null>(null);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [pressedHistory, setPressedHistory] = useState<Set<string>>(new Set());
  const [keyCount, setKeyCount] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    const keyEvent: IKeyEvent = {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      which: e.which,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
      location: e.location,
      repeat: e.repeat,
      timestamp: Date.now(),
    };
    setLastEvent(keyEvent);
    setActiveKeys((prev) => new Set(prev).add(e.code));
    setPressedHistory((prev) => new Set(prev).add(e.code));
    if (!e.repeat) {
      setKeyCount((prev) => prev + 1);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    setActiveKeys((prev) => {
      const next = new Set(prev);
      next.delete(e.code);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleClear = () => {
    setLastEvent(null);
    setActiveKeys(new Set());
    setPressedHistory(new Set());
    setKeyCount(0);
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineComputerDesktop className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              Keyboard Test
            </h2>
            <p className="text-sm text-dark-400">
              Press any key to test your keyboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700">
            <span className="text-sm text-dark-400">Keys pressed:</span>
            <span className="text-sm font-semibold text-accent-400">
              {keyCount}
            </span>
          </div>
          <Button
            label="Reset"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            icon={HiOutlineTrash}
          />
        </div>
      </div>

      {lastEvent && (
        <div className="mb-6 p-4 rounded-xl bg-dark-900 border border-dark-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-dark-500 uppercase tracking-wider">Key</span>
              <p className="text-lg font-semibold text-dark-100 mt-1">
                {lastEvent.key === " " ? "Space" : lastEvent.key}
              </p>
            </div>
            <div>
              <span className="text-xs text-dark-500 uppercase tracking-wider">Code</span>
              <p className="text-lg font-semibold text-dark-100 mt-1">{lastEvent.code}</p>
            </div>
            <div>
              <span className="text-xs text-dark-500 uppercase tracking-wider">Key Code</span>
              <p className="text-lg font-semibold text-dark-100 mt-1">{lastEvent.keyCode}</p>
            </div>
            <div>
              <span className="text-xs text-dark-500 uppercase tracking-wider">Location</span>
              <p className="text-lg font-semibold text-dark-100 mt-1">
                {getLocationLabel(lastEvent.location)}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            {lastEvent.ctrlKey && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-600/10 text-accent-400">
                Ctrl
              </span>
            )}
            {lastEvent.shiftKey && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-600/10 text-accent-400">
                Shift
              </span>
            )}
            {lastEvent.altKey && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-600/10 text-accent-400">
                Alt
              </span>
            )}
            {lastEvent.metaKey && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-600/10 text-accent-400">
                Meta
              </span>
            )}
            {lastEvent.repeat && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-warning-500/10 text-warning-400">
                Repeat
              </span>
            )}
          </div>
        </div>
      )}

      {!lastEvent && (
        <div className="mb-6 p-4 rounded-xl bg-dark-900 border border-dark-700 flex items-center justify-center">
          <p className="text-dark-500 text-sm">Press any key to see details here</p>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col gap-1.5 w-full max-w-4xl">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1.5 justify-center">
              {row.map((code) => {
                const isActive = activeKeys.has(code);
                const wasPressed = pressedHistory.has(code);
                const label = KEY_LABELS[code] || code;
                const isWide = WIDE_KEYS.has(code);
                const isExtraWide = EXTRA_WIDE_KEYS.has(code);

                return (
                  <div
                    key={code}
                    className={clsx(
                      "flex items-center justify-center rounded-lg border text-xs font-medium transition-all duration-100 select-none",
                      "h-10",
                      isExtraWide ? "flex-1 min-w-[200px]" : isWide ? "w-16 md:w-20" : "w-10 md:w-12",
                      isActive
                        ? "bg-accent-600 border-accent-500 text-white scale-95 shadow-lg shadow-accent-600/30"
                        : wasPressed
                          ? "bg-success-500/10 border-success-500/30 text-success-400"
                          : "bg-dark-800 border-dark-700 text-dark-400 hover:border-dark-600"
                    )}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
