import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  HiOutlineDocumentDuplicate,
  HiOutlineClipboardDocument,
  HiCheck,
  HiOutlineTrash,
  HiArrowsRightLeft,
} from "react-icons/hi2";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { useClipboard } from "../../hooks/use-clipboard";

type Mode = "encode" | "decode";

export const Base64EncoderPage = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [error, setError] = useState<string | null>(null);
  const { copied, copy } = useClipboard();

  useEffect(() => {
    if (input.trim() === "") {
      setOutput("");
      setError(null);
      return;
    }
    if (mode === "encode") {
      try {
        const encoded = btoa(
          new TextEncoder()
            .encode(input)
            .reduce((acc, byte) => acc + String.fromCharCode(byte), "")
        );
        setOutput(encoded);
        setError(null);
      } catch {
        setOutput("");
        setError("Failed to encode input");
      }
    } else {
      try {
        const binaryString = atob(input.trim());
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decoded = new TextDecoder().decode(bytes);
        setOutput(decoded);
        setError(null);
      } catch {
        setOutput("");
        setError("Invalid Base64 string");
      }
    }
  }, [input, mode]);

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
  };

  const handleSwap = () => {
    const newMode = mode === "encode" ? "decode" : "encode";
    setInput(output);
    setOutput("");
    setError(null);
    setMode(newMode);
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineDocumentDuplicate className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              Base64 Encoder / Decoder
            </h2>
            <p className="text-sm text-dark-400">
              Encode text to Base64 or decode Base64 to text
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center p-1 rounded-lg bg-dark-800 border border-dark-700">
            <button
              onClick={() => { setMode("encode"); setInput(""); setOutput(""); setError(null); }}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                mode === "encode"
                  ? "bg-accent-600 text-white shadow-lg shadow-accent-600/20"
                  : "text-dark-400 hover:text-dark-200"
              )}
            >
              Encode
            </button>
            <button
              onClick={() => { setMode("decode"); setInput(""); setOutput(""); setError(null); }}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                mode === "decode"
                  ? "bg-accent-600 text-white shadow-lg shadow-accent-600/20"
                  : "text-dark-400 hover:text-dark-200"
              )}
            >
              Decode
            </button>
          </div>
          <Button
            label="Clear"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            icon={HiOutlineTrash}
          />
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-dark-300">
              {mode === "encode" ? "Plain Text" : "Base64 Input"}
            </span>
          </div>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={
              mode === "encode"
                ? "Type or paste text to encode..."
                : "Paste Base64 string to decode..."
            }
            rows={20}
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <button
            onClick={handleSwap}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-800 border border-dark-700 text-dark-400 transition-all duration-200 hover:bg-dark-700 hover:text-accent-400 hover:border-accent-500/50"
          >
            <HiArrowsRightLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-dark-300">
              {mode === "encode" ? "Base64 Output" : "Decoded Text"}
            </span>
            <Button
              label={copied ? "Copied" : "Copy"}
              variant={copied ? "primary" : "ghost"}
              size="sm"
              onClick={() => copy(output)}
              disabled={!output}
              icon={copied ? HiCheck : HiOutlineClipboardDocument}
            />
          </div>
          <TextArea
            value={output}
            onChange={() => {}}
            placeholder={
              mode === "encode"
                ? "Base64 encoded result..."
                : "Decoded text will appear here..."
            }
            rows={20}
            readOnly
          />
          {error && (
            <div className="mt-3 px-4 py-3 rounded-lg bg-error-500/10 border border-error-500/20 text-error-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
