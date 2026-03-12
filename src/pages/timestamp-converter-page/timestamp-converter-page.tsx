import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  HiOutlineClock,
  HiOutlineClipboardDocument,
  HiCheck,
  HiOutlineTrash,
  HiArrowPath,
} from "react-icons/hi2";
import { Button } from "../../components/common/button/button";
import { useClipboard } from "../../hooks/use-clipboard";

interface ITimestampState {
  unixInput: string;
  dateInput: string;
  currentUnix: number;
  mode: "unix-to-date" | "date-to-unix";
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const formatUTCDate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const getTimezone = (): string => {
  const offset = new Date().getTimezoneOffset();
  const absOffset = Math.abs(offset);
  const hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const minutes = String(absOffset % 60).padStart(2, "0");
  const sign = offset <= 0 ? "+" : "-";
  return `UTC${sign}${hours}:${minutes}`;
};

const getDayOfWeek = (date: Date): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
};

const getRelativeTime = (date: Date): string => {
  const now = Date.now();
  const diff = now - date.getTime();
  const absDiff = Math.abs(diff);
  const isFuture = diff < 0;

  if (absDiff < 1000) return "just now";

  const seconds = Math.floor(absDiff / 1000);
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let label = "";
  if (years > 0) label = `${years} year${years > 1 ? "s" : ""}`;
  else if (months > 0) label = `${months} month${months > 1 ? "s" : ""}`;
  else if (days > 0) label = `${days} day${days > 1 ? "s" : ""}`;
  else if (hours > 0) label = `${hours} hour${hours > 1 ? "s" : ""}`;
  else if (mins > 0) label = `${mins} minute${mins > 1 ? "s" : ""}`;
  else label = `${seconds} second${seconds > 1 ? "s" : ""}`;

  return isFuture ? `in ${label}` : `${label} ago`;
};

export const TimestampConverterPage = () => {
  const now = Math.floor(Date.now() / 1000);
  const [state, setState] = useState<ITimestampState>({
    unixInput: String(now),
    dateInput: formatDate(new Date()),
    currentUnix: now,
    mode: "unix-to-date",
  });
  const { copied, copy } = useClipboard();

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        currentUnix: Math.floor(Date.now() / 1000),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    setState((prev) => ({
      ...prev,
      unixInput: "",
      dateInput: "",
    }));
  };

  const handleNow = () => {
    const current = Math.floor(Date.now() / 1000);
    setState((prev) => ({
      ...prev,
      unixInput: String(current),
      dateInput: formatDate(new Date()),
    }));
  };

  const handleUnixChange = (value: string) => {
    setState((prev) => ({ ...prev, unixInput: value }));
  };

  const handleDateChange = (value: string) => {
    setState((prev) => ({ ...prev, dateInput: value }));
  };

  const handleModeChange = (mode: "unix-to-date" | "date-to-unix") => {
    setState((prev) => ({ ...prev, mode }));
  };

  const parsedUnixDate = (() => {
    if (!state.unixInput.trim()) return null;
    const num = Number(state.unixInput.trim());
    if (isNaN(num)) return null;
    const ms = String(num).length > 10 ? num : num * 1000;
    const date = new Date(ms);
    if (isNaN(date.getTime())) return null;
    return date;
  })();

  const parsedDateUnix = (() => {
    if (!state.dateInput.trim()) return null;
    const date = new Date(state.dateInput.trim());
    if (isNaN(date.getTime())) return null;
    return Math.floor(date.getTime() / 1000);
  })();

  const isUnixValid = state.unixInput.trim() !== "" && parsedUnixDate !== null;
  const isUnixInvalid = state.unixInput.trim() !== "" && parsedUnixDate === null;
  const isDateValid = state.dateInput.trim() !== "" && parsedDateUnix !== null;
  const isDateInvalid = state.dateInput.trim() !== "" && parsedDateUnix === null;

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineClock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              Timestamp Converter
            </h2>
            <p className="text-sm text-dark-400">
              Convert between Unix timestamps and human-readable dates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700">
            <span className="text-sm text-dark-400">Now:</span>
            <span className="text-sm font-mono font-semibold text-accent-400">
              {state.currentUnix}
            </span>
          </div>
          <Button
            label="Now"
            variant="primary"
            size="sm"
            onClick={handleNow}
            icon={HiArrowPath}
          />
          <Button
            label="Clear"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            icon={HiOutlineTrash}
          />
        </div>
      </div>

      <div className="flex items-center p-1 rounded-lg bg-dark-800 border border-dark-700 w-fit mb-6">
        <button
          onClick={() => handleModeChange("unix-to-date")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
            state.mode === "unix-to-date"
              ? "bg-accent-600 text-white shadow-lg shadow-accent-600/20"
              : "text-dark-400 hover:text-dark-200"
          )}
        >
          Unix → Date
        </button>
        <button
          onClick={() => handleModeChange("date-to-unix")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
            state.mode === "date-to-unix"
              ? "bg-accent-600 text-white shadow-lg shadow-accent-600/20"
              : "text-dark-400 hover:text-dark-200"
          )}
        >
          Date → Unix
        </button>
      </div>

      {state.mode === "unix-to-date" && (
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-dark-300">Unix Timestamp</span>
              {isUnixInvalid && (
                <span className="text-xs font-medium text-error-400">Invalid timestamp</span>
              )}
            </div>
            <input
              type="text"
              value={state.unixInput}
              onChange={(e) => handleUnixChange(e.target.value)}
              placeholder="e.g. 1700000000"
              className={clsx(
                "w-full px-4 py-3 rounded-xl border transition-all duration-200 font-mono text-lg",
                "bg-dark-900 text-dark-100 placeholder:text-dark-500",
                "focus:outline-none focus:ring-1 focus:ring-accent-500/20",
                isUnixInvalid
                  ? "border-error-500 focus:border-error-500"
                  : "border-dark-700 focus:border-accent-500"
              )}
              spellCheck={false}
            />
          </div>

          {isUnixValid && parsedUnixDate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                label="Local Time"
                value={parsedUnixDate.toLocaleString()}
                timezone={getTimezone()}
                onCopy={() => copy(parsedUnixDate.toLocaleString())}
                copied={copied}
              />
              <InfoCard
                label="UTC Time"
                value={parsedUnixDate.toUTCString()}
                onCopy={() => copy(parsedUnixDate.toUTCString())}
                copied={copied}
              />
              <InfoCard
                label="ISO 8601"
                value={parsedUnixDate.toISOString()}
                onCopy={() => copy(parsedUnixDate.toISOString())}
                copied={copied}
              />
              <InfoCard
                label="Relative"
                value={getRelativeTime(parsedUnixDate)}
                onCopy={() => copy(getRelativeTime(parsedUnixDate))}
                copied={copied}
              />
              <InfoCard
                label="Day of Week"
                value={getDayOfWeek(parsedUnixDate)}
                onCopy={() => copy(getDayOfWeek(parsedUnixDate))}
                copied={copied}
              />
              <InfoCard
                label="Milliseconds"
                value={String(parsedUnixDate.getTime())}
                onCopy={() => copy(String(parsedUnixDate.getTime()))}
                copied={copied}
              />
            </div>
          )}
        </div>
      )}

      {state.mode === "date-to-unix" && (
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-dark-300">Date & Time</span>
              {isDateInvalid && (
                <span className="text-xs font-medium text-error-400">Invalid date</span>
              )}
            </div>
            <input
              type="datetime-local"
              value={state.dateInput}
              onChange={(e) => handleDateChange(e.target.value)}
              className={clsx(
                "w-full px-4 py-3 rounded-xl border transition-all duration-200 font-mono text-lg",
                "bg-dark-900 text-dark-100",
                "focus:outline-none focus:ring-1 focus:ring-accent-500/20",
                isDateInvalid
                  ? "border-error-500 focus:border-error-500"
                  : "border-dark-700 focus:border-accent-500"
              )}
            />
          </div>

          {isDateValid && parsedDateUnix !== null && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                label="Unix Timestamp (seconds)"
                value={String(parsedDateUnix)}
                onCopy={() => copy(String(parsedDateUnix))}
                copied={copied}
              />
              <InfoCard
                label="Unix Timestamp (milliseconds)"
                value={String(parsedDateUnix * 1000)}
                onCopy={() => copy(String(parsedDateUnix * 1000))}
                copied={copied}
              />
              <InfoCard
                label="ISO 8601"
                value={new Date(parsedDateUnix * 1000).toISOString()}
                onCopy={() => copy(new Date(parsedDateUnix * 1000).toISOString())}
                copied={copied}
              />
              <InfoCard
                label="UTC Format"
                value={formatUTCDate(new Date(parsedDateUnix * 1000))}
                onCopy={() => copy(formatUTCDate(new Date(parsedDateUnix * 1000)))}
                copied={copied}
              />
              <InfoCard
                label="Relative"
                value={getRelativeTime(new Date(parsedDateUnix * 1000))}
                onCopy={() => copy(getRelativeTime(new Date(parsedDateUnix * 1000)))}
                copied={copied}
              />
              <InfoCard
                label="Day of Week"
                value={getDayOfWeek(new Date(parsedDateUnix * 1000))}
                onCopy={() => copy(getDayOfWeek(new Date(parsedDateUnix * 1000)))}
                copied={copied}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InfoCard = ({
  label,
  value,
  timezone,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  timezone?: string;
  onCopy: () => void;
  copied: boolean;
}) => {
  return (
    <div className="p-4 rounded-xl bg-dark-900 border border-dark-700 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-dark-500 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          {timezone && (
            <span className="text-xs text-accent-400 font-medium">{timezone}</span>
          )}
          <button
            onClick={onCopy}
            className="text-dark-500 hover:text-dark-200 transition-colors duration-200"
          >
            {copied ? (
              <HiCheck className="w-4 h-4 text-success-400" />
            ) : (
              <HiOutlineClipboardDocument className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      <p className="text-base font-semibold text-dark-100 font-mono break-all">{value}</p>
    </div>
  );
};
