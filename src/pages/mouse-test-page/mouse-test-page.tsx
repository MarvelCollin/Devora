import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { HiArrowPath } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";

interface IPoint {
  x: number;
  y: number;
}

interface IMouseCounts {
  clicks: Record<number, number>;
  scrollUp: number;
  scrollDown: number;
}

const BUTTONS: { id: number; label: string }[] = [
  { id: 0, label: "Left" },
  { id: 1, label: "Middle" },
  { id: 2, label: "Right" },
  { id: 3, label: "Back" },
  { id: 4, label: "Forward" },
];

const EMPTY_COUNTS: IMouseCounts = { clicks: {}, scrollUp: 0, scrollDown: 0 };
const TRAIL_LENGTH = 80;

export const MouseTestPage = () => {
  const areaRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState<IMouseCounts>(EMPTY_COUNTS);
  const [held, setHeld] = useState<Set<number>>(new Set());
  const [position, setPosition] = useState<IPoint | null>(null);
  const [trail, setTrail] = useState<IPoint[]>([]);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    const pointIn = (event: MouseEvent): IPoint => {
      const rect = area.getBoundingClientRect();
      return { x: Math.round(event.clientX - rect.left), y: Math.round(event.clientY - rect.top) };
    };

    const handleMove = (event: MouseEvent) => {
      const point = pointIn(event);
      setPosition(point);
      setTrail((prev) => [...prev.slice(-(TRAIL_LENGTH - 1)), point]);
    };

    const handleDown = (event: MouseEvent) => {
      event.preventDefault();
      setHeld((prev) => new Set(prev).add(event.button));
      setCounts((prev) => ({
        ...prev,
        clicks: { ...prev.clicks, [event.button]: (prev.clicks[event.button] ?? 0) + 1 },
      }));
    };

    const handleUp = (event: MouseEvent) => {
      setHeld((prev) => {
        if (!prev.has(event.button)) return prev;
        const next = new Set(prev);
        next.delete(event.button);
        return next;
      });
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setCounts((prev) => ({
        ...prev,
        scrollUp: event.deltaY < 0 ? prev.scrollUp + 1 : prev.scrollUp,
        scrollDown: event.deltaY > 0 ? prev.scrollDown + 1 : prev.scrollDown,
      }));
    };

    const handleLeave = () => setPosition(null);
    const blockMenu = (event: MouseEvent) => event.preventDefault();

    area.addEventListener("mousemove", handleMove);
    area.addEventListener("mousedown", handleDown);
    area.addEventListener("mouseleave", handleLeave);
    area.addEventListener("wheel", handleWheel, { passive: false });
    area.addEventListener("contextmenu", blockMenu);
    window.addEventListener("mouseup", handleUp);
    return () => {
      area.removeEventListener("mousemove", handleMove);
      area.removeEventListener("mousedown", handleDown);
      area.removeEventListener("mouseleave", handleLeave);
      area.removeEventListener("wheel", handleWheel);
      area.removeEventListener("contextmenu", blockMenu);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const reset = () => {
    setCounts(EMPTY_COUNTS);
    setHeld(new Set());
    setTrail([]);
    setPosition(null);
  };

  const clicksFor = (button: number) => counts.clicks[button] ?? 0;
  const totalClicks = Object.values(counts.clicks).reduce((sum, value) => sum + value, 0);
  const buttonsTested = BUTTONS.filter((button) => clicksFor(button.id) > 0).length;
  const trailPath = trail.map((point, i) => `${i === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  const lastPoint = trail[trail.length - 1];

  return (
    <ToolPage
      title="Mouse Test"
      description="Click, scroll and move inside the test area. Right click and scrolling are captured there, not by the page."
      fill
      actions={
        <Button label="Reset test" variant="secondary" icon={HiArrowPath} onClick={reset} />
      }
    >
      <SummaryStrip
        label="Mouse test results"
        items={[
          {
            label: "Clicks",
            value: totalClicks.toLocaleString(),
            context: `${buttonsTested} of ${BUTTONS.length} buttons tested`,
            lead: true,
          },
          { label: "Left", value: clicksFor(0) },
          { label: "Middle", value: clicksFor(1) },
          { label: "Right", value: clicksFor(2) },
          { label: "Scroll up", value: counts.scrollUp },
          { label: "Scroll down", value: counts.scrollDown },
        ]}
      />

      <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <section aria-labelledby="buttons-heading" className="flex flex-col gap-2">
          <h2 id="buttons-heading" className="text-sm font-medium text-ink">
            Buttons
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-1">
            {BUTTONS.map((button) => {
              const isHeld = held.has(button.id);
              const wasTested = clicksFor(button.id) > 0;
              const state = isHeld ? "Held now" : wasTested ? "Tested" : "Not tested";
              return (
                <li
                  key={button.id}
                  className={clsx(
                    "flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors duration-100",
                    isHeld
                      ? "border-primary bg-primary text-on-primary"
                      : wasTested
                        ? "border-line bg-tint text-strong"
                        : "border-rule bg-raised text-muted"
                  )}
                >
                  <span className="text-sm font-semibold">{button.label}</span>
                  <span className="text-xs">{state}</span>
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-muted">
            Back and Forward only register on mice that have side buttons.
          </p>
        </section>

        <div
          ref={areaRef}
          role="img"
          aria-label="Mouse test area. Move, click and scroll here."
          className="relative min-h-80 cursor-crosshair select-none overflow-hidden rounded-xl border border-line bg-surface"
        >
          <p className="absolute left-3 top-3 font-mono text-xs tabular-nums text-muted">
            {position ? `x ${position.x}, y ${position.y}` : "Pointer outside"}
          </p>
          {trail.length === 0 && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-muted">
              Move your mouse here to draw a trail
            </p>
          )}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            {trail.length > 1 && (
              <path
                d={trailPath}
                fill="none"
                stroke="var(--color-strong)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.7}
              />
            )}
            {lastPoint && (
              <circle cx={lastPoint.x} cy={lastPoint.y} r={5} fill="var(--color-primary)" />
            )}
          </svg>
        </div>
      </div>
    </ToolPage>
  );
};
