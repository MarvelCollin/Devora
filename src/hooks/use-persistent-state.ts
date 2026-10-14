import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

const PREFIX = "devora:";

type StorageKind = "session" | "local";

const storageFor = (kind: StorageKind): Storage => (kind === "local" ? localStorage : sessionStorage);

const load = <T,>(key: string, initial: T, kind: StorageKind): T => {
  try {
    const raw = storageFor(kind).getItem(PREFIX + key);
    return raw === null ? initial : (JSON.parse(raw) as T);
  } catch {
    return initial;
  }
};

const save = (key: string, value: unknown, kind: StorageKind): boolean => {
  try {
    storageFor(kind).setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const usePersistentState = <T,>(
  key: string,
  initial: T,
  kind: StorageKind = "session"
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => load(key, initial, kind));
  const latest = useRef(value);

  useEffect(() => {
    latest.current = value;
    const timer = setTimeout(() => save(key, value, kind), 250);
    return () => clearTimeout(timer);
  }, [key, value, kind]);

  useEffect(() => {
    const ref = latest;
    return () => {
      save(key, ref.current, kind);
    };
  }, [key, kind]);

  return [value, setValue];
};
