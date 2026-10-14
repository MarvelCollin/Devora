import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { HiArrowPath, HiOutlineArrowsPointingOut } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";
import { ValueList } from "../../components/common/value-list/value-list";

const PATTERNS: { name: string; background: string; hint: string }[] = [
  { name: "Black", background: "#000000", hint: "Bright dots here are stuck pixels." },
  { name: "White", background: "#ffffff", hint: "Dark dots here are dead pixels." },
  { name: "Red", background: "#ff0000", hint: "Look for dots that are not red." },
  { name: "Green", background: "#00ff00", hint: "Look for dots that are not green." },
  { name: "Blue", background: "#0000ff", hint: "Look for dots that are not blue." },
  { name: "Gray", background: "#808080", hint: "Look for uneven patches or light bleed." },
  {
    name: "Gradient",
    background: "linear-gradient(to right, #000000, #ffffff)",
    hint: "The fade should be smooth with no visible bands.",
  },
  {
    name: "Color gradient",
    background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
    hint: "Colors should blend with no sharp steps.",
  },
];

const COMMON_RATES = [24, 30, 48, 50, 60, 72, 75, 85, 90, 100, 120, 144, 160, 165, 170, 180, 200, 240, 280, 360];

const measureRefreshRate = (): Promise<number> =>
  new Promise((resolve) => {
    const stamps: number[] = [];
    const tick = (time: number) => {
      stamps.push(time);
      if (stamps.length < 90) requestAnimationFrame(tick);
      else {
        const gaps = stamps.slice(1).map((stamp, i) => stamp - stamps[i]).sort((a, b) => a - b);
        const median = gaps[Math.floor(gaps.length / 2)];
        const hz = 1000 / median;
        const nearest = COMMON_RATES.reduce((best, rate) => (Math.abs(rate - hz) < Math.abs(best - hz) ? rate : best));
        resolve(Math.abs(nearest - hz) < 4 ? nearest : Math.round(hz));
      }
    };
    requestAnimationFrame(tick);
  });

const matches = (query: string) => window.matchMedia(query).matches;

const colorGamut = () =>
  matches("(color-gamut: rec2020)") ? "Rec. 2020" : matches("(color-gamut: p3)") ? "Display P3" : "sRGB";

const FullScreenTest = ({ onClose }: { onClose: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const pattern = PATTERNS[index];

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.focus();
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(() => undefined);
    }
    const handleChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    };
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3500);
    return () => clearTimeout(timer);
  }, [index]);

  const go = (step: number) => {
    setIndex((current) => (current + step + PATTERNS.length) % PATTERNS.length);
    setShowHint(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " " || event.key === "ArrowRight" || event.key === "Enter") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Screen test, ${pattern.name}`}
      onKeyDown={handleKeyDown}
      onClick={() => go(1)}
      className="fixed inset-0 z-[60] cursor-pointer"
      style={{ background: pattern.background }}
    >
      {showHint && (
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 animate-fade-in rounded-lg bg-black/75 px-4 py-3 text-center text-sm text-white">
          <p className="font-semibold">
            {pattern.name} ({index + 1} of {PATTERNS.length})
          </p>
          <p className="mt-0.5">{pattern.hint}</p>
          <p className="mt-1 text-white/80">Space or click for next, arrow keys to move, Escape to exit</p>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {pattern.name}. {pattern.hint}
      </span>
    </div>
  );
};

export const ScreenTestPage = () => {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [dpr, setDpr] = useState(() => window.devicePixelRatio);
  const [refresh, setRefresh] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);

  const measure = useCallback(() => {
    setRefresh(null);
    measureRefreshRate().then(setRefresh);
  }, []);

  useEffect(() => {
    measureRefreshRate().then(setRefresh);
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setDpr(window.devicePixelRatio);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeTest = useCallback(() => setTesting(false), []);

  const width = window.screen.width;
  const height = window.screen.height;

  return (
    <ToolPage
      title="Screen Test"
      description="Check your display's resolution and refresh rate, and look for dead pixels, light bleed and color banding."
      actions={
        <Button
          label="Start full screen test"
          variant="primary"
          icon={HiOutlineArrowsPointingOut}
          onClick={() => setTesting(true)}
        />
      }
    >
      <SummaryStrip
        label="Display summary"
        items={[
          {
            label: "Refresh rate",
            value: refresh === null ? "Measuring" : `${refresh} Hz`,
            context: refresh === null ? "Hold still for a second" : "Measured from screen frames",
            lead: true,
          },
          { label: "Screen", value: `${width} × ${height}`, context: "CSS pixels" },
          {
            label: "Physical",
            value: `${Math.round(width * dpr)} × ${Math.round(height * dpr)}`,
            context: `${dpr}x pixel ratio`,
          },
          { label: "Window", value: `${viewport.width} × ${viewport.height}`, context: "Updates as you resize" },
        ]}
      />
      <Button
        label="Measure refresh rate again"
        variant="ghost"
        size="sm"
        icon={HiArrowPath}
        onClick={measure}
        disabled={refresh === null}
        className="-mt-2 self-start"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="details-heading" className="flex flex-col gap-2">
          <h2 id="details-heading" className="text-sm font-medium text-ink">
            Details
          </h2>
          <ValueList
            rows={[
              { label: "Color depth", value: `${window.screen.colorDepth} bit`, copy: false, mono: false },
              { label: "Color gamut", value: colorGamut(), copy: false, mono: false },
              {
                label: "High dynamic range",
                value: matches("(dynamic-range: high)") ? "Supported" : "Not supported",
                copy: false,
                mono: false,
              },
              {
                label: "Orientation",
                value: (window.screen.orientation?.type ?? "unknown").replace("-primary", "").replace("-secondary", " flipped"),
                copy: false,
                mono: false,
              },
              {
                label: "Touch points",
                value: navigator.maxTouchPoints > 0 ? `${navigator.maxTouchPoints} supported` : "No touch screen",
                copy: false,
                mono: false,
              },
              {
                label: "Color scheme",
                value: matches("(prefers-color-scheme: dark)") ? "Dark" : "Light",
                copy: false,
                mono: false,
              },
            ]}
          />
        </section>

        <section aria-labelledby="test-heading" className="flex flex-col gap-3">
          <h2 id="test-heading" className="text-sm font-medium text-ink">
            Full screen test
          </h2>
          <p className="text-muted">
            The test fills the screen with {PATTERNS.length} patterns one by one. Look closely for single dots that stay
            the wrong color, uneven brightness and visible steps in the gradients.
          </p>
          <ul className="grid grid-cols-4 gap-2" aria-label="Test patterns">
            {PATTERNS.map((pattern) => (
              <li key={pattern.name} className="flex flex-col gap-1">
                <span className="h-10 rounded-md border border-rule" style={{ background: pattern.background }} aria-hidden="true" />
                <span className="text-xs text-muted">{pattern.name}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">
            Clean the screen first. Dust looks a lot like a dead pixel.
          </p>
        </section>
      </div>

      {testing && <FullScreenTest onClose={closeTest} />}
    </ToolPage>
  );
};
