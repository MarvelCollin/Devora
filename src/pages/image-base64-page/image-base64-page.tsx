import { useCallback, useEffect, useMemo, useState } from "react";
import { HiOutlineArrowDownTray, HiOutlineTrash } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { DropZone } from "../../components/common/drop-zone/drop-zone";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { CodeBlock } from "../../components/common/code-block/code-block";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { Notice } from "../../components/common/notice/notice";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { formatBytes } from "../../services/image-compressor-service";

type Mode = "encode" | "decode";
type Snippet = "data" | "css" | "html" | "markdown" | "raw";

interface IEncoded {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  width: number;
  height: number;
}

const MODES: { value: Mode; label: string }[] = [
  { value: "encode", label: "Image to Base64" },
  { value: "decode", label: "Base64 to image" },
];

const SNIPPETS: { value: Snippet; label: string }[] = [
  { value: "data", label: "Data URL" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "markdown", label: "Markdown" },
  { value: "raw", label: "Base64 only" },
];

const SIGNATURES: [RegExp, string][] = [
  [/^iVBORw0KGgo/, "image/png"],
  [/^\/9j\//, "image/jpeg"],
  [/^R0lGOD/, "image/gif"],
  [/^UklGR.{5}XRUJQ/, "image/webp"],
  [/^PHN2Zy|^PD94bWw/, "image/svg+xml"],
  [/^Qk/, "image/bmp"],
  [/^AAABAA/, "image/x-icon"],
];

const readFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });

const measure = (src: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("decode"));
    img.src = src;
  });

const toDataUrl = (input: string): { url: string; type: string } | null => {
  const trimmed = input.trim().replace(/\s+/g, "");
  if (!trimmed) return null;
  const match = trimmed.match(/^data:([\w/+.-]+);base64,(.+)$/);
  if (match) return { url: trimmed, type: match[1] };
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) return null;
  const type = SIGNATURES.find(([pattern]) => pattern.test(trimmed))?.[1];
  return type ? { url: `data:${type};base64,${trimmed}`, type } : null;
};

const snippetFor = (snippet: Snippet, encoded: IEncoded) => {
  const alt = encoded.name.replace(/\.[^.]+$/, "");
  switch (snippet) {
    case "css":
      return `background-image: url("${encoded.dataUrl}");`;
    case "html":
      return `<img src="${encoded.dataUrl}" alt="${alt}" width="${encoded.width}" height="${encoded.height}" />`;
    case "markdown":
      return `![${alt}](${encoded.dataUrl})`;
    case "raw":
      return encoded.dataUrl.slice(encoded.dataUrl.indexOf(",") + 1);
    default:
      return encoded.dataUrl;
  }
};

const EncodePanel = () => {
  const [encoded, setEncoded] = useState<IEncoded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snippet, setSnippet] = usePersistentState<Snippet>("image-base64:snippet", "data");

  const load = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(`${file.name} is not an image. Choose a PNG, JPEG, WebP, GIF or SVG file.`);
      return;
    }
    try {
      const dataUrl = await readFile(file);
      const size = await measure(dataUrl);
      setEncoded({ name: file.name || "pasted-image.png", type: file.type, size: file.size, dataUrl, ...size });
      setError(null);
    } catch {
      setError(`${file.name} could not be read. The file may be damaged.`);
    }
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith("image/"));
      if (file) {
        event.preventDefault();
        void load(file);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [load]);

  const encodedLength = encoded ? encoded.dataUrl.length : 0;

  return (
    <>
      <DropZone
        onFiles={(files) => void load(files[0])}
        title="Drop an image here"
        activeTitle="Release to convert"
        subtitle="or paste one with Ctrl V, or pick a file"
        buttonLabel="Choose an image"
      />
      {error && <Notice tone="error">{error}</Notice>}
      {encoded && (
        <>
          <SummaryStrip
            label="Image details"
            items={[
              {
                label: "Base64 size",
                value: formatBytes(encodedLength),
                context: `${Math.round((encodedLength / encoded.size - 1) * 100)}% larger than the file`,
                lead: true,
              },
              { label: "File size", value: formatBytes(encoded.size) },
              { label: "Dimensions", value: `${encoded.width} × ${encoded.height}` },
              { label: "Type", value: encoded.type.replace("image/", "").toUpperCase() },
            ]}
          />
          {encoded.size > 100 * 1024 && (
            <Notice tone="info">
              Inline images over 100 KB make pages and stylesheets slower to load. A normal image file is
              usually better at this size.
            </Notice>
          )}
          <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <figure className="flex flex-col gap-2">
              <img
                src={encoded.dataUrl}
                alt={`Preview of ${encoded.name}`}
                width={encoded.width}
                height={encoded.height}
                className="h-auto max-h-64 w-full rounded-lg border border-rule bg-surface object-contain"
              />
              <figcaption className="text-sm break-all text-muted">{encoded.name}</figcaption>
            </figure>
            <div className="flex min-w-0 flex-col gap-3">
              <SegmentedControl label="Copy as" options={SNIPPETS} value={snippet} onChange={setSnippet} />
              <CodeBlock label="Output" code={snippetFor(snippet, encoded)} />
            </div>
          </div>
        </>
      )}
    </>
  );
};

const DecodePanel = () => {
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<{ source: string; width: number; height: number } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const parsed = useMemo(() => toDataUrl(input), [input]);

  useEffect(() => {
    if (!parsed) return;
    let cancelled = false;
    measure(parsed.url)
      .then((size) => {
        if (!cancelled) setPreview({ source: parsed.url, ...size });
      })
      .catch(() => {
        if (!cancelled) setFailed(parsed.url);
      });
    return () => {
      cancelled = true;
    };
  }, [parsed]);

  const ready = parsed && preview?.source === parsed.url ? preview : null;
  const broken = parsed && failed === parsed.url;
  const bytes = parsed ? Math.floor((parsed.url.length - parsed.url.indexOf(",") - 1) * 0.75) : 0;

  const download = () => {
    if (!parsed) return;
    const extension = parsed.type.split("/")[1].replace("svg+xml", "svg").replace("x-icon", "ico");
    const link = document.createElement("a");
    link.href = parsed.url;
    link.download = `image.${extension}`;
    link.click();
  };

  const error =
    input.trim() && !parsed
      ? "This is not an image in Base64. Paste a data URL that starts with data:image, or Base64 of a PNG, JPEG, GIF, WebP or SVG file."
      : broken
        ? "The Base64 looks right, but the browser could not draw the image. The data may be cut off."
        : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <TextArea
          label="Base64 or data URL"
          value={input}
          onChange={setInput}
          invalid={Boolean(error)}
          placeholder="data:image/png;base64,iVBORw0KGgo..."
          actions={
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onClick={() => setInput("")}
              disabled={!input}
              icon={HiOutlineTrash}
            />
          }
        />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
      <section aria-labelledby="decoded-heading" className="flex flex-col gap-2">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <h2 id="decoded-heading" className="text-sm font-medium text-ink">
            Image
          </h2>
          <Button
            label="Download"
            variant="primary"
            size="sm"
            icon={HiOutlineArrowDownTray}
            onClick={download}
            disabled={!ready}
          />
        </div>
        <div className="flex min-h-64 flex-1 items-center justify-center rounded-lg border border-rule bg-surface p-4">
          {ready ? (
            <img
              src={ready.source}
              alt="Decoded image"
              width={ready.width}
              height={ready.height}
              className="h-auto max-h-96 max-w-full object-contain"
            />
          ) : (
            <p className="text-muted">The decoded image shows up here.</p>
          )}
        </div>
        {ready && parsed && (
          <p className="text-sm text-muted">
            {parsed.type.replace("image/", "").toUpperCase()}, {ready.width} × {ready.height}, about {formatBytes(bytes)}
          </p>
        )}
      </section>
    </div>
  );
};

export const ImageBase64Page = () => {
  const [mode, setMode] = usePersistentState<Mode>("image-base64:mode", "encode");

  return (
    <ToolPage
      title="Image to Base64"
      description="Turn an image into a data URL you can paste into CSS or HTML, or turn Base64 back into an image file."
      actions={<SegmentedControl label="Direction" options={MODES} value={mode} onChange={setMode} />}
    >
      {mode === "encode" ? <EncodePanel /> : <DecodePanel />}
    </ToolPage>
  );
};
