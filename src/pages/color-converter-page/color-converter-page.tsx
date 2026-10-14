import { useState } from "react";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextInput } from "../../components/common/text-input/text-input";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { Slider } from "../../components/common/slider/slider";
import {
  contrastRatio,
  hexToRgb,
  hslToRgb,
  parseHslString,
  parseRgbString,
  rgbToHex,
  rgbToHsl,
} from "../../services/color-converter-service";
import type { IHSL, IRGB } from "../../services/color-converter-service";

const START: IRGB = { r: 47, g: 125, b: 109 };
const WHITE: IRGB = { r: 255, g: 255, b: 255 };
const BLACK: IRGB = { r: 0, g: 0, b: 0 };

const rgbText = (rgb: IRGB) => `${rgb.r}, ${rgb.g}, ${rgb.b}`;
const hslText = (hsl: IHSL) => `${hsl.h}, ${hsl.s}%, ${hsl.l}%`;

const ContrastRow = ({ label, background, text }: { label: string; background: IRGB; text: IRGB }) => {
  const ratio = contrastRatio(background, text);
  const verdict =
    ratio >= 7 ? "Passes AAA" : ratio >= 4.5 ? "Passes AA" : ratio >= 3 ? "Large text only" : "Fails";
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-11 flex-1 items-center rounded-md px-3 text-sm font-semibold"
        style={{ backgroundColor: rgbToHex(background), color: rgbToHex(text) }}
      >
        {label}
      </div>
      <div className="w-32 text-right">
        <p className="font-mono text-sm font-semibold tabular-nums text-ink">
          {ratio.toFixed(2)}:1
        </p>
        <p
          className={
            ratio >= 4.5 ? "text-xs text-success" : ratio >= 3 ? "text-xs text-warning" : "text-xs text-danger"
          }
        >
          {verdict}
        </p>
      </div>
    </div>
  );
};

export const ColorConverterPage = () => {
  const [rgb, setRgb] = useState<IRGB>(START);
  const [hsl, setHsl] = useState<IHSL>(() => rgbToHsl(START));
  const [hexDraft, setHexDraft] = useState(() => rgbToHex(START));
  const [rgbDraft, setRgbDraft] = useState(() => rgbText(START));
  const [hslDraft, setHslDraft] = useState(() => hslText(rgbToHsl(START)));

  const applyRgb = (next: IRGB, source?: "hex" | "rgb") => {
    const nextHsl = rgbToHsl(next);
    setRgb(next);
    setHsl(nextHsl);
    if (source !== "hex") setHexDraft(rgbToHex(next));
    if (source !== "rgb") setRgbDraft(rgbText(next));
    setHslDraft(hslText(nextHsl));
  };

  const applyHsl = (next: IHSL, fromText = false) => {
    const nextRgb = hslToRgb(next);
    setHsl(next);
    setRgb(nextRgb);
    setHexDraft(rgbToHex(nextRgb));
    setRgbDraft(rgbText(nextRgb));
    if (!fromText) setHslDraft(hslText(next));
  };

  const onHexChange = (text: string) => {
    setHexDraft(text);
    const parsed = hexToRgb(text);
    if (parsed) applyRgb(parsed, "hex");
  };

  const onRgbChange = (text: string) => {
    setRgbDraft(text);
    const parsed = parseRgbString(text);
    if (parsed) applyRgb(parsed, "rgb");
  };

  const onHslChange = (text: string) => {
    setHslDraft(text);
    const parsed = parseHslString(text);
    if (parsed) applyHsl(parsed, true);
  };

  const hex = rgbToHex(rgb);
  const cssRgb = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const cssHsl = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  const hexError = hexToRgb(hexDraft) ? null : "Use 3 or 6 hex digits, like #2f7d6d.";
  const rgbError = parseRgbString(rgbDraft)
    ? null
    : "Use three numbers from 0 to 255, like 47, 125, 109.";
  const hslError = parseHslString(hslDraft)
    ? null
    : "Use hue 0 to 360, then saturation and lightness 0 to 100, like 168, 45%, 34%.";

  const hueTrack = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360]
    .map((h) => `hsl(${h} ${hsl.s}% ${hsl.l}%)`)
    .join(", ")})`;
  const satTrack = `linear-gradient(to right, hsl(${hsl.h} 0% ${hsl.l}%), hsl(${hsl.h} 100% ${hsl.l}%))`;
  const lightTrack = `linear-gradient(to right, hsl(${hsl.h} ${hsl.s}% 0%), hsl(${hsl.h} ${hsl.s}% 50%), hsl(${hsl.h} ${hsl.s}% 100%))`;
  const channelTrack = (channel: keyof IRGB) =>
    `linear-gradient(to right, rgb(${channel === "r" ? 0 : rgb.r} ${channel === "g" ? 0 : rgb.g} ${channel === "b" ? 0 : rgb.b}), rgb(${channel === "r" ? 255 : rgb.r} ${channel === "g" ? 255 : rgb.g} ${channel === "b" ? 255 : rgb.b}))`;

  return (
    <ToolPage
      title="Color Converter"
      description="Type a color in any format or adjust the sliders. Every format updates together."
    >
      <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section aria-labelledby="preview-heading" className="flex flex-col gap-4">
          <h2 id="preview-heading" className="sr-only">
            Preview
          </h2>
          <div
            className="flex h-56 items-end rounded-lg border border-rule p-4"
            style={{ backgroundColor: hex }}
            role="img"
            aria-label={`Color preview, ${hex}`}
          >
            <span
              className="rounded-sm bg-raised px-2 py-1 font-mono text-sm font-semibold text-ink"
            >
              {hex}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-ink">Text contrast on this color</h3>
            <ContrastRow label="White text" background={rgb} text={WHITE} />
            <ContrastRow label="Black text" background={rgb} text={BLACK} />
          </div>
        </section>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="values-heading" className="flex flex-col gap-4">
            <h2 id="values-heading" className="font-mono text-sm font-semibold text-strong">
              Values
            </h2>
            <TextInput
              label="HEX"
              value={hexDraft}
              onChange={onHexChange}
              error={hexError}
              actions={<CopyButton value={hex} label="Copy HEX" />}
            />
            <TextInput
              label="RGB"
              value={rgbDraft}
              onChange={onRgbChange}
              prefix="rgb("
              suffix=")"
              error={rgbError}
              actions={<CopyButton value={cssRgb} label="Copy RGB" />}
            />
            <TextInput
              label="HSL"
              value={hslDraft}
              onChange={onHslChange}
              prefix="hsl("
              suffix=")"
              error={hslError}
              actions={<CopyButton value={cssHsl} label="Copy HSL" />}
            />
          </section>

          <section aria-labelledby="adjust-heading" className="flex flex-col gap-4">
            <h2 id="adjust-heading" className="font-mono text-sm font-semibold text-strong">
              Adjust
            </h2>
            <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
              <div className="flex flex-col gap-5">
                <Slider
                  label="Hue"
                  value={hsl.h}
                  min={0}
                  max={360}
                  onChange={(h) => applyHsl({ ...hsl, h })}
                  valueText={`${hsl.h}°`}
                  trackBackground={hueTrack}
                />
                <Slider
                  label="Saturation"
                  value={hsl.s}
                  min={0}
                  max={100}
                  onChange={(s) => applyHsl({ ...hsl, s })}
                  valueText={`${hsl.s}%`}
                  trackBackground={satTrack}
                />
                <Slider
                  label="Lightness"
                  value={hsl.l}
                  min={0}
                  max={100}
                  onChange={(l) => applyHsl({ ...hsl, l })}
                  valueText={`${hsl.l}%`}
                  trackBackground={lightTrack}
                />
              </div>
              <div className="flex flex-col gap-5">
                <Slider
                  label="Red"
                  value={rgb.r}
                  min={0}
                  max={255}
                  onChange={(r) => applyRgb({ ...rgb, r })}
                  trackBackground={channelTrack("r")}
                />
                <Slider
                  label="Green"
                  value={rgb.g}
                  min={0}
                  max={255}
                  onChange={(g) => applyRgb({ ...rgb, g })}
                  trackBackground={channelTrack("g")}
                />
                <Slider
                  label="Blue"
                  value={rgb.b}
                  min={0}
                  max={255}
                  onChange={(b) => applyRgb({ ...rgb, b })}
                  trackBackground={channelTrack("b")}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </ToolPage>
  );
};
