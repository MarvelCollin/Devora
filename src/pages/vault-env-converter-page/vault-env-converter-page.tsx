import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  HiArrowsRightLeft,
  HiOutlineClipboardDocument,
  HiCheck,
  HiOutlineTrash,
  HiOutlineKey,
  HiOutlineDocument,
} from "react-icons/hi2";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { useClipboard } from "../../hooks/use-clipboard";
import {
  convertVaultToEnv,
  convertEnvToVault,
} from "../../services/vault-env-converter-service";
import type { IVaultEnvConverterState } from "../../interfaces/IVaultEnv";

export const VaultEnvConverterPage = () => {
  const [state, setState] = useState<IVaultEnvConverterState>({
    input: "",
    output: "",
    mode: "vault-to-env",
    error: null,
  });

  const { copied, copy } = useClipboard();

  useEffect(() => {
    if (state.input.trim() === "") {
      setState((prev) => ({ ...prev, output: "", error: null }));
      return;
    }

    const result =
      state.mode === "vault-to-env"
        ? convertVaultToEnv(state.input)
        : convertEnvToVault(state.input);

    if (result.success) {
      setState((prev) => ({ ...prev, output: result.data, error: null }));
    } else {
      setState((prev) => ({
        ...prev,
        output: "",
        error: result.error ?? null,
      }));
    }
  }, [state.input, state.mode]);

  const handleInputChange = (value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  };

  const handleModeChange = (mode: "vault-to-env" | "env-to-vault") => {
    setState({ input: "", output: "", mode, error: null });
  };

  const handleClear = () => {
    setState((prev) => ({ ...prev, input: "", output: "", error: null }));
  };

  const handleCopy = () => {
    copy(state.output);
  };

  const handleSwap = () => {
    const newMode =
      state.mode === "vault-to-env" ? "env-to-vault" : "vault-to-env";
    setState({
      input: state.output,
      output: "",
      mode: newMode,
      error: null,
    });
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineKey className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              Vault / ENV Converter
            </h2>
            <p className="text-sm text-dark-400">
              Convert between JSON and environment variables
            </p>
          </div>
        </div>
        <div className="flex items-center p-1 rounded-lg bg-dark-800 border border-dark-700">
          <button
            onClick={() => handleModeChange("vault-to-env")}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              state.mode === "vault-to-env"
                ? "bg-accent-600 text-white shadow-lg shadow-accent-600/20"
                : "text-dark-400 hover:text-dark-200"
            )}
          >
            <HiOutlineDocument className="w-4 h-4" />
            JSON to ENV
          </button>
          <button
            onClick={() => handleModeChange("env-to-vault")}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              state.mode === "env-to-vault"
                ? "bg-accent-600 text-white shadow-lg shadow-accent-600/20"
                : "text-dark-400 hover:text-dark-200"
            )}
          >
            <HiOutlineKey className="w-4 h-4" />
            ENV to JSON
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-dark-300">
              {state.mode === "vault-to-env" ? "Input JSON" : "Input ENV"}
            </span>
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
            placeholder={
              state.mode === "vault-to-env"
                ? '{\n  "database": {\n    "host": "localhost",\n    "port": 5432\n  }\n}'
                : "DATABASE_HOST=localhost\nDATABASE_PORT=5432"
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
              {state.mode === "vault-to-env" ? "Output ENV" : "Output JSON"}
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
            placeholder="Converted output will appear here..."
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
