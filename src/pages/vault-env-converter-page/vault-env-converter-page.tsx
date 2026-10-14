import { useMemo } from "react";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { ConverterPanes } from "../../components/common/converter-panes/converter-panes";
import {
  convertVaultToEnv,
  convertEnvToVault,
} from "../../services/vault-env-converter-service";
import { usePersistentState } from "../../hooks/use-persistent-state";

type Mode = "vault-to-env" | "env-to-vault";

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "vault-to-env", label: "JSON to ENV" },
  { value: "env-to-vault", label: "ENV to JSON" },
];

const JSON_PLACEHOLDER = `{
  "database": {
    "host": "localhost",
    "port": 5432
  }
}`;

const ENV_PLACEHOLDER = `DATABASE__HOST=localhost
DATABASE__PORT=5432`;

export const VaultEnvConverterPage = () => {
  const [mode, setMode] = usePersistentState<Mode>("vault-env:mode", "vault-to-env");
  const [input, setInput] = usePersistentState("vault-env:input", "");

  const result = useMemo(() => {
    if (input.trim() === "") return null;
    return mode === "vault-to-env" ? convertVaultToEnv(input) : convertEnvToVault(input);
  }, [input, mode]);

  const output = result?.success ? result.data : "";
  const error =
    result && !result.success
      ? mode === "vault-to-env"
        ? "The input is not valid JSON. Paste a Vault secret as a JSON object."
        : "The input could not be read. Use one KEY=value pair per line."
      : null;

  const changeMode = (next: Mode) => {
    setMode(next);
    setInput("");
  };

  const swap = () => {
    setMode(mode === "vault-to-env" ? "env-to-vault" : "vault-to-env");
    setInput(output);
  };

  const isJsonInput = mode === "vault-to-env";

  return (
    <ToolPage
      title="Vault / ENV Converter"
      description="Turn a Vault JSON secret into ENV lines, or ENV lines into JSON. Nested keys join with a double underscore."
      fill
      actions={
        <SegmentedControl
          label="Direction"
          options={MODE_OPTIONS}
          value={mode}
          onChange={changeMode}
        />
      }
    >
      <ConverterPanes
        inputLabel={isJsonInput ? "Vault JSON" : "ENV variables"}
        outputLabel={isJsonInput ? "ENV variables" : "Vault JSON"}
        input={input}
        onInputChange={setInput}
        inputPlaceholder={isJsonInput ? JSON_PLACEHOLDER : ENV_PLACEHOLDER}
        output={output}
        outputPlaceholder="Converted output shows up here"
        error={error}
        onSwap={swap}
        swapLabel="Swap direction"
      />
    </ToolPage>
  );
};
