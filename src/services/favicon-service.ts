export interface IIconSettings {
  source: "image" | "text";
  text: string;
  font: "sans" | "mono";
  background: string;
  transparent: boolean;
  foreground: string;
  padding: number;
  radius: number;
}

export const OUTPUT_SIZES = [
  { size: 16, file: "favicon-16x16.png" },
  { size: 32, file: "favicon-32x32.png" },
  { size: 48, file: "favicon-48x48.png" },
  { size: 180, file: "apple-touch-icon.png" },
  { size: 192, file: "android-chrome-192x192.png" },
  { size: 512, file: "android-chrome-512x512.png" },
];

const FONT_FAMILIES = {
  sans: '"IBM Plex Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

const roundedRect = (ctx: CanvasRenderingContext2D, size: number, radius: number) => {
  const r = Math.min(size / 2, (radius / 100) * size);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(size, 0, size, size, r);
  ctx.arcTo(size, size, 0, size, r);
  ctx.arcTo(0, size, 0, 0, r);
  ctx.arcTo(0, 0, size, 0, r);
  ctx.closePath();
};

export const renderIcon = (
  size: number,
  settings: IIconSettings,
  image: HTMLImageElement | null
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingQuality = "high";

  roundedRect(ctx, size, settings.radius);
  ctx.save();
  ctx.clip();
  if (!settings.transparent || settings.source === "text") {
    ctx.fillStyle = settings.background;
    ctx.fillRect(0, 0, size, size);
  }

  const inset = (settings.padding / 100) * size;
  const box = size - inset * 2;

  if (settings.source === "image" && image) {
    const scale = Math.min(box / image.naturalWidth, box / image.naturalHeight);
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
  } else if (settings.source === "text" && settings.text.trim()) {
    const text = settings.text.trim().slice(0, 3);
    const length = Array.from(text).length;
    const fontSize = box * (length === 1 ? 0.78 : length === 2 ? 0.6 : 0.46);
    ctx.fillStyle = settings.foreground;
    ctx.font = `600 ${fontSize}px ${FONT_FAMILIES[settings.font]}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const metrics = ctx.measureText(text);
    const offset = (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    ctx.fillText(text, size / 2, size / 2 + offset);
  }
  ctx.restore();
  return canvas;
};

const canvasToPng = (canvas: HTMLCanvasElement): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("png"));
        return;
      }
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/png");
  });

export const buildIco = (images: { size: number; png: Uint8Array }[]): Uint8Array => {
  const headerSize = 6 + images.length * 16;
  const total = headerSize + images.reduce((sum, image) => sum + image.png.length, 0);
  const buffer = new Uint8Array(total);
  const view = new DataView(buffer.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);
  let offset = headerSize;
  images.forEach((image, i) => {
    const entry = 6 + i * 16;
    view.setUint8(entry, image.size >= 256 ? 0 : image.size);
    view.setUint8(entry + 1, image.size >= 256 ? 0 : image.size);
    view.setUint8(entry + 2, 0);
    view.setUint8(entry + 3, 0);
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, image.png.length, true);
    view.setUint32(entry + 12, offset, true);
    buffer.set(image.png, offset);
    offset += image.png.length;
  });
  return buffer;
};

export const HTML_SNIPPET = `<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />`;

const manifest = (name: string, color: string) =>
  JSON.stringify(
    {
      name,
      short_name: name,
      icons: [
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: color,
      background_color: color,
      display: "standalone",
    },
    null,
    2
  );

export const buildFaviconZip = async (
  settings: IIconSettings,
  image: HTMLImageElement | null,
  appName: string
): Promise<Blob> => {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const pngs = new Map<number, Uint8Array>();
  for (const { size, file } of OUTPUT_SIZES) {
    const png = await canvasToPng(renderIcon(size, settings, image));
    pngs.set(size, png);
    zip.file(file, png);
  }
  zip.file(
    "favicon.ico",
    buildIco([16, 32, 48].map((size) => ({ size, png: pngs.get(size) as Uint8Array })))
  );
  zip.file("site.webmanifest", manifest(appName || "My app", settings.transparent ? "#ffffff" : settings.background));
  zip.file("snippet.html", HTML_SNIPPET);
  return zip.generateAsync({ type: "blob" });
};
