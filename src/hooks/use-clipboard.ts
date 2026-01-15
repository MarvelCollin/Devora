import { useState, useCallback } from "react";

interface IUseClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<void>;
  paste: () => Promise<string>;
}

export const useClipboard = (): IUseClipboardReturn => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  const paste = useCallback(async (): Promise<string> => {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return "";
    }
  }, []);

  return { copied, copy, paste };
};
