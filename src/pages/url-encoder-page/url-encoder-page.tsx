import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  HiOutlineLink,
  HiOutlineClipboardDocument,
  HiCheck,
  HiOutlineTrash,
  HiArrowsRightLeft,
} from "react-icons/hi2";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { useClipboard } from "../../hooks/use-clipboard";

type Mode = "encode" | "decode";

interface IQueryParam {
  key: string;
  value: string;
}

const parseQueryString = (url: string): IQueryParam[] => {
  const params: IQueryParam[] = [];
  let queryString = url;
  const questionIndex = url.indexOf("?");
  if (questionIndex !== -1) {
    queryString = url.substring(questionIndex + 1);
  }
  const hashIndex = queryString.indexOf("#");
  if (hashIndex !== -1) {
    queryString = queryString.substring(0, hashIndex);
  }
  if (!queryString.includes("=")) return params;
  const pairs = queryString.split("&");
  for (const pair of pairs) {
    if (!pair) continue;
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) {
      params.push({ key: decodeURIComponent(pair), value: "" });
    } else {
      const key = decodeURIComponent(pair.substring(0, eqIndex));
      const value = decodeURIComponent(pair.substring(eqIndex + 1));
      params.push({ key, value });
    }
  }
  return params;
};

export const UrlEncoderPage = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<IQueryParam[]>([]);
  const { copied, copy } = useClipboard();

  useEffect(() => {
    if (input.trim() === "") {
      setOutput("");
      setError(null);
      setQueryParams([]);
      return;
    }
    if (mode === "encode") {
      try {
        setOutput(encodeURIComponent(input));
        setError(null);
        setQueryParams([]);
      } catch {
        setOutput("");
        setError("Failed to encode input");
        setQueryParams([]);
      }
    } else {
      try {
        setOutput(decodeURIComponent(input.trim()));
        setError(null);
        const params = parseQueryString(input.trim());
        setQueryParams(params);
      } catch {
        setOutput("");
        setError("Invalid URL-encoded string");
        setQueryParams([]);
      }
    }
  }, [input, mode]);

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setQueryParams([]);
  };

  const handleSwap = () => {
    const newMode = mode === "encode" ? "decode" : "encode";
    setInput(output);
    setOutput("");
    setError(null);
    setQueryParams([]);
    setMode(newMode);
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineLink className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              URL Encoder / Decoder
            </h2>
            <p className="text-sm text-dark-400">
              Encode and decode URL components
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center p-1 rounded-lg bg-dark-800 border border-dark-700">
            <button
              onClick={() => { setMode("encode"); setInput(""); setOutput(""); setError(null); setQueryParams([]); }}
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
              onClick={() => { setMode("decode"); setInput(""); setOutput(""); setError(null); setQueryParams([]); }}
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
              {mode === "encode" ? "Plain Text" : "Encoded URL"}
            </span>
          </div>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={
              mode === "encode"
                ? "Type text to URL-encode..."
                : "Paste URL-encoded string to decode..."
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
              {mode === "encode" ? "Encoded Output" : "Decoded Text"}
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
                ? "URL-encoded result..."
                : "Decoded text will appear here..."
            }
            rows={queryParams.length > 0 ? 10 : 20}
            readOnly
          />
          {error && (
            <div className="mt-3 px-4 py-3 rounded-lg bg-error-500/10 border border-error-500/20 text-error-400 text-sm">
              {error}
            </div>
          )}

          {queryParams.length > 0 && (
            <div className="mt-4">
              <span className="text-sm font-medium text-dark-300 mb-3 block">
                Query Parameters
              </span>
              <div className="rounded-xl border border-dark-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-dark-800">
                      <th className="text-left px-4 py-2.5 text-xs text-dark-500 uppercase tracking-wider font-semibold">Key</th>
                      <th className="text-left px-4 py-2.5 text-xs text-dark-500 uppercase tracking-wider font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queryParams.map((param, i) => (
                      <tr key={i} className="border-t border-dark-700">
                        <td className="px-4 py-2.5 font-mono text-accent-400">{param.key}</td>
                        <td className="px-4 py-2.5 font-mono text-dark-200">{param.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
