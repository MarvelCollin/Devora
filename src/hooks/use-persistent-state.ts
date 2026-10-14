import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

const PREFIX = "devora:";

const load = <T,>(key: string, initial: T): T => {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    return raw === null ? initial : (JSON.parse(raw) as T);
  } catch {
    return initial;
  }
};

const save = (key: string, value: unknown): boolean => {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const usePersistentState = <T,>(
  key: string,
  initial: T
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => load(key, initial));
  const latest = useRef(value);

  useEffect(() => {
    latest.current = value;
    const timer = setTimeout(() => save(key, value), 250);
    return () => clearTimeout(timer);
  }, [key, value]);

  useEffect(() => {
    const ref = latest;
    return () => {
      save(key, ref.current);
    };
  }, [key]);

  return [value, setValue];
};
