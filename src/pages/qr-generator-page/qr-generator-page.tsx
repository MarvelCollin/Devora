import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineTrash,
  HiOutlineArrowDownTray,
  HiOutlineClipboardDocument,
  HiCheck,
} from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { Notice } from "../../components/common/notice/notice";
import {
  generateQrDataUrl,
  generateBulkZip,
  parseBulkCsv,
} from "../../services/qr-generator-service";

type Mode = "single" | "bulk";

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "single", label: "Single code" },
  { value: "bulk", label: "Batch to PDF" },
];

const BULK_PLACEHOLDER = `SLC-CHR-601, Room 601, 41
SLC-CHR-602, Room 602, 41
SLC-CHR-711A, Room 711A, 19`;

const QR_SIZE = 320;

const copyImageToClipboard = async (dataUrl: string) => {
  const blob = await (await fetch(dataUrl)).blob();
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
};

const SingleQr = () => {
  const [content, setContent] = useState("");
  const [qr, setQr] = useState<{ source: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    if (!content.trim()) return;
    let cancelled = false;
    generateQrDataUrl(content, QR_SIZE * 2).then((url) => {
      if (!cancelled) setQr({ source: content, url });
    });
    return () => {
      cancelled = true;
    };
  }, [content]);

  const dataUrl = content.trim() && qr?.source === content ? qr.url : null;

  const download = () => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = dataUrl;
    link.click();
  };

  const copyImage = async () => {
    if (!dataUrl) return;
    try {
      await copyImageToClipboard(dataUrl);
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
      <TextArea
        label="Content"
        value={content}
        onChange={setContent}
        placeholder="Text or a link, like https://example.com"
        hint={content ? `${content.length.toLocaleString()} characters` : undefined}
        actions={
          <Button
            label="Clear"
            variant="ghost"
            size="sm"
            onClick={() => setContent("")}
            disabled={!content}
            icon={HiOutlineTrash}
          />
        }
      />

      <section aria-labelledby="qr-preview-heading" className="flex min-h-0 flex-col gap-2">
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
          <h2 id="qr-preview-heading" className="text-sm font-medium text-ink">
            QR code
          </h2>
          <div className="flex items-center gap-1">
            <Button
              label={copied ? "Copied" : "Copy image"}
              variant="ghost"
              size="sm"
              onClick={copyImage}
              disabled={!dataUrl}
              icon={copied ? HiCheck : HiOutlineClipboardDocument}
            />
            <Button
              label="Download PNG"
              variant="primary"
              size="sm"
              onClick={download}
              disabled={!dataUrl}
              icon={HiOutlineArrowDownTray}
            />
          </div>
        </div>
        <div className="flex min-h-80 flex-1 items-center justify-center rounded-lg border border-rule bg-surface p-6">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR code for ${content.length > 60 ? `${content.slice(0, 60)}...` : content}`}
              width={QR_SIZE}
              height={QR_SIZE}
              className="h-auto w-full max-w-80 rounded-md border border-rule bg-white p-2"
            />
          ) : (
            <p className="max-w-60 text-center text-muted">
              Type some content and the QR code appears here.
            </p>
          )}
        </div>
        <span className="sr-only" aria-live="polite">
          {copied ? "QR code image copied" : ""}
        </span>
        {copyError && (
          <Notice tone="error">
            The image could not be copied. Your browser may block image copying, so use
            Download PNG instead.
          </Notice>
        )}
      </section>
    </div>
  );
};

const BulkQr = () => {
  const [csv, setCsv] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(false);

  const entries = useMemo(() => parseBulkCsv(csv), [csv]);
  const totalCodes = entries.reduce((sum, entry) => sum + entry.count, 0);

  const generate = async () => {
    if (entries.length === 0) return;
    setGenerating(true);
    setError(false);
    try {
      await generateBulkZip(entries);
    } catch {
      setError(true);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
      <TextArea
        label="Rows"
        hint="value, title, count"
        value={csv}
        onChange={setCsv}
        placeholder={BULK_PLACEHOLDER}
        actions={
          <Button
            label="Clear"
            variant="ghost"
            size="sm"
            onClick={() => setCsv("")}
            disabled={!csv}
            icon={HiOutlineTrash}
          />
        }
      />

      <section aria-labelledby="bulk-preview-heading" className="flex min-h-0 flex-col gap-2">
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
          <h2 id="bulk-preview-heading" className="text-sm font-medium text-ink">
            Preview
          </h2>
          <Button
            label={
              generating
                ? "Generating"
                : entries.length > 1
                  ? `Download ZIP of ${entries.length} PDFs`
                  : "Download PDF"
            }
            variant="primary"
            size="sm"
            onClick={generate}
            disabled={entries.length === 0}
            loading={generating}
            icon={HiOutlineArrowDownTray}
          />
        </div>

        {entries.length === 0 ? (
          <div className="flex min-h-80 flex-1 flex-col justify-center gap-2 rounded-lg border border-rule bg-surface p-6 text-muted">
            <p>Add one row per line with the code value, a title and how many copies to print.</p>
            <p className="text-sm">
              Each row becomes its own PDF. A header row of value, title, count is skipped.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted" aria-live="polite">
              <span className="font-semibold text-ink">{entries.length}</span>{" "}
              {entries.length === 1 ? "row" : "rows"} with{" "}
              <span className="font-semibold text-ink">{totalCodes.toLocaleString()}</span> QR codes
              in total.
            </p>
            <div
              tabIndex={0}
              role="region"
              aria-label="Rows to generate"
              className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-rule bg-raised"
            >
              <ol>
                {entries.map((entry, index) => (
                  <li
                    key={`${entry.value}-${index}`}
                    className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-4 py-2.5 last:border-b-0"
                  >
                    <span className="font-mono text-xs tabular-nums text-muted">{index + 1}</span>
                    <span className="min-w-0">
                      <span className="block font-mono text-sm break-all text-ink">{entry.value}</span>
                      <span className="block text-sm text-muted">{entry.title}</span>
                    </span>
                    <span className="font-mono text-sm tabular-nums text-ink">
                      {entry.count} {entry.count === 1 ? "copy" : "copies"}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
        {error && (
          <Notice tone="error">
            The PDF could not be created. Check that every row has a value, then try again.
          </Notice>
        )}
      </section>
    </div>
  );
};

export const QrGeneratorPage = () => {
  const [mode, setMode] = useState<Mode>("single");

  return (
    <ToolPage
      title="QR Code Generator"
      description="Make a single QR code as a PNG, or a printable batch where each row becomes a PDF."
      fill
      actions={
        <SegmentedControl label="Mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />
      }
    >
      {mode === "single" ? <SingleQr /> : <BulkQr />}
    </ToolPage>
  );
};
