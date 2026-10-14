export interface IRGB {
  r: number;
  g: number;
  b: number;
}

export interface IHSL {
  h: number;
  s: number;
  l: number;
}

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

export const hexToRgb = (hex: string): IRGB | null => {
  let cleaned = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(cleaned)) return null;
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const num = parseInt(cleaned, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

export const rgbToHex = (rgb: IRGB): string =>
  `#${[rgb.r, rgb.g, rgb.b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;

export const rgbToHsl = (rgb: IRGB): IHSL => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const hslToRgb = (hsl: IHSL): IRGB => {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }
  const hueToRgb = (p: number, q: number, t: number): number => {
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
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  };
};

const parseTriple = (text: string): [number, number, number] | null => {
  const match = text.match(/^\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?\s*$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

export const parseRgbString = (text: string): IRGB | null => {
  const triple = parseTriple(text);
  if (!triple) return null;
  const [r, g, b] = triple;
  if (r > 255 || g > 255 || b > 255) return null;
  return { r, g, b };
};

export const parseHslString = (text: string): IHSL | null => {
  const triple = parseTriple(text);
  if (!triple) return null;
  const [h, s, l] = triple;
  if (h > 360 || s > 100 || l > 100) return null;
  return { h, s, l };
};

const relativeLuminance = (rgb: IRGB): number => {
  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
};

export const contrastRatio = (a: IRGB, b: IRGB): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};
