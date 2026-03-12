import { useState } from "react";
import { clsx } from "clsx";
import {
  HiOutlineSwatch,
  HiOutlineClipboardDocument,
  HiCheck,
} from "react-icons/hi2";
import { useClipboard } from "../../hooks/use-clipboard";

interface IRGB {
  r: number;
  g: number;
  b: number;
}

interface IHSL {
  h: number;
  s: number;
  l: number;
}

const hexToRgb = (hex: string): IRGB | null => {
  let cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    cleaned = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
  }
  if (cleaned.length !== 6) return null;
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const rgbToHex = (rgb: IRGB): string => {
  const r = Math.max(0, Math.min(255, Math.round(rgb.r)));
  const g = Math.max(0, Math.min(255, Math.round(rgb.g)));
  const b = Math.max(0, Math.min(255, Math.round(rgb.b)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

const rgbToHsl = (rgb: IRGB): IHSL => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hslToRgb = (hsl: IHSL): IRGB => {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }
  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
};

const parseRgbString = (str: string): IRGB | null => {
  const match = str.match(/(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (!match) return null;
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  if (r > 255 || g > 255 || b > 255) return null;
  return { r, g, b };
};

const parseHslString = (str: string): IHSL | null => {
  const match = str.match(/(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (!match) return null;
  const h = parseInt(match[1]);
  const s = parseInt(match[2]);
  const l = parseInt(match[3]);
  if (h > 360 || s > 100 || l > 100) return null;
  return { h, s, l };
};

type InputMode = "hex" | "rgb" | "hsl";

export const ColorConverterPage = () => {
  const [hexInput, setHexInput] = useState("#6366f1");
  const [rgbInput, setRgbInput] = useState("99, 102, 241");
  const [hslInput, setHslInput] = useState("239, 84, 67");
  const [activeInput, setActiveInput] = useState<InputMode>("hex");
  const [currentRgb, setCurrentRgb] = useState<IRGB>({ r: 99, g: 102, b: 241 });
  const { copied, copy } = useClipboard();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const updateFromHex = (hex: string) => {
    setHexInput(hex);
    setActiveInput("hex");
    const rgb = hexToRgb(hex);
    if (rgb) {
      setCurrentRgb(rgb);
      setRgbInput(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
      const hsl = rgbToHsl(rgb);
      setHslInput(`${hsl.h}, ${hsl.s}, ${hsl.l}`);
    }
  };

  const updateFromRgb = (str: string) => {
    setRgbInput(str);
    setActiveInput("rgb");
    const rgb = parseRgbString(str);
    if (rgb) {
      setCurrentRgb(rgb);
      setHexInput(rgbToHex(rgb));
      const hsl = rgbToHsl(rgb);
      setHslInput(`${hsl.h}, ${hsl.s}, ${hsl.l}`);
    }
  };

  const updateFromHsl = (str: string) => {
    setHslInput(str);
    setActiveInput("hsl");
    const hsl = parseHslString(str);
    if (hsl) {
      const rgb = hslToRgb(hsl);
      setCurrentRgb(rgb);
      setHexInput(rgbToHex(rgb));
      setRgbInput(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  };

  const handleColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFromHex(e.target.value);
  };

  const handleCopy = (field: string, value: string) => {
    copy(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hexValue = hexInput.startsWith("#") ? hexInput : `#${hexInput}`;
  const rgbValue = `rgb(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b})`;
  const hsl = rgbToHsl(currentRgb);
  const hslValue = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineSwatch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              Color Converter
            </h2>
            <p className="text-sm text-dark-400">
              Convert colors between HEX, RGB, and HSL
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 flex-1">
          <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold">HEX</span>
              <button
                onClick={() => handleCopy("hex", hexValue)}
                className="text-dark-500 hover:text-dark-200 transition-colors duration-200"
              >
                {copied && copiedField === "hex" ? (
                  <HiCheck className="w-4 h-4 text-success-400" />
                ) : (
                  <HiOutlineClipboardDocument className="w-4 h-4" />
                )}
              </button>
            </div>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => updateFromHex(e.target.value)}
              className={clsx(
                "w-full px-4 py-3 rounded-lg border transition-all duration-200 font-mono text-base",
                "bg-dark-800 text-dark-100 placeholder:text-dark-500",
                "focus:outline-none focus:ring-1 focus:ring-accent-500/20",
                activeInput === "hex" ? "border-accent-500" : "border-dark-700 focus:border-accent-500"
              )}
              placeholder="#000000"
              spellCheck={false}
            />
          </div>

          <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold">RGB</span>
              <button
                onClick={() => handleCopy("rgb", rgbValue)}
                className="text-dark-500 hover:text-dark-200 transition-colors duration-200"
              >
                {copied && copiedField === "rgb" ? (
                  <HiCheck className="w-4 h-4 text-success-400" />
                ) : (
                  <HiOutlineClipboardDocument className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-500 text-sm font-mono">rgb(</span>
              <input
                type="text"
                value={rgbInput}
                onChange={(e) => updateFromRgb(e.target.value)}
                className={clsx(
                  "flex-1 px-4 py-3 rounded-lg border transition-all duration-200 font-mono text-base",
                  "bg-dark-800 text-dark-100 placeholder:text-dark-500",
                  "focus:outline-none focus:ring-1 focus:ring-accent-500/20",
                  activeInput === "rgb" ? "border-accent-500" : "border-dark-700 focus:border-accent-500"
                )}
                placeholder="99, 102, 241"
                spellCheck={false}
              />
              <span className="text-dark-500 text-sm font-mono">)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold">HSL</span>
              <button
                onClick={() => handleCopy("hsl", hslValue)}
                className="text-dark-500 hover:text-dark-200 transition-colors duration-200"
              >
                {copied && copiedField === "hsl" ? (
                  <HiCheck className="w-4 h-4 text-success-400" />
                ) : (
                  <HiOutlineClipboardDocument className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-500 text-sm font-mono">hsl(</span>
              <input
                type="text"
                value={hslInput}
                onChange={(e) => updateFromHsl(e.target.value)}
                className={clsx(
                  "flex-1 px-4 py-3 rounded-lg border transition-all duration-200 font-mono text-base",
                  "bg-dark-800 text-dark-100 placeholder:text-dark-500",
                  "focus:outline-none focus:ring-1 focus:ring-accent-500/20",
                  activeInput === "hsl" ? "border-accent-500" : "border-dark-700 focus:border-accent-500"
                )}
                placeholder="239, 84, 67"
                spellCheck={false}
              />
              <span className="text-dark-500 text-sm font-mono">)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold">Individual Channels</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-dark-500 mb-1 block">R</label>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={currentRgb.r}
                  onChange={(e) => updateFromRgb(`${e.target.value}, ${currentRgb.g}, ${currentRgb.b}`)}
                  className="w-full accent-red-500"
                />
                <span className="text-xs font-mono text-dark-300">{currentRgb.r}</span>
              </div>
              <div>
                <label className="text-xs text-dark-500 mb-1 block">G</label>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={currentRgb.g}
                  onChange={(e) => updateFromRgb(`${currentRgb.r}, ${e.target.value}, ${currentRgb.b}`)}
                  className="w-full accent-green-500"
                />
                <span className="text-xs font-mono text-dark-300">{currentRgb.g}</span>
              </div>
              <div>
                <label className="text-xs text-dark-500 mb-1 block">B</label>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={currentRgb.b}
                  onChange={(e) => updateFromRgb(`${currentRgb.r}, ${currentRgb.g}, ${e.target.value}`)}
                  className="w-full accent-blue-500"
                />
                <span className="text-xs font-mono text-dark-300">{currentRgb.b}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-80 shrink-0">
          <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
            <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3 block">Preview</span>
            <div
              className="w-full h-48 rounded-xl border border-dark-700"
              style={{ backgroundColor: rgbValue }}
            />
            <input
              type="color"
              value={rgbToHex(currentRgb)}
              onChange={handleColorPicker}
              className="w-full h-10 mt-3 rounded-lg cursor-pointer border-0 bg-transparent"
            />
          </div>

          <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
            <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3 block">CSS Values</span>
            <div className="flex flex-col gap-2">
              {[
                { label: "HEX", value: hexValue },
                { label: "RGB", value: rgbValue },
                { label: "HSL", value: hslValue },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-dark-800 border border-dark-700"
                >
                  <span className="font-mono text-sm text-dark-200">{item.value}</span>
                  <button
                    onClick={() => handleCopy(item.label.toLowerCase() + "-css", item.value)}
                    className="text-dark-500 hover:text-dark-200 transition-colors duration-200 ml-2"
                  >
                    {copied && copiedField === item.label.toLowerCase() + "-css" ? (
                      <HiCheck className="w-3.5 h-3.5 text-success-400" />
                    ) : (
                      <HiOutlineClipboardDocument className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
            <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3 block">Contrast</span>
            <div className="flex flex-col gap-2">
              <div
                className="px-4 py-3 rounded-lg text-center font-semibold text-sm"
                style={{ backgroundColor: rgbValue, color: "#ffffff" }}
              >
                White Text
              </div>
              <div
                className="px-4 py-3 rounded-lg text-center font-semibold text-sm"
                style={{ backgroundColor: rgbValue, color: "#000000" }}
              >
                Black Text
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
