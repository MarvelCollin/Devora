import { useState, useEffect, useCallback, useRef } from "react";
import { clsx } from "clsx";
import {
  HiOutlineCursorArrowRays,
  HiOutlineTrash,
} from "react-icons/hi2";
import { Button } from "../../components/common/button/button";

interface IMouseState {
  x: number;
  y: number;
  relativeX: number;
  relativeY: number;
  leftClicks: number;
  rightClicks: number;
  middleClicks: number;
  scrollUp: number;
  scrollDown: number;
  activeButtons: Set<number>;
  pressedButtons: Set<number>;
}

const BUTTON_LABELS: Record<number, string> = {
  0: "Left",
  1: "Middle",
  2: "Right",
  3: "Back",
  4: "Forward",
};

export const MouseTestPage = () => {
  const areaRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<IMouseState>({
    x: 0,
    y: 0,
    relativeX: 0,
    relativeY: 0,
    leftClicks: 0,
    rightClicks: 0,
    middleClicks: 0,
    scrollUp: 0,
    scrollDown: 0,
    activeButtons: new Set(),
    pressedButtons: new Set(),
  });
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const area = areaRef.current;
    let relX = 0;
    let relY = 0;
    if (area) {
      const rect = area.getBoundingClientRect();
      relX = Math.round(e.clientX - rect.left);
      relY = Math.round(e.clientY - rect.top);
    }
    setState((prev) => ({
      ...prev,
      x: e.clientX,
      y: e.clientY,
      relativeX: relX,
      relativeY: relY,
    }));
    if (area) {
      const rect = area.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        setTrail((prev) => {
          const next = [...prev, { x: relX, y: relY }];
          if (next.length > 80) return next.slice(next.length - 80);
          return next;
        });
      }
    }
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    setState((prev) => {
      const newActive = new Set(prev.activeButtons);
      newActive.add(e.button);
      const newPressed = new Set(prev.pressedButtons);
      newPressed.add(e.button);
      return {
        ...prev,
        activeButtons: newActive,
        pressedButtons: newPressed,
        leftClicks: e.button === 0 ? prev.leftClicks + 1 : prev.leftClicks,
        rightClicks: e.button === 2 ? prev.rightClicks + 1 : prev.rightClicks,
        middleClicks: e.button === 1 ? prev.middleClicks + 1 : prev.middleClicks,
      };
    });
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    setState((prev) => {
      const newActive = new Set(prev.activeButtons);
      newActive.delete(e.button);
      return { ...prev, activeButtons: newActive };
    });
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setState((prev) => ({
      ...prev,
      scrollUp: e.deltaY < 0 ? prev.scrollUp + 1 : prev.scrollUp,
      scrollDown: e.deltaY > 0 ? prev.scrollDown + 1 : prev.scrollDown,
    }));
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.addEventListener("mousemove", handleMouseMove);
    area.addEventListener("mousedown", handleMouseDown);
    area.addEventListener("mouseup", handleMouseUp);
    area.addEventListener("wheel", handleWheel, { passive: false });
    area.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      area.removeEventListener("mousemove", handleMouseMove);
      area.removeEventListener("mousedown", handleMouseDown);
      area.removeEventListener("mouseup", handleMouseUp);
      area.removeEventListener("wheel", handleWheel);
      area.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp, handleWheel, handleContextMenu]);

  const handleClear = () => {
    setState({
      x: 0,
      y: 0,
      relativeX: 0,
      relativeY: 0,
      leftClicks: 0,
      rightClicks: 0,
      middleClicks: 0,
      scrollUp: 0,
      scrollDown: 0,
      activeButtons: new Set(),
      pressedButtons: new Set(),
    });
    setTrail([]);
  };

  const totalClicks = state.leftClicks + state.rightClicks + state.middleClicks;

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineCursorArrowRays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              Mouse Test
            </h2>
            <p className="text-sm text-dark-400">
              Click, scroll, and move your mouse to test it
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700">
            <span className="text-sm text-dark-400">Total clicks:</span>
            <span className="text-sm font-semibold text-accent-400">
              {totalClicks}
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

      <div className="mb-6 p-4 rounded-xl bg-dark-900 border border-dark-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-dark-500 uppercase tracking-wider">Position</span>
            <p className="text-lg font-semibold text-dark-100 mt-1">
              {state.x}, {state.y}
            </p>
          </div>
          <div>
            <span className="text-xs text-dark-500 uppercase tracking-wider">Left Clicks</span>
            <p className="text-lg font-semibold text-dark-100 mt-1">{state.leftClicks}</p>
          </div>
          <div>
            <span className="text-xs text-dark-500 uppercase tracking-wider">Right Clicks</span>
            <p className="text-lg font-semibold text-dark-100 mt-1">{state.rightClicks}</p>
          </div>
          <div>
            <span className="text-xs text-dark-500 uppercase tracking-wider">Middle Clicks</span>
            <p className="text-lg font-semibold text-dark-100 mt-1">{state.middleClicks}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-4 w-48 shrink-0">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider px-1">
              Buttons
            </span>
            {[0, 1, 2, 3, 4].map((btn) => {
              const isActive = state.activeButtons.has(btn);
              const wasPressed = state.pressedButtons.has(btn);
              return (
                <div
                  key={btn}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-100",
                    isActive
                      ? "bg-accent-600 border-accent-500 text-white shadow-lg shadow-accent-600/30"
                      : wasPressed
                        ? "bg-success-500/10 border-success-500/30 text-success-400"
                        : "bg-dark-800 border-dark-700 text-dark-400"
                  )}
                >
                  <div
                    className={clsx(
                      "w-2.5 h-2.5 rounded-full",
                      isActive
                        ? "bg-white"
                        : wasPressed
                          ? "bg-success-400"
                          : "bg-dark-600"
                    )}
                  />
                  <span className="text-sm font-medium">
                    {BUTTON_LABELS[btn] || `Button ${btn}`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider px-1">
              Scroll
            </span>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-dark-800 border-dark-700">
              <span className="text-sm text-dark-400">Up</span>
              <span className={clsx(
                "text-sm font-semibold",
                state.scrollUp > 0 ? "text-success-400" : "text-dark-500"
              )}>
                {state.scrollUp}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-dark-800 border-dark-700">
              <span className="text-sm text-dark-400">Down</span>
              <span className={clsx(
                "text-sm font-semibold",
                state.scrollDown > 0 ? "text-success-400" : "text-dark-500"
              )}>
                {state.scrollDown}
              </span>
            </div>
          </div>
        </div>

        <div
          ref={areaRef}
          className="flex-1 rounded-xl bg-dark-900 border border-dark-700 relative overflow-hidden cursor-crosshair select-none"
        >
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="text-xs text-dark-500">
              {state.relativeX}, {state.relativeY}
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {trail.length === 0 && (
              <p className="text-dark-600 text-sm">Move your mouse here to draw a trail</p>
            )}
          </div>
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {trail.length > 1 &&
              trail.map((point, i) => {
                if (i === 0) return null;
                const prev = trail[i - 1];
                const opacity = (i / trail.length) * 0.8 + 0.2;
                return (
                  <line
                    key={i}
                    x1={prev.x}
                    y1={prev.y}
                    x2={point.x}
                    y2={point.y}
                    stroke={`rgba(99, 102, 241, ${opacity})`}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                );
              })}
          </svg>
          {trail.length > 0 && (
            <div
              className="absolute w-3 h-3 rounded-full bg-accent-500 shadow-lg shadow-accent-500/50 pointer-events-none"
              style={{
                left: trail[trail.length - 1].x - 6,
                top: trail[trail.length - 1].y - 6,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
