import { HiOutlinePlus } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { Slider } from "../../components/common/slider/slider";
import { Switch } from "../../components/common/switch/switch";
import { Button } from "../../components/common/button/button";
import { CodeBlock } from "../../components/common/code-block/code-block";
import { ColorField } from "../../components/common/color-field/color-field";
import { usePersistentState } from "../../hooks/use-persistent-state";

type Mode = "gradient" | "shadow";
type GradientType = "linear" | "radial" | "conic";

interface IStop {
  id: number;
  color: string;
  position: number;
}

interface IGradient {
  type: GradientType;
  angle: number;
  stops: IStop[];
}

interface IShadow {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
}

const MODES: { value: Mode; label: string }[] = [
  { value: "gradient", label: "Gradient" },
  { value: "shadow", label: "Shadow" },
];

const TYPES: { value: GradientType; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "radial", label: "Radial" },
  { value: "conic", label: "Conic" },
];

const PRESETS: { name: string; gradient: IGradient }[] = [
  {
    name: "Sage dawn",
    gradient: { type: "linear", angle: 135, stops: [{ id: 1, color: "#a9decc", position: 0 }, { id: 2, color: "#fee2cf", position: 100 }] },
  },
  {
    name: "Deep sea",
    gradient: { type: "linear", angle: 160, stops: [{ id: 1, color: "#0f6353", position: 0 }, { id: 2, color: "#1a2723", position: 100 }] },
  },
  {
    name: "Sunset",
    gradient: {
      type: "linear",
      angle: 90,
      stops: [
        { id: 1, color: "#f0b788", position: 0 },
        { id: 2, color: "#f4928a", position: 50 },
        { id: 3, color: "#c96f7a", position: 100 },
      ],
    },
  },
  {
    name: "Glow",
    gradient: { type: "radial", angle: 0, stops: [{ id: 1, color: "#fafdfc", position: 0 }, { id: 2, color: "#91d4bf", position: 100 }] },
  },
];

const DEFAULT_SHADOW: IShadow = { x: 0, y: 12, blur: 32, spread: -8, color: "#1a2723", opacity: 30, inset: false };

const hexToRgb = (hex: string) => {
  const num = parseInt(hex.slice(1), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

const gradientCss = (g: IGradient) => {
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ");
  if (g.type === "linear") return `linear-gradient(${g.angle}deg, ${stops})`;
  if (g.type === "radial") return `radial-gradient(circle, ${stops})`;
  return `conic-gradient(from ${g.angle}deg, ${stops})`;
};

const shadowCss = (s: IShadow) => {
  const [r, g, b] = hexToRgb(s.color);
  return `${s.inset ? "inset " : ""}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px rgb(${r} ${g} ${b} / ${(s.opacity / 100).toFixed(2)})`;
};

const toTailwind = (prefix: string, value: string) =>
  `${prefix}-[${value.replace(/,\s*/g, ",").replace(/\s*\/\s*/g, "/").replace(/\s+/g, "_")}]`;

export const CssBuilderPage = () => {
  const [mode, setMode] = usePersistentState<Mode>("css-builder:mode", "gradient");
  const [gradient, setGradient] = usePersistentState<IGradient>("css-builder:gradient", PRESETS[0].gradient);
  const [shadow, setShadow] = usePersistentState<IShadow>("css-builder:shadow", DEFAULT_SHADOW);

  const updateStop = (id: number, patch: Partial<IStop>) =>
    setGradient({ ...gradient, stops: gradient.stops.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)) });

  const addStop = () => {
    const nextId = Math.max(...gradient.stops.map((stop) => stop.id)) + 1;
    setGradient({ ...gradient, stops: [...gradient.stops, { id: nextId, color: "#ffffff", position: 50 }] });
  };

  const removeStop = (id: number) =>
    setGradient({ ...gradient, stops: gradient.stops.filter((stop) => stop.id !== id) });

  const css = mode === "gradient" ? gradientCss(gradient) : shadowCss(shadow);
  const property = mode === "gradient" ? "background" : "box-shadow";

  return (
    <ToolPage
      title="Gradients and Shadows"
      description="Design CSS gradients and box shadows visually, then copy plain CSS or a Tailwind class."
      actions={<SegmentedControl label="Build" options={MODES} value={mode} onChange={setMode} />}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="preview-heading" className="flex flex-col gap-3">
          <h2 id="preview-heading" className="text-sm font-medium text-ink">
            Preview
          </h2>
          {mode === "gradient" ? (
            <div
              className="aspect-[4/3] w-full rounded-xl border border-rule"
              style={{ background: css }}
              role="img"
              aria-label="Gradient preview"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-rule bg-surface">
              <div
                className="flex h-1/2 w-1/2 items-center justify-center rounded-xl bg-raised text-sm text-muted"
                style={{ boxShadow: css }}
              >
                Card
              </div>
            </div>
          )}
          <CodeBlock label="CSS" code={`${property}: ${css};`} />
          <CodeBlock label="Tailwind class" code={toTailwind(mode === "gradient" ? "bg" : "shadow", css)} />
        </section>

        {mode === "gradient" ? (
          <section aria-labelledby="gradient-heading" className="flex flex-col gap-6">
            <h2 id="gradient-heading" className="sr-only">
              Gradient settings
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>Presets:</span>
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setGradient(preset.gradient)}
                  className="flex h-8 items-center gap-2 rounded-md px-2.5 font-medium text-ink hover:bg-tint"
                >
                  <span className="h-4 w-4 rounded-sm border border-rule" style={{ background: gradientCss(preset.gradient) }} aria-hidden="true" />
                  {preset.name}
                </button>
              ))}
            </div>
            <SegmentedControl
              label="Type"
              options={TYPES}
              value={gradient.type}
              onChange={(type) => setGradient({ ...gradient, type })}
            />
            {gradient.type !== "radial" && (
              <Slider
                label={gradient.type === "linear" ? "Angle" : "Start angle"}
                value={gradient.angle}
                min={0}
                max={360}
                step={5}
                onChange={(angle) => setGradient({ ...gradient, angle })}
                valueText={`${gradient.angle}°`}
              />
            )}
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-3 text-sm font-medium text-ink">Color stops</legend>
              {gradient.stops.map((stop, index) => (
                <div key={stop.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-4">
                  <ColorField
                    label={`Stop ${index + 1} color`}
                    value={stop.color}
                    onChange={(color) => updateStop(stop.id, { color })}
                  />
                  <Slider
                    label={`Stop ${index + 1} position`}
                    value={stop.position}
                    min={0}
                    max={100}
                    onChange={(position) => updateStop(stop.id, { position })}
                    valueText={`${stop.position}%`}
                  />
                  <Button
                    label="Remove"
                    ariaLabel={`Remove stop ${index + 1}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStop(stop.id)}
                    disabled={gradient.stops.length <= 2}
                  />
                </div>
              ))}
              <Button
                label="Add a stop"
                variant="secondary"
                size="sm"
                icon={HiOutlinePlus}
                onClick={addStop}
                disabled={gradient.stops.length >= 6}
                className="self-start"
              />
            </fieldset>
          </section>
        ) : (
          <section aria-labelledby="shadow-heading" className="flex flex-col gap-6">
            <h2 id="shadow-heading" className="sr-only">
              Shadow settings
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <Slider label="Horizontal offset" value={shadow.x} min={-60} max={60} onChange={(x) => setShadow({ ...shadow, x })} valueText={`${shadow.x}px`} />
              <Slider label="Vertical offset" value={shadow.y} min={-60} max={60} onChange={(y) => setShadow({ ...shadow, y })} valueText={`${shadow.y}px`} />
              <Slider label="Blur" value={shadow.blur} min={0} max={120} onChange={(blur) => setShadow({ ...shadow, blur })} valueText={`${shadow.blur}px`} />
              <Slider label="Spread" value={shadow.spread} min={-60} max={60} onChange={(spread) => setShadow({ ...shadow, spread })} valueText={`${shadow.spread}px`} />
              <Slider label="Opacity" value={shadow.opacity} min={0} max={100} onChange={(opacity) => setShadow({ ...shadow, opacity })} valueText={`${shadow.opacity}%`} />
              <ColorField label="Shadow color" value={shadow.color} onChange={(color) => setShadow({ ...shadow, color })} />
            </div>
            <Switch label="Inner shadow (inset)" checked={shadow.inset} onChange={(inset) => setShadow({ ...shadow, inset })} />
            <Button label="Reset shadow" variant="ghost" size="sm" onClick={() => setShadow(DEFAULT_SHADOW)} className="self-start" />
          </section>
        )}
      </div>
    </ToolPage>
  );
};
