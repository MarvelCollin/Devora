import { useSyncExternalStore } from "react";

const STORAGE_KEY = "devora-recent-tools";
const LIMIT = 6;
const listeners = new Set<() => void>();

const read = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
};

const write = (ids: string[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
};

let snapshot = read();

export const recordRecentTool = (id: string) => {
  const next = [id, ...snapshot.filter((item) => item !== id)].slice(0, LIMIT);
  if (next.join() === snapshot.join()) return;
  snapshot = next;
  write(next);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useRecentTools = (): string[] =>
  useSyncExternalStore(subscribe, () => snapshot);
