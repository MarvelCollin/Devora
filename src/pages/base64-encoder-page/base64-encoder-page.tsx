import { useMemo } from "react";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { ConverterPanes } from "../../components/common/converter-panes/converter-panes";
import { usePersistentState } from "../../hooks/use-persistent-state";

type Mode = "encode" | "decode";

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "encode", label: "Encode" },
  { value: "decode", label: "Decode" },
];

const encodeBase64 = (text: string): string =>
  btoa(
    new TextEncoder()
      .encode(text)
      .reduce((acc, byte) => acc + String.fromCharCode(byte), "")
  );

const INVALID_BASE64 =
  "This is not valid Base64. Use only letters, digits, plus, slash and trailing equals signs.";
const BINARY_BASE64 =
  "This Base64 is valid but holds binary data, not text, so it cannot be shown here.";

const decodeBase64 = (text: string): string => {
  let binary: string;
  try {
    binary = atob(text.replace(/\s+/g, ""));
  } catch {
    throw new Error(INVALID_BASE64);
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(BINARY_BASE64);
  }
};

export const Base64EncoderPage = () => {
  const [mode, setMode] = usePersistentState<Mode>("base64:mode", "encode");
  const [input, setInput] = usePersistentState("base64:input", "");

  const { output, error } = useMemo(() => {
    if (input.trim() === "") return { output: "", error: null };
    try {
      return {
        output: mode === "encode" ? encodeBase64(input) : decodeBase64(input),
        error: null,
      };
    } catch (caught) {
      return {
        output: "",
        error:
          mode === "encode"
            ? "This text could not be encoded."
            : caught instanceof Error
              ? caught.message
              : INVALID_BASE64,
      };
    }
  }, [input, mode]);

  const changeMode = (next: Mode) => {
    setMode(next);
    setInput("");
  };

  const swap = () => {
    setMode(mode === "encode" ? "decode" : "encode");
    setInput(output);
  };

  return (
    <ToolPage
      title="Base64 Encoder"
      description="Encode text to Base64 or decode Base64 back to text. Unicode is supported."
      fill
      actions={
        <SegmentedControl
          label="Mode"
          options={MODE_OPTIONS}
          value={mode}
          onChange={changeMode}
        />
      }
    >
      <ConverterPanes
        inputLabel={mode === "encode" ? "Plain text" : "Base64"}
        outputLabel={mode === "encode" ? "Base64" : "Plain text"}
        input={input}
        onInputChange={setInput}
        inputPlaceholder={
          mode === "encode" ? "Type or paste text to encode" : "Paste Base64 to decode"
        }
        output={output}
        outputPlaceholder={mode === "encode" ? "Base64 shows up here" : "Decoded text shows up here"}
        error={error}
        onSwap={swap}
      />
    </ToolPage>
  );
};
