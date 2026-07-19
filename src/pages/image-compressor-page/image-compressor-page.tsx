import { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import {
  HiOutlinePhoto,
  HiOutlineArrowUpTray,
  HiOutlineDocumentArrowDown,
  HiOutlineArchiveBox,
  HiOutlineTrash,
} from "react-icons/hi2";
import { Button } from "../../components/common/button/button";
import {
  compressImage,
  downloadBlob,
  downloadAllZip,
  formatBytes,
  type OutputFormat,
  type CompressedResult,
} from "../../services/image-compressor-service";

const FORMATS: { value: OutputFormat; label: string }[] = [
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/webp", label: "WebP" },
  { value: "image/png", label: "PNG" },
];

const WIDTH_PRESETS: { value: number; label: string }[] = [
  { value: 0, label: "Original" },
  { value: 1920, label: "1920px" },
  { value: 1280, label: "1280px" },
  { value: 800, label: "800px" },
  { value: 480, label: "480px" },
];

const revokeResults = (results: CompressedResult[]) => {
  results.forEach((result) => {
    URL.revokeObjectURL(result.originalUrl);
    URL.revokeObjectURL(result.compressedUrl);
  });
};

export const ImageCompressorPage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<CompressedResult[]>([]);
  const [format, setFormat] = useState<OutputFormat>("image/webp");
  const [quality, setQuality] = useState(0.75);
  const [maxWidth, setMaxWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<CompressedResult[]>([]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    if (files.length === 0) return;
    let cancelled = false;
    Promise.all(
      files.map((file) => compressImage(file, { format, quality, maxWidth }))
    ).then((next) => {
      if (cancelled) {
        revokeResults(next);
        return;
      }
      revokeResults(resultsRef.current);
      setResults(next);
    });
    return () => {
      cancelled = true;
    };
  }, [files, format, quality, maxWidth]);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const images = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/")
    );
    if (images.length === 0) return;
    setFiles((prev) => [...prev, ...images]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const handleClear = () => {
    revokeResults(resultsRef.current);
    setResults([]);
    setFiles([]);
  };

  const handleRemove = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    if (next.length === 0) {
      revokeResults(resultsRef.current);
      setResults([]);
    }
    setFiles(next);
  };

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const savedRatio =
    totalOriginal > 0
      ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100)
      : 0;

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlinePhoto className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              Image Compressor
            </h2>
            <p className="text-sm text-dark-400">
              Compress and resize images with adjustable quality and format
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {results.length > 0 && (
            <Button
              label="Download All"
              variant="primary"
              size="sm"
              onClick={() => downloadAllZip(results)}
              icon={HiOutlineArchiveBox}
            />
          )}
          {files.length > 0 && (
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              icon={HiOutlineTrash}
            />
          )}
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 w-80 shrink-0">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={clsx(
              "flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200",
              dragging
                ? "border-accent-500 bg-accent-600/10"
                : "border-dark-700 bg-dark-900 hover:border-dark-600"
            )}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent-600/10 text-accent-400">
              <HiOutlineArrowUpTray className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-dark-200">
                Drop images here
              </p>
              <p className="text-xs text-dark-500 mt-1">or click to browse</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
            <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3 block">
              Format
            </span>
            <div className="flex items-center p-1 rounded-lg bg-dark-800 border border-dark-700">
              {FORMATS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFormat(item.value)}
                  className={clsx(
                    "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    format === item.value
                      ? "bg-accent-600 text-white shadow-lg shadow-accent-600/20"
                      : "text-dark-400 hover:text-dark-200"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold">
                Quality
              </span>
              <span className="text-sm font-mono text-dark-200">
                {Math.round(quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={Math.round(quality * 100)}
              onChange={(e) => setQuality(Number(e.target.value) / 100)}
              disabled={format === "image/png"}
              className="w-full accent-accent-500 disabled:opacity-40"
            />
            {format === "image/png" && (
              <p className="text-xs text-dark-500 mt-2">
                PNG is lossless, quality has no effect
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
            <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3 block">
              Max Width
            </span>
            <div className="grid grid-cols-3 gap-2">
              {WIDTH_PRESETS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setMaxWidth(item.value)}
                  className={clsx(
                    "px-2 py-2 rounded-lg text-xs font-medium border transition-all duration-200",
                    maxWidth === item.value
                      ? "bg-accent-600 text-white border-accent-500"
                      : "bg-dark-800 text-dark-400 border-dark-700 hover:text-dark-200"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {results.length > 0 && (
            <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
              <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3 block">
                Summary
              </span>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-dark-400">Original</span>
                  <span className="font-mono text-dark-200">
                    {formatBytes(totalOriginal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-400">Compressed</span>
                  <span className="font-mono text-dark-200">
                    {formatBytes(totalCompressed)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-dark-700">
                  <span className="text-dark-400">Saved</span>
                  <span
                    className={clsx(
                      "font-mono font-semibold",
                      savedRatio >= 0 ? "text-success-400" : "text-error-500"
                    )}
                  >
                    {savedRatio}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto rounded-xl border border-dark-700 bg-dark-900 p-4">
            {results.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-dark-500 text-sm">
                  Upload images to start compressing
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {results.map((result, index) => {
                  const ratio =
                    result.originalSize > 0
                      ? Math.round(
                          ((result.originalSize - result.compressedSize) /
                            result.originalSize) *
                            100
                        )
                      : 0;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-xl bg-dark-800 border border-dark-700"
                    >
                      <img
                        src={result.compressedUrl}
                        alt={result.name}
                        className="w-16 h-16 rounded-lg object-cover border border-dark-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-100 truncate">
                          {result.name}
                        </p>
                        <p className="text-xs text-dark-500 mt-0.5">
                          {result.width} × {result.height}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs font-mono">
                          <span className="text-dark-500">
                            {formatBytes(result.originalSize)}
                          </span>
                          <span className="text-dark-600">→</span>
                          <span className="text-dark-200">
                            {formatBytes(result.compressedSize)}
                          </span>
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-md",
                              ratio >= 0
                                ? "bg-success-400/10 text-success-400"
                                : "bg-error-500/10 text-error-500"
                            )}
                          >
                            {ratio >= 0 ? "-" : "+"}
                            {Math.abs(ratio)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          label="Download"
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadBlob(result.blob, result.name)}
                          icon={HiOutlineDocumentArrowDown}
                        />
                        <button
                          onClick={() => handleRemove(index)}
                          className="p-2 rounded-lg text-dark-500 hover:text-error-500 hover:bg-dark-700 transition-all duration-200"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
