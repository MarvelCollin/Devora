import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  HiOutlineQrCode,
  HiOutlineTrash,
  HiOutlineDocumentArrowDown,
  HiOutlineClipboardDocument,
  HiCheck,
} from "react-icons/hi2";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import {
  generateQrDataUrl,
  generateBulkZip,
  parseBulkCsv,
} from "../../services/qr-generator-service";

const copyImageToClipboard = async (dataUrl: string) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": blob }),
  ]);
};

type Mode = "single" | "bulk";

const BULK_PLACEHOLDER = `value,title,count
SLC-CHR-601,Room 601,41
SLC-CHR-602,Room 602,41
SLC-CHR-711A,Room 711A,19`;

export const QrGeneratorPage = () => {
  const [mode, setMode] = useState<Mode>("single");
  const [singleInput, setSingleInput] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [bulkCsv, setBulkCsv] = useState("");
  const [generating, setGenerating] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  const parsed = parseBulkCsv(bulkCsv);
  const totalQrCodes = parsed.reduce((sum, e) => sum + e.count, 0);

  useEffect(() => {
    if (mode !== "single" || !singleInput.trim()) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    generateQrDataUrl(singleInput, 300).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [singleInput, mode]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setSingleInput("");
    setQrDataUrl(null);
  };

  const handleGenerateZip = async () => {
    if (parsed.length === 0) return;
    setGenerating(true);
    try {
      await generateBulkZip(parsed);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadSingle = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = qrDataUrl;
    link.click();
  };

  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    await copyImageToClipboard(qrDataUrl);
    setImageCopied(true);
    setTimeout(() => setImageCopied(false), 2000);
  };

  const handleClear = () => {
    setSingleInput("");
    setQrDataUrl(null);
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineQrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              QR Code Generator
            </h2>
            <p className="text-sm text-dark-400">
              Generate single or bulk QR codes with PDF export
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center p-1 rounded-lg bg-dark-800 border border-dark-700">
            <button
              onClick={() => handleModeChange("single")}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                mode === "single"
                  ? "bg-accent-600 text-white shadow-lg shadow-accent-600/20"
                  : "text-dark-400 hover:text-dark-200"
              )}
            >
              Single
            </button>
            <button
              onClick={() => handleModeChange("bulk")}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                mode === "bulk"
                  ? "bg-accent-600 text-white shadow-lg shadow-accent-600/20"
                  : "text-dark-400 hover:text-dark-200"
              )}
            >
              Bulk PDF
            </button>
          </div>
          {mode === "single" && (
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              icon={HiOutlineTrash}
            />
          )}
          {mode === "bulk" && (
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onClick={() => setBulkCsv("")}
              icon={HiOutlineTrash}
            />
          )}
        </div>
      </div>

      {mode === "single" ? (
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-dark-300">
                Content
              </span>
            </div>
            <TextArea
              value={singleInput}
              onChange={setSingleInput}
              placeholder="Enter text or URL to encode..."
              rows={20}
            />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-dark-300">
                QR Code
              </span>
              {qrDataUrl && (
                <div className="flex items-center gap-2">
                  <Button
                    label="Download PNG"
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadSingle}
                    icon={HiOutlineDocumentArrowDown}
                  />
                  <Button
                    label={imageCopied ? "Copied" : "Copy Image"}
                    variant={imageCopied ? "primary" : "ghost"}
                    size="sm"
                    onClick={handleCopyImage}
                    icon={imageCopied ? HiCheck : HiOutlineClipboardDocument}
                  />
                </div>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center rounded-xl border border-dark-700 bg-dark-900 p-8">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="max-w-[300px] max-h-[300px] rounded-lg"
                />
              ) : (
                <span className="text-dark-500 text-sm">
                  Enter content to generate QR code
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-dark-300">
                CSV Input
              </span>
              <span className="text-xs text-dark-500">
                format: value,title,count
              </span>
            </div>
            <TextArea
              value={bulkCsv}
              onChange={setBulkCsv}
              placeholder={BULK_PLACEHOLDER}
              rows={20}
            />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-dark-300">
                Preview
              </span>
              <Button
                label={generating ? "Generating..." : parsed.length > 1 ? "Download ZIP" : "Download PDF"}
                variant="primary"
                size="sm"
                onClick={handleGenerateZip}
                disabled={parsed.length === 0 || generating}
                icon={HiOutlineDocumentArrowDown}
              />
            </div>
            <div className="flex-1 overflow-auto rounded-xl border border-dark-700 bg-dark-900 p-4">
              {parsed.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-dark-500 text-sm">
                    Paste CSV lines to preview entries
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-accent-600/10 border border-accent-500/20 text-xs text-accent-400">
                      {parsed.length} room{parsed.length !== 1 ? "s" : ""}
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-xs text-dark-400">
                      {totalQrCodes} QR codes total
                      {parsed.length > 1
                        ? ` → ${parsed.length} PDFs in ZIP`
                        : " → 1 PDF"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {parsed.map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-800/50 text-sm"
                      >
                        <span className="text-dark-600 w-6 text-right text-xs">
                          {idx + 1}
                        </span>
                        <span className="text-dark-200 flex-1 truncate font-mono text-xs">
                          {entry.value}
                        </span>
                        <span className="text-dark-400 truncate max-w-[120px] text-xs">
                          {entry.title}
                        </span>
                        <span className="text-dark-500 text-xs whitespace-nowrap">
                          ×{entry.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
