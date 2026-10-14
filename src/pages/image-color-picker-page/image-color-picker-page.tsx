import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { DropZone } from "../../components/common/drop-zone/drop-zone";
import { Button } from "../../components/common/button/button";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { Notice } from "../../components/common/notice/notice";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { extractPalette, samplePixels, toHex } from "../../services/palette-service";
import type { IPaletteColor } from "../../services/palette-service";

interface ILoaded {
  name: string;
  url: string;
  element: HTMLImageElement;
  context: CanvasRenderingContext2D;
}

interface IPoint {
  x: number;
  y: number;
}

const ColorRow = ({ hex, detail }: { hex: string; detail?: string }) => {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ");
  return (
    <li className="flex items-center gap-3 border-b border-rule px-3 py-2 last:border-b-0">
      <span className="h-9 w-9 shrink-0 rounded-md border border-rule" style={{ backgroundColor: hex }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold text-ink">{hex}</span>
          {detail && <span className="text-xs text-muted">{detail}</span>}
        </span>
        <span className="block font-mono text-xs text-muted">rgb({rgb})</span>
      </span>
      <CopyButton value={hex} label="HEX" ariaLabel={`Copy ${hex} as HEX`} />
      <CopyButton value={`rgb(${rgb})`} label="RGB" ariaLabel={`Copy ${hex} as RGB`} />
    </li>
  );
};

export const ImageColorPickerPage = () => {
  const [loaded, setLoaded] = useState<ILoaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [cursor, setCursor] = useState<IPoint | null>(null);
  const [picked, setPicked] = usePersistentState<string[]>("color-picker:picked", []);
  const imageRef = useRef<HTMLImageElement>(null);

  const load = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(`${file.name} is not an image. Choose a PNG, JPEG, WebP or GIF file.`);
      return;
    }
    const url = URL.createObjectURL(file);
    const element = new Image();
    element.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = element.naturalWidth;
      canvas.height = element.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(element, 0, 0);
      setLoaded((previous) => {
        if (previous) URL.revokeObjectURL(previous.url);
        return { name: file.name || "pasted image", url, element, context };
      });
      setCursor({ x: Math.floor(element.naturalWidth / 2), y: Math.floor(element.naturalHeight / 2) });
      setError(null);
    };
    element.onerror = () => {
      URL.revokeObjectURL(url);
      setError(`${file.name} could not be opened. The file may be damaged.`);
    };
    element.src = url;
  }, []);

  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    urlRef.current = loaded?.url ?? null;
  }, [loaded]);

  useEffect(() => {
    const ref = urlRef;
    return () => {
      if (ref.current) URL.revokeObjectURL(ref.current);
    };
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith("image/"));
      if (file) {
        event.preventDefault();
        load(file);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [load]);

  const palette: IPaletteColor[] = useMemo(
    () => (loaded ? extractPalette(samplePixels(loaded.element)) : []),
    [loaded]
  );

  const colorAt = (point: IPoint) => {
    if (!loaded) return null;
    const [r, g, b] = loaded.context.getImageData(point.x, point.y, 1, 1).data;
    return toHex([r, g, b]);
  };

  const pointFromEvent = (event: { clientX: number; clientY: number }): IPoint | null => {
    if (!loaded || !imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * loaded.element.naturalWidth);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * loaded.element.naturalHeight);
    return {
      x: Math.min(loaded.element.naturalWidth - 1, Math.max(0, x)),
      y: Math.min(loaded.element.naturalHeight - 1, Math.max(0, y)),
    };
  };

  const pick = (point: IPoint) => {
    const hex = colorAt(point);
    if (hex) setPicked([hex, ...picked.filter((item) => item !== hex)].slice(0, 12));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!loaded || !cursor) return;
    const step = event.shiftKey ? 10 : 1;
    const moves: Record<string, IPoint> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    if (event.key in moves) {
      event.preventDefault();
      const move = moves[event.key];
      const next = {
        x: Math.min(loaded.element.naturalWidth - 1, Math.max(0, cursor.x + move.x)),
        y: Math.min(loaded.element.naturalHeight - 1, Math.max(0, cursor.y + move.y)),
      };
      setCursor(next);
      setHover(colorAt(next));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(cursor);
    }
  };

  const cursorColor = cursor ? colorAt(cursor) : null;
  const live = hover ?? cursorColor;

  return (
    <ToolPage
      title="Image Color Picker"
      description="Pick exact colors from any image and pull out its main palette. The image stays on your device."
    >
      <DropZone
        onFiles={(files) => load(files[0])}
        title={loaded ? `Using ${loaded.name}` : "Drop an image here"}
        activeTitle="Release to open this image"
        subtitle="or paste one with Ctrl V, or pick a file"
        buttonLabel={loaded ? "Choose another" : "Choose an image"}
      />
      {error && <Notice tone="error">{error}</Notice>}

      {loaded && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
          <section aria-labelledby="image-heading" className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="image-heading" className="text-sm font-medium text-ink">
                Click to pick a color
              </h2>
              {live && (
                <p className="flex items-center gap-2 font-mono text-sm text-ink" aria-live="polite">
                  <span className="h-5 w-5 rounded-sm border border-rule" style={{ backgroundColor: live }} aria-hidden="true" />
                  {live}
                </p>
              )}
            </div>
            <div
              tabIndex={0}
              role="application"
              aria-label="Image. Use arrow keys to move the crosshair, hold Shift to move faster, press Enter to pick."
              onKeyDown={handleKeyDown}
              className="relative flex justify-center rounded-lg border border-rule bg-surface p-3"
            >
              <div className="relative">
                <img
                  ref={imageRef}
                  src={loaded.url}
                  alt={loaded.name}
                  width={loaded.element.naturalWidth}
                  height={loaded.element.naturalHeight}
                  onPointerMove={(event) => {
                    const point = pointFromEvent(event);
                    if (point) setHover(colorAt(point));
                  }}
                  onPointerLeave={() => setHover(null)}
                  onClick={(event) => {
                    const point = pointFromEvent(event);
                    if (point) {
                      setCursor(point);
                      pick(point);
                    }
                  }}
                  className="block h-auto max-h-[32rem] w-auto max-w-full cursor-crosshair select-none"
                  draggable={false}
                />
                {cursor && (
                  <span
                    className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.6)]"
                    style={{
                      left: `${((cursor.x + 0.5) / loaded.element.naturalWidth) * 100}%`,
                      top: `${((cursor.y + 0.5) / loaded.element.naturalHeight) * 100}%`,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
            <p className="text-sm text-muted">
              {loaded.element.naturalWidth} × {loaded.element.naturalHeight} pixels. Keyboard: focus the image, move with the
              arrow keys and press Enter.
            </p>
          </section>

          <div className="flex flex-col gap-6">
            <section aria-labelledby="picked-heading" className="flex flex-col gap-2">
              <div className="flex min-h-8 items-center justify-between gap-3">
                <h2 id="picked-heading" className="text-sm font-medium text-ink">
                  Picked colors
                </h2>
                <Button
                  label="Clear"
                  variant="ghost"
                  size="sm"
                  icon={HiOutlineTrash}
                  onClick={() => setPicked([])}
                  disabled={picked.length === 0}
                />
              </div>
              {picked.length === 0 ? (
                <p className="rounded-lg border border-rule bg-surface px-4 py-4 text-sm text-muted">
                  Colors you pick are listed here.
                </p>
              ) : (
                <ul className="rounded-lg border border-rule bg-raised">
                  {picked.map((hex) => (
                    <ColorRow key={hex} hex={hex} />
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="palette-heading" className="flex flex-col gap-2">
              <h2 id="palette-heading" className="flex min-h-8 items-center text-sm font-medium text-ink">
                Main colors
              </h2>
              <div className="flex h-8 overflow-hidden rounded-md border border-rule" aria-hidden="true">
                {palette.map((color) => (
                  <span key={color.hex} style={{ backgroundColor: color.hex, flexGrow: color.share }} />
                ))}
              </div>
              <ul className="rounded-lg border border-rule bg-raised">
                {palette.map((color) => (
                  <ColorRow key={color.hex} hex={color.hex} detail={`${Math.round(color.share * 100)}%`} />
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </ToolPage>
  );
};
