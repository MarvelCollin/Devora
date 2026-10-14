export interface IPaletteColor {
  hex: string;
  rgb: [number, number, number];
  share: number;
}

type Pixel = [number, number, number];

export const toHex = ([r, g, b]: Pixel): string =>
  `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;

const channelRange = (pixels: Pixel[], channel: number) => {
  let min = 255;
  let max = 0;
  for (const pixel of pixels) {
    if (pixel[channel] < min) min = pixel[channel];
    if (pixel[channel] > max) max = pixel[channel];
  }
  return max - min;
};

const average = (pixels: Pixel[]): Pixel => {
  const sum = [0, 0, 0];
  for (const pixel of pixels) {
    sum[0] += pixel[0];
    sum[1] += pixel[1];
    sum[2] += pixel[2];
  }
  return sum.map((value) => Math.round(value / pixels.length)) as Pixel;
};

export const samplePixels = (image: HTMLImageElement, maxSide = 120): Pixel[] => {
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  const pixels: Pixel[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] >= 128) pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  return pixels;
};

export const extractPalette = (pixels: Pixel[], count = 12): IPaletteColor[] => {
  if (pixels.length === 0) return [];
  let boxes: Pixel[][] = [pixels];
  while (boxes.length < count) {
    let target = -1;
    let widest = 0;
    let channel = 0;
    boxes.forEach((box, index) => {
      if (box.length < 2) return;
      for (let c = 0; c < 3; c += 1) {
        const range = channelRange(box, c);
        if (range > widest) {
          widest = range;
          target = index;
          channel = c;
        }
      }
    });
    if (target === -1 || widest < 8) break;
    const sorted = [...boxes[target]].sort((a, b) => a[channel] - b[channel]);
    const middle = Math.floor(sorted.length / 2);
    boxes = [...boxes.slice(0, target), sorted.slice(0, middle), sorted.slice(middle), ...boxes.slice(target + 1)];
  }
  const colors = boxes
    .filter((box) => box.length > 0)
    .map((box) => ({ rgb: average(box), weight: box.length }))
    .sort((a, b) => b.weight - a.weight);
  const merged: { rgb: Pixel; weight: number }[] = [];
  for (const color of colors) {
    const near = merged.find(
      (existing) =>
        Math.hypot(
          existing.rgb[0] - color.rgb[0],
          existing.rgb[1] - color.rgb[1],
          existing.rgb[2] - color.rgb[2]
        ) < 40
    );
    if (near) near.weight += color.weight;
    else merged.push({ ...color });
  }
  return merged
    .map((color) => ({ hex: toHex(color.rgb), rgb: color.rgb, share: color.weight / pixels.length }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 8);
};
