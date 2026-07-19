import JSZip from "jszip";

export type OutputFormat = "image/jpeg" | "image/webp" | "image/png";

export interface CompressionOptions {
  format: OutputFormat;
  quality: number;
  maxWidth: number;
}

export interface CompressedResult {
  name: string;
  originalSize: number;
  compressedSize: number;
  originalUrl: string;
  compressedUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Compression failed"));
      },
      format,
      quality
    );
  });
};

const extensionFor = (format: OutputFormat): string => {
  if (format === "image/jpeg") return "jpg";
  if (format === "image/webp") return "webp";
  return "png";
};

export const renameForFormat = (name: string, format: OutputFormat): string => {
  const base = name.replace(/\.[^.]+$/, "");
  return `${base}.${extensionFor(format)}`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const compressImage = async (
  file: File,
  options: CompressionOptions
): Promise<CompressedResult> => {
  const img = await loadImage(file);
  const scale =
    options.maxWidth > 0 && img.width > options.maxWidth
      ? options.maxWidth / img.width
      : 1;
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, options.format, options.quality);
  const compressedUrl = URL.createObjectURL(blob);

  return {
    name: renameForFormat(file.name, options.format),
    originalSize: file.size,
    compressedSize: blob.size,
    originalUrl: img.src,
    compressedUrl,
    blob,
    width,
    height,
  };
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadAllZip = async (
  results: CompressedResult[]
): Promise<void> => {
  const zip = new JSZip();
  results.forEach((result) => zip.file(result.name, result.blob));
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, "compressed-images.zip");
};
