import { useState } from "react";
import { clsx } from "clsx";
import {
  HiOutlineFingerPrint,
  HiOutlineClipboardDocument,
  HiCheck,
  HiOutlineTrash,
} from "react-icons/hi2";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { useClipboard } from "../../hooks/use-clipboard";

type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const ALGORITHMS: HashAlgorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

const computeHash = async (
  text: string,
  algorithm: HashAlgorithm
): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const HashGeneratorPage = () => {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [uppercase, setUppercase] = useState(false);
  const { copied, copy } = useClipboard();
  const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);

  const handleInputChange = async (value: string) => {
    setInput(value);
    if (value.trim() === "") {
      setHashes({});
      return;
    }
    const results: Record<string, string> = {};
    for (const algo of ALGORITHMS) {
      results[algo] = await computeHash(value, algo);
    }
    setHashes(results);
  };

  const handleClear = () => {
    setInput("");
    setHashes({});
  };

  const handleCopy = (algo: string, value: string) => {
    const text = uppercase ? value.toUpperCase() : value;
    copy(text);
    setCopiedAlgo(algo);
    setTimeout(() => setCopiedAlgo(null), 2000);
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineFingerPrint className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              Hash Generator
            </h2>
            <p className="text-sm text-dark-400">
              Generate cryptographic hashes from text
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-accent-600 focus:ring-accent-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-dark-400">Uppercase</span>
          </label>
          <Button
            label="Clear"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            icon={HiOutlineTrash}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 flex-1 min-h-0">
        <div>
          <span className="text-sm font-medium text-dark-300 mb-3 block">Input Text</span>
          <TextArea
            value={input}
            onChange={handleInputChange}
            placeholder="Type or paste text to generate hashes..."
            rows={6}
          />
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-dark-300">Hash Output</span>
          {ALGORITHMS.map((algo) => {
            const value = hashes[algo] || "";
            const displayValue = uppercase ? value.toUpperCase() : value;
            const isCopied = copied && copiedAlgo === algo;
            return (
              <div
                key={algo}
                className="p-4 rounded-xl bg-dark-900 border border-dark-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold">
                    {algo}
                  </span>
                  <button
                    onClick={() => handleCopy(algo, value)}
                    disabled={!value}
                    className={clsx(
                      "text-dark-500 hover:text-dark-200 transition-colors duration-200",
                      !value && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    {isCopied ? (
                      <HiCheck className="w-4 h-4 text-success-400" />
                    ) : (
                      <HiOutlineClipboardDocument className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-sm text-dark-100 break-all min-h-[20px]">
                  {displayValue || <span className="text-dark-600">—</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
