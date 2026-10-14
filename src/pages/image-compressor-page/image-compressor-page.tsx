import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { clsx } from "clsx";
import {
  HiOutlineArrowUpTray,
  HiOutlineArrowDownTray,
  HiOutlineArchiveBox,
  HiOutlineTrash,
} from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { Slider } from "../../components/common/slider/slider";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";
import { Notice } from "../../components/common/notice/notice";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import {
  compressImage,
  downloadBlob,
  downloadAllZip,
  formatBytes,
  type OutputFormat,
  type CompressedResult,
} from "../../services/image-compressor-service";

interface IComputed {
  files: File[];
  format: OutputFormat;
  quality: number;
  maxWidth: number;
  results: CompressedResult[];
}

const FORMATS: { value: OutputFormat; label: string }[] = [
  { value: "image/webp", label: "WebP" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/png", label: "PNG" },
];

const WIDTH_PRESETS: { value: number; label: string }[] = [
  { value: 0, label: "None" },
  { value: 1920, label: "1920" },
  { value: 1280, label: "1280" },
  { value: 800, label: "800" },
  { value: 480, label: "480" },
];

const revokeResults = (results: CompressedResult[]) => {
  results.forEach((result) => {
    URL.revokeObjectURL(result.originalUrl);
    URL.revokeObjectURL(result.compressedUrl);
  });
};

const changeLabel = (original: number, compressed: number) => {
  if (original === 0) return { text: "No change", smaller: true };
  const ratio = Math.round(((original - compressed) / original) * 100);
  return ratio >= 0
    ? { text: `${ratio}% smaller`, smaller: true }
    : { text: `${Math.abs(ratio)}% larger`, smaller: false };
};

export const ImageCompressorPage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [computed, setComputed] = useState<IComputed | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/webp");
  const [qualityInput, setQualityInput] = useState(75);
  const [maxWidth, setMaxWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [zipping, setZipping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<CompressedResult[]>([]);
  const quality = useDebouncedValue(qualityInput, 250) / 100;

  useEffect(() => {
    resultsRef.current = computed?.results ?? [];
  }, [computed]);

  useEffect(() => () => revokeResults(resultsRef.current), []);

  useEffect(() => {
    if (files.length === 0) return;
    let cancelled = false;
    const options = { format, quality, maxWidth };
    Promise.allSettled(files.map((file) => compressImage(file, options))).then((outcomes) => {
      const results = outcomes.flatMap((outcome) =>
        outcome.status === "fulfilled" ? [outcome.value] : []
      );
      if (cancelled) {
        revokeResults(results);
        return;
      }
      const failed = files.filter((_, i) => outcomes[i].status === "rejected");
      revokeResults(resultsRef.current);
      if (failed.length > 0) {
        revokeResults(results);
        setSkipped((prev) => [...prev, ...failed.map((file) => file.name)]);
        setFiles(files.filter((_, i) => outcomes[i].status === "fulfilled"));
        setComputed(null);
        return;
      }
      setComputed({ files, format, quality, maxWidth, results });
    });
    return () => {
      cancelled = true;
    };
  }, [files, format, quality, maxWidth]);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const all = Array.from(fileList);
    const images = all.filter((file) => file.type.startsWith("image/"));
    const rejected = all.filter((file) => !file.type.startsWith("image/"));
    setSkipped(rejected.map((file) => file.name));
    if (images.length > 0) setFiles((prev) => [...prev, ...images]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const clearAll = () => {
    revokeResults(resultsRef.current);
    resultsRef.current = [];
    setComputed(null);
    setFiles([]);
    setSkipped([]);
  };

  const removeAt = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    if (next.length === 0) {
      clearAll();
      return;
    }
    setFiles(next);
  };

  const downloadZip = async () => {
    if (!computed) return;
    setZipping(true);
    try {
      await downloadAllZip(computed.results);
    } finally {
      setZipping(false);
    }
  };

  const isCurrent =
    computed !== null &&
    computed.files === files &&
    computed.format === format &&
    computed.quality === quality &&
    computed.maxWidth === maxWidth;
  const processing = files.length > 0 && !isCurrent;
  const results = computed && computed.files === files ? computed.results : [];
  const firstPass = processing && results.length === 0;

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const savedRatio =
    totalOriginal > 0 ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0;
  const formatLabel = FORMATS.find((item) => item.value === format)?.label ?? "";

  return (
    <ToolPage
      title="Image Compressor"
      description="Shrink and resize images right in your browser. Nothing is uploaded."
      actions={
        files.length > 0 && (
          <>
            <Button label="Clear all" variant="ghost" icon={HiOutlineTrash} onClick={clearAll} />
            <Button
              label="Download all as ZIP"
              variant="primary"
              icon={HiOutlineArchiveBox}
              onClick={downloadZip}
              loading={zipping}
              disabled={results.length === 0 || processing}
            />
          </>
        )
      }
    >
      <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section aria-labelledby="settings-heading" className="flex flex-col gap-6">
          <h2 id="settings-heading" className="sr-only">
            Settings
          </h2>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={clsx(
              "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors duration-150",
              dragging ? "border-primary bg-tint" : "border-line bg-surface"
            )}
          >
            <HiOutlineArrowUpTray className="h-6 w-6 text-strong" aria-hidden="true" />
            <p className="font-medium text-ink">
              {dragging ? "Release to add images" : "Drop images here"}
            </p>
            <p className="text-sm text-muted">or pick them from your device</p>
            <Button
              label="Choose images"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              className="mt-2"
            />
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>

          <SegmentedControl
            label="Output format"
            options={FORMATS}
            value={format}
            onChange={setFormat}
            fullWidth
          />
          <Slider
            label="Quality"
            value={qualityInput}
            min={10}
            max={100}
            step={5}
            onChange={setQualityInput}
            valueText={`${qualityInput}%`}
            disabled={format === "image/png"}
            hint={
              format === "image/png"
                ? "PNG is lossless, so quality does not apply."
                : "Lower quality gives smaller files. 70 to 80 is a good balance."
            }
          />
          <SegmentedControl
            label="Max width in pixels"
            options={WIDTH_PRESETS}
            value={maxWidth}
            onChange={setMaxWidth}
            fullWidth
          />
        </section>

        <section aria-labelledby="results-heading" className="flex min-w-0 flex-col gap-4">
          <h2 id="results-heading" className="sr-only">
            Results
          </h2>

          {skipped.length > 0 && (
            <Notice
              tone="error"
              action={<Button label="Dismiss" variant="ghost" size="sm" onClick={() => setSkipped([])} />}
            >
              Skipped {skipped.length === 1 ? "a file that is" : `${skipped.length} files that are`} not
              an image your browser can open: {skipped.join(", ")}
            </Notice>
          )}

          {files.length === 0 ? (
            <div className="flex min-h-72 flex-col items-start justify-center gap-2 rounded-lg border border-rule bg-surface px-8 py-10">
              <p className="font-medium text-ink">No images yet</p>
              <p className="max-w-md text-muted">
                Add images on the left. They are compressed with the current settings and you can
                change the settings at any time.
              </p>
            </div>
          ) : (
            <>
              <SummaryStrip
                label="Compression summary"
                items={[
                  {
                    label: savedRatio >= 0 ? "Saved" : "Grew by",
                    value: firstPass ? "..." : `${Math.abs(savedRatio)}%`,
                    context: firstPass
                      ? "Compressing"
                      : processing
                        ? "Updating with new settings"
                        : `${formatBytes(totalOriginal)} down to ${formatBytes(totalCompressed)}`,
                    lead: true,
                  },
                  { label: "Images", value: files.length },
                  {
                    label: "Output",
                    value: formatLabel,
                    context: maxWidth ? `Max ${maxWidth}px wide` : "Original size",
                  },
                ]}
              />
              {!processing && savedRatio < 0 && (
                <Notice tone="info">
                  The output is larger than the originals. Try WebP or a lower quality.
                </Notice>
              )}

              <ul
                className={clsx(
                  "flex flex-col rounded-lg border border-rule bg-raised transition-opacity duration-150",
                  processing && !firstPass && "opacity-60"
                )}
                aria-busy={processing}
              >
                {firstPass
                  ? files.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-4 border-b border-rule px-4 py-3 last:border-b-0"
                      >
                        <div className="h-16 w-16 shrink-0 animate-pulse rounded-md bg-surface" />
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                          <div className="h-3 w-40 animate-pulse rounded bg-surface" />
                        </div>
                      </li>
                    ))
                  : results.map((result, index) => {
                      const change = changeLabel(result.originalSize, result.compressedSize);
                      return (
                        <li
                          key={result.compressedUrl}
                          className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-rule px-4 py-3 last:border-b-0"
                        >
                          <img
                            src={result.compressedUrl}
                            alt=""
                            width={64}
                            height={64}
                            loading="lazy"
                            className="h-16 w-16 shrink-0 rounded-md border border-rule object-cover"
                          />
                          <div className="min-w-0 flex-1 basis-48">
                            <p className="text-sm font-medium break-all text-ink">{result.name}</p>
                            <p className="font-mono text-xs tabular-nums text-muted">
                              {result.width} × {result.height}
                            </p>
                            <p className="mt-1 font-mono text-xs tabular-nums text-muted">
                              {formatBytes(result.originalSize)} to{" "}
                              <span className="text-ink">{formatBytes(result.compressedSize)}</span>
                              <span
                                className={clsx(
                                  "ml-2 font-sans font-semibold",
                                  change.smaller ? "text-success" : "text-danger"
                                )}
                              >
                                {change.text}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              label="Download"
                              ariaLabel={`Download ${result.name}`}
                              variant="secondary"
                              size="sm"
                              icon={HiOutlineArrowDownTray}
                              onClick={() => downloadBlob(result.blob, result.name)}
                            />
                            <Button
                              label="Remove"
                              ariaLabel={`Remove ${result.name}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAt(index)}
                            />
                          </div>
                        </li>
                      );
                    })}
              </ul>
            </>
          )}
        </section>
      </div>
    </ToolPage>
  );
};
