import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  HiOutlineCodeBracket,
  HiOutlineClipboardDocument,
  HiCheck,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiMinus,
  HiCheckCircle,
  HiXCircle,
} from "react-icons/hi2";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { useClipboard } from "../../hooks/use-clipboard";
import {
  formatJson,
  minifyJson,
  validateJson,
} from "../../services/json-formatter-service";
import type { IJsonFormatterState } from "../../interfaces/IVaultEnv";

export const JsonFormatterPage = () => {
  const [state, setState] = useState<IJsonFormatterState>({
    input: "",
    output: "",
    error: null,
    indentSize: 2,
  });

  const { copied, copy } = useClipboard();

  useEffect(() => {
    if (state.input.trim() === "") {
      setState((prev) => ({ ...prev, output: "", error: null }));
      return;
    }

    const result = formatJson(state.input, state.indentSize);
    if (result.success) {
      setState((prev) => ({ ...prev, output: result.data, error: null }));
    } else {
      setState((prev) => ({
        ...prev,
        output: "",
        error: result.error ?? null,
      }));
    }
  }, [state.input, state.indentSize]);

  const handleInputChange = (value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  };

  const handleIndentChange = (size: number) => {
    setState((prev) => ({ ...prev, indentSize: size }));
  };

  const handleClear = () => {
    setState((prev) => ({ ...prev, input: "", output: "", error: null }));
  };

  const handleCopy = () => {
    copy(state.output);
  };

  const handleMinify = () => {
    if (state.input.trim() === "") return;
    const result = minifyJson(state.input);
    if (result.success) {
      setState((prev) => ({ ...prev, output: result.data, error: null }));
    }
  };

  const handleFormat = () => {
    if (state.input.trim() === "") return;
    const result = formatJson(state.input, state.indentSize);
    if (result.success) {
      setState((prev) => ({ ...prev, output: result.data, error: null }));
    }
  };

  const validation = state.input.trim()
    ? validateJson(state.input)
    : { valid: true };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineCodeBracket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              JSON Formatter
            </h2>
            <p className="text-sm text-dark-400">
              Format, validate, and beautify JSON data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-400">Indent:</span>
            <select
              value={state.indentSize}
              onChange={(e) => handleIndentChange(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-dark-200 text-sm focus:outline-none focus:border-accent-500 cursor-pointer"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>8 spaces</option>
            </select>
          </div>
          <div className="flex items-center gap-2 p-1 rounded-lg bg-dark-800 border border-dark-700">
            <Button
              label="Format"
              variant="primary"
              size="sm"
              onClick={handleFormat}
              disabled={!state.input}
              icon={HiOutlineSparkles}
            />
            <Button
              label="Minify"
              variant="ghost"
              size="sm"
              onClick={handleMinify}
              disabled={!state.input}
              icon={HiMinus}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-dark-300">
                Input JSON
              </span>
              {state.input && (
                <div
                  className={clsx(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    validation.valid
                      ? "bg-success-500/10 text-success-400"
                      : "bg-error-500/10 text-error-400"
                  )}
                >
                  {validation.valid ? (
                    <HiCheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <HiXCircle className="w-3.5 h-3.5" />
                  )}
                  {validation.valid ? "Valid" : "Invalid"}
                </div>
              )}
            </div>
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              icon={HiOutlineTrash}
            />
          </div>
          <TextArea
            value={state.input}
            onChange={handleInputChange}
            placeholder='{"name": "example", "value": 123}'
            rows={20}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-dark-300">
              Formatted Output
            </span>
            <Button
              label={copied ? "Copied" : "Copy"}
              variant={copied ? "primary" : "ghost"}
              size="sm"
              onClick={handleCopy}
              disabled={!state.output}
              icon={copied ? HiCheck : HiOutlineClipboardDocument}
            />
          </div>
          <TextArea
            value={state.output}
            onChange={() => {}}
            placeholder="Formatted JSON will appear here..."
            rows={20}
            readOnly
          />
          {state.error && (
            <div className="mt-3 px-4 py-3 rounded-lg bg-error-500/10 border border-error-500/20 text-error-400 text-sm">
              {state.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
