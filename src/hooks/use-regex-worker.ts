import { useEffect, useRef, useState } from "react";
import type { IRegexRequest, IRegexResponse } from "../workers/regex-worker";

const TIMEOUT_MS = 1500;

export type RegexRunState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; response: IRegexResponse; text: string }
  | { status: "timeout" };

const createWorker = () =>
  new Worker(new URL("../workers/regex-worker.ts", import.meta.url), { type: "module" });

export const useRegexWorker = (request: Omit<IRegexRequest, "id"> | null): RegexRunState => {
  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(0);
  const [state, setState] = useState<RegexRunState>({ status: "idle" });

  useEffect(() => {
    workerRef.current = createWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const pattern = request?.pattern;
  const flags = request?.flags;
  const text = request?.text;
  const replacement = request?.replacement;

  useEffect(() => {
    if (pattern === undefined || flags === undefined || text === undefined || replacement === undefined) {
      return;
    }
    const id = ++idRef.current;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let pending = false;

    const debounce = setTimeout(() => {
      const worker = workerRef.current ?? createWorker();
      workerRef.current = worker;
      setState({ status: "running" });

      const handleMessage = (event: MessageEvent<IRegexResponse>) => {
        if (event.data.id !== id) return;
        pending = false;
        clearTimeout(timeout);
        worker.removeEventListener("message", handleMessage);
        setState({ status: "done", response: event.data, text });
      };

      worker.addEventListener("message", handleMessage);
      worker.postMessage({ id, pattern, flags, text, replacement } satisfies IRegexRequest);
      pending = true;

      timeout = setTimeout(() => {
        pending = false;
        worker.removeEventListener("message", handleMessage);
        worker.terminate();
        workerRef.current = createWorker();
        setState({ status: "timeout" });
      }, TIMEOUT_MS);
    }, 150);

    return () => {
      clearTimeout(debounce);
      clearTimeout(timeout);
      if (pending) {
        workerRef.current?.terminate();
        workerRef.current = null;
      }
    };
  }, [pattern, flags, text, replacement]);

  return request ? state : { status: "idle" };
};
