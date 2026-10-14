const pad = (value: number) => String(value).padStart(2, "0");

export const formatDateTime = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

export const formatDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseDateTime = (text: string): Date | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const match = trimmed.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (match) {
    const [, y, mo, d, h = "0", mi = "0", s = "0"] = match;
    const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
    const valid =
      date.getFullYear() === Number(y) &&
      date.getMonth() === Number(mo) - 1 &&
      date.getDate() === Number(d) &&
      date.getHours() === Number(h) &&
      date.getMinutes() === Number(mi) &&
      date.getSeconds() === Number(s);
    return valid ? date : null;
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : new Date(parsed);
};

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const addMonths = (date: Date, months: number): Date => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const getTimezoneLabel = (date: Date = new Date()): string => {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
};

export const formatRelative = (date: Date, now: number = Date.now()): string => {
  const diff = now - date.getTime();
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

export interface IWallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export const parseWallTime = (text: string): IWallTime | null => {
  const match = text
    .trim()
    .match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map((part) => Number(part ?? 0));
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;
  return { year, month, day, hour, minute, second };
};
