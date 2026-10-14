import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { HiArrowPath, HiOutlineArrowsPointingOut } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";
import { Notice } from "../../components/common/notice/notice";

const COLS = 12;
const ROWS = 8;
const COLORS = ["#0f6353", "#c8743f", "#3f6fb0", "#a3485a", "#6b7f2a", "#7a5aa8", "#2f8a8a", "#b0892a", "#4f5b66", "#c0567f"];

interface ITouch {
  x: number;
  y: number;
  color: string;
  number: number;
  type: string;
  pressure: number;
}

export const TouchscreenTestPage = () => {
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPoint = useRef(new Map<number, { x: number; y: number; color: string }>());
  const nextNumber = useRef(1);
  const [touches, setTouches] = useState<Map<number, ITouch>>(new Map());
  const [maxTouches, setMaxTouches] = useState(0);
  const [covered, setCovered] = useState<Set<number>>(new Set());
  const [strokes, setStrokes] = useState(0);
  const [lastType, setLastType] = useState<string | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const area = areaRef.current;
    if (!canvas || !area) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = area.clientWidth * dpr;
    canvas.height = area.clientHeight * dpr;
    canvas.getContext("2d")?.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("fullscreenchange", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("fullscreenchange", resizeCanvas);
    };
  }, [resizeCanvas]);

  const localPoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height };
  };

  const markCell = (x: number, y: number, width: number, height: number) => {
    const col = Math.min(COLS - 1, Math.max(0, Math.floor((x / width) * COLS)));
    const row = Math.min(ROWS - 1, Math.max(0, Math.floor((y / height) * ROWS)));
    const cell = row * COLS + col;
    setCovered((previous) => (previous.has(cell) ? previous : new Set(previous).add(cell)));
  };

  const handleDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = localPoint(event);
    const number = nextNumber.current;
    nextNumber.current = (nextNumber.current % 99) + 1;
    const color = COLORS[(number - 1) % COLORS.length];
    lastPoint.current.set(event.pointerId, { x: point.x, y: point.y, color });
    setStrokes((count) => count + 1);
    setLastType(event.pointerType);
    setTouches((previous) => {
      const next = new Map(previous).set(event.pointerId, {
        x: point.x,
        y: point.y,
        color,
        number: previous.size + 1,
        type: event.pointerType,
        pressure: event.pressure,
      });
      setMaxTouches((max) => Math.max(max, next.size));
      return next;
    });
    markCell(point.x, point.y, point.width, point.height);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const last = lastPoint.current.get(event.pointerId);
    if (!last) return;
    const point = localPoint(event);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = last.color;
      ctx.lineWidth = event.pointerType === "pen" ? 1 + event.pressure * 6 : 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    lastPoint.current.set(event.pointerId, { ...last, x: point.x, y: point.y });
    const steps = Math.max(1, Math.ceil(Math.hypot(point.x - last.x, point.y - last.y) / 8));
    for (let i = 1; i <= steps; i += 1) {
      markCell(last.x + ((point.x - last.x) * i) / steps, last.y + ((point.y - last.y) * i) / steps, point.width, point.height);
    }
    setTouches((previous) => {
      const current = previous.get(event.pointerId);
      if (!current) return previous;
      return new Map(previous).set(event.pointerId, { ...current, x: point.x, y: point.y, pressure: event.pressure });
    });
  };

  const handleUp = (event: PointerEvent<HTMLDivElement>) => {
    lastPoint.current.delete(event.pointerId);
    setTouches((previous) => {
      if (!previous.has(event.pointerId)) return previous;
      const next = new Map(previous);
      next.delete(event.pointerId);
      return next;
    });
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setCovered(new Set());
    setMaxTouches(0);
    setStrokes(0);
    nextNumber.current = 1;
  };

  const goFullScreen = () => {
    areaRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  const coverage = Math.round((covered.size / (COLS * ROWS)) * 100);
  const hasTouch = navigator.maxTouchPoints > 0;
  const pen = [...touches.values()].find((touch) => touch.type === "pen");

  return (
    <ToolPage
      title="Touchscreen Test"
      description="Draw with one or more fingers to check that every part of the screen responds and how many touches it can track at once."
      actions={
        <>
          <Button label="Full screen" variant="secondary" icon={HiOutlineArrowsPointingOut} onClick={goFullScreen} />
          <Button label="Clear" variant="ghost" icon={HiArrowPath} onClick={clear} />
        </>
      }
    >
      {!hasTouch && (
        <Notice tone="info">
          This device does not report a touch screen. You can still draw with a mouse or pen to try the test.
        </Notice>
      )}
      <SummaryStrip
        label="Touch summary"
        items={[
          {
            label: "Screen covered",
            value: `${coverage}%`,
            context: coverage === 100 ? "Every area responded" : "Draw over the gray squares",
            lead: true,
          },
          {
            label: "Touching now",
            value: touches.size,
            context: `Most at once: ${maxTouches}`,
          },
          {
            label: "Supported touches",
            value: navigator.maxTouchPoints || "None",
            context: "Reported by the device",
          },
          {
            label: "Last input",
            value: lastType ? lastType.charAt(0).toUpperCase() + lastType.slice(1) : "None yet",
            context: pen ? `Pen pressure ${Math.round(pen.pressure * 100)}%` : `${strokes} ${strokes === 1 ? "stroke" : "strokes"}`,
          },
        ]}
      />

      <div
        ref={areaRef}
        role="application"
        aria-label="Touch test area. Draw here with your fingers."
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onContextMenu={(event) => event.preventDefault()}
        className="relative h-[60dvh] min-h-80 touch-none select-none overflow-hidden rounded-xl border border-line bg-raised"
      >
        <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }} aria-hidden="true">
          {Array.from({ length: COLS * ROWS }, (_, cell) => (
            <span
              key={cell}
              className={covered.has(cell) ? "border border-rule/40 bg-tint" : "border border-rule/40 bg-surface"}
            />
          ))}
        </div>
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        {[...touches.values()].map((touch) => (
          <span
            key={`${touch.number}-${touch.color}`}
            className="pointer-events-none absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 font-mono text-sm font-semibold text-ink"
            style={{ left: touch.x, top: touch.y, borderColor: touch.color, backgroundColor: "color-mix(in oklch, var(--color-raised) 70%, transparent)" }}
            aria-hidden="true"
          >
            {touch.number}
          </span>
        ))}
        {strokes === 0 && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-muted">
            Touch and draw anywhere here. Gray squares have not been touched yet.
          </p>
        )}
      </div>
    </ToolPage>
  );
};

