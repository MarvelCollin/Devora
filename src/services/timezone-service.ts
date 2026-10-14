import type { IWallTime } from "../utils/date-utils";

export interface IZoneParts extends IWallTime {
  weekday: string;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

const partsFormatter = (timeZone: string) => {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      weekday: "short",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
};

export const getLocalZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const isValidZone = (timeZone: string): boolean => {
  try {
    partsFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
};

export const getAllZones = (): string[] => {
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return zones.includes("UTC") ? zones : ["UTC", ...zones];
};

export const zoneParts = (instant: number, timeZone: string): IZoneParts => {
  const parts = Object.fromEntries(
    partsFormatter(timeZone)
      .formatToParts(new Date(instant))
      .map((part) => [part.type, part.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: parts.weekday,
  };
};

const offsetAt = (instant: number, timeZone: string): number => {
  const p = zoneParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
};

export const wallTimeToInstant = (wall: IWallTime, timeZone: string): number => {
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  const first = offsetAt(guess, timeZone);
  const instant = guess - first;
  const second = offsetAt(instant, timeZone);
  return second === first ? instant : guess - second;
};

export const offsetLabel = (instant: number, timeZone: string): string => {
  const minutes = Math.round(offsetAt(instant, timeZone) / 60000);
  if (minutes === 0) return "UTC";
  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  return `UTC${sign}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""}`;
};

export const zoneCity = (timeZone: string): string => {
  if (timeZone === "UTC") return "UTC";
  const parts = timeZone.split("/");
  return parts[parts.length - 1].replace(/_/g, " ");
};

export const zoneRegion = (timeZone: string): string => {
  if (timeZone === "UTC") return "Coordinated Universal Time";
  const parts = timeZone.split("/");
  return parts.slice(0, -1).join(" / ").replace(/_/g, " ");
};

export const dayDifference = (a: IWallTime, b: IWallTime): number =>
  Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86400000
  );

export const partOfDay = (hour: number): "night" | "morning" | "work" | "evening" => {
  if (hour < 6 || hour >= 22) return "night";
  if (hour < 9) return "morning";
  if (hour < 18) return "work";
  return "evening";
};
