import { useEffect, useState } from "react";
import { HiArrowPath } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { TextInput } from "../../components/common/text-input/text-input";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { DateTimeField } from "../../components/common/date-time-field/date-time-field";
import {
  formatDateTime,
  getTimezoneLabel,
  parseDateTime,
} from "../../utils/date-utils";

type Mode = "unix-to-date" | "date-to-unix";

interface IResultRow {
  label: string;
  value: string;
}

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "unix-to-date", label: "Unix to date" },
  { value: "date-to-unix", label: "Date to Unix" },
];

const getRelativeTime = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const absDiff = Math.abs(diff);
  if (absDiff < 1000) return "just now";
  const units: [number, string][] = [
    [365 * 24 * 3600 * 1000, "year"],
    [30 * 24 * 3600 * 1000, "month"],
    [24 * 3600 * 1000, "day"],
    [3600 * 1000, "hour"],
    [60 * 1000, "minute"],
    [1000, "second"],
  ];
  const [size, unit] = units.find(([ms]) => absDiff >= ms) ?? units[units.length - 1];
  const count = Math.floor(absDiff / size);
  const label = `${count} ${unit}${count === 1 ? "" : "s"}`;
  return diff < 0 ? `in ${label}` : `${label} ago`;
};

const parseUnix = (text: string): { date: Date; unit: "seconds" | "milliseconds" } | null => {
  const trimmed = text.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  const isMs = Math.abs(num) >= 1e11;
  const date = new Date(isMs ? num : num * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return { date, unit: isMs ? "milliseconds" : "seconds" };
};

const ResultRows = ({ rows }: { rows: IResultRow[] }) => (
  <dl className="rounded-lg border border-rule bg-raised">
    {rows.map((row) => (
      <div
        key={row.label}
        className="flex flex-col gap-1 border-b border-rule px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-6"
      >
        <dt className="w-44 shrink-0 text-sm text-muted">{row.label}</dt>
        <dd className="min-w-0 flex-1 font-mono text-base break-all text-ink">{row.value}</dd>
        <dd className="sm:self-center">
          <CopyButton value={row.value} />
        </dd>
      </div>
    ))}
  </dl>
);

export const TimestampConverterPage = () => {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [mode, setMode] = useState<Mode>("unix-to-date");
  const [unixInput, setUnixInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [dateInput, setDateInput] = useState(() => formatDateTime(new Date()));

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  const fillCurrentTime = () => {
    const current = new Date();
    setUnixInput(String(Math.floor(current.getTime() / 1000)));
    setDateInput(formatDateTime(current));
  };

  const timezone = getTimezoneLabel();
  const unixParsed = parseUnix(unixInput);
  const unixError =
    unixInput.trim() && !unixParsed
      ? "Enter whole digits only, like 1760400000 for seconds or 1760400000000 for milliseconds."
      : null;

  const dateParsed = parseDateTime(dateInput);
  const dateError =
    dateInput.trim() && !dateParsed
      ? "Use the format YYYY-MM-DD HH:mm:ss, or pick a date from the calendar."
      : null;

  const unixRows: IResultRow[] = unixParsed
    ? [
        { label: `Local time (${timezone})`, value: formatDateTime(unixParsed.date) },
        { label: "UTC", value: unixParsed.date.toUTCString() },
        { label: "ISO 8601", value: unixParsed.date.toISOString() },
        { label: "Relative", value: getRelativeTime(unixParsed.date) },
        {
          label: "Day of week",
          value: unixParsed.date.toLocaleDateString(undefined, { weekday: "long" }),
        },
        { label: "Milliseconds", value: String(unixParsed.date.getTime()) },
      ]
    : [];

  const dateRows: IResultRow[] = dateParsed
    ? [
        { label: "Unix seconds", value: String(Math.floor(dateParsed.getTime() / 1000)) },
        { label: "Unix milliseconds", value: String(dateParsed.getTime()) },
        { label: "ISO 8601", value: dateParsed.toISOString() },
        { label: "UTC", value: dateParsed.toUTCString() },
        { label: "Relative", value: getRelativeTime(dateParsed) },
        {
          label: "Day of week",
          value: dateParsed.toLocaleDateString(undefined, { weekday: "long" }),
        },
      ]
    : [];

  return (
    <ToolPage
      title="Timestamp Converter"
      description="Convert Unix timestamps to readable dates and back. Dates you type are read in your local timezone."
      actions={
        <SegmentedControl
          label="Direction"
          options={MODE_OPTIONS}
          value={mode}
          onChange={setMode}
        />
      }
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-rule py-3">
        <span className="text-sm text-muted">Current Unix time</span>
        <span className="font-mono text-lg font-semibold tabular-nums text-ink" aria-live="off">
          {now}
        </span>
        <CopyButton value={String(now)} />
        <span className="text-sm text-muted">Your timezone is {timezone}</span>
        <Button
          label="Use current time"
          variant="secondary"
          size="sm"
          icon={HiArrowPath}
          onClick={fillCurrentTime}
          className="sm:ml-auto"
        />
      </div>

      {mode === "unix-to-date" ? (
        <div className="flex max-w-4xl flex-col gap-6">
          <TextInput
            label="Unix timestamp"
            hint={unixParsed ? `Read as ${unixParsed.unit}` : "Seconds or milliseconds"}
            value={unixInput}
            onChange={setUnixInput}
            placeholder="1760400000"
            inputMode="numeric"
            size="lg"
            error={unixError}
          />
          {unixRows.length > 0 && <ResultRows rows={unixRows} />}
        </div>
      ) : (
        <div className="flex max-w-4xl flex-col gap-6">
          <DateTimeField
            label="Date and time"
            hint={`Local time, ${timezone}`}
            value={dateInput}
            onChange={setDateInput}
            error={dateError}
          />
          {dateRows.length > 0 && <ResultRows rows={dateRows} />}
        </div>
      )}
    </ToolPage>
  );
};
