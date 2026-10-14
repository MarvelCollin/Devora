import { useMemo, useState } from "react";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { ConverterPanes } from "../../components/common/converter-panes/converter-panes";
import { CopyButton } from "../../components/common/copy-button/copy-button";

type Mode = "encode" | "decode";

interface IQueryParam {
  key: string;
  value: string;
}

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "encode", label: "Encode" },
  { value: "decode", label: "Decode" },
];

const parseQueryString = (url: string): IQueryParam[] => {
  let queryString = url;
  const questionIndex = url.indexOf("?");
  if (questionIndex !== -1) {
    queryString = url.substring(questionIndex + 1);
  }
  const hashIndex = queryString.indexOf("#");
  if (hashIndex !== -1) {
    queryString = queryString.substring(0, hashIndex);
  }
  if (!queryString.includes("=")) return [];
  return queryString
    .split("&")
    .filter(Boolean)
    .map((pair) => {
      const eqIndex = pair.indexOf("=");
      if (eqIndex === -1) return { key: decodeURIComponent(pair), value: "" };
      return {
        key: decodeURIComponent(pair.substring(0, eqIndex)),
        value: decodeURIComponent(pair.substring(eqIndex + 1).replace(/\+/g, " ")),
      };
    });
};

export const UrlEncoderPage = () => {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const { output, error, params } = useMemo(() => {
    const empty = { output: "", error: null, params: [] as IQueryParam[] };
    if (input.trim() === "") return empty;
    try {
      if (mode === "encode") {
        return { ...empty, output: encodeURIComponent(input) };
      }
      const trimmed = input.trim();
      return {
        output: decodeURIComponent(trimmed),
        error: null,
        params: parseQueryString(trimmed),
      };
    } catch {
      return {
        ...empty,
        error:
          mode === "encode"
            ? "This text could not be encoded."
            : "This text has a broken percent sequence. Each percent sign must be followed by two hex digits, like %20.",
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

  const paramList =
    params.length > 0 ? (
      <section aria-labelledby="query-params-heading" className="flex flex-col gap-2">
        <h2 id="query-params-heading" className="text-sm font-medium text-ink">
          Query parameters <span className="font-normal text-muted">({params.length})</span>
        </h2>
        <dl className="max-h-64 overflow-y-auto rounded-lg border border-rule bg-raised">
          {params.map((param, index) => (
            <div
              key={`${param.key}-${index}`}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-3 border-b border-rule px-4 py-2 last:border-b-0"
            >
              <dt className="font-mono text-sm font-medium break-all text-strong">
                {param.key}
              </dt>
              <dd className="font-mono text-sm break-all text-ink">
                {param.value || <span className="text-muted">(empty)</span>}
              </dd>
              <dd>
                <CopyButton value={param.value} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
    ) : null;

  return (
    <ToolPage
      title="URL Encoder"
      description="Encode text for use in a URL, or decode a URL and read its query parameters."
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
        inputLabel={mode === "encode" ? "Plain text" : "Encoded URL"}
        outputLabel={mode === "encode" ? "Encoded text" : "Decoded URL"}
        input={input}
        onInputChange={setInput}
        inputPlaceholder={
          mode === "encode"
            ? "Type text to encode, like hello world & more"
            : "Paste an encoded URL, like https://example.com/?q=hello%20world"
        }
        output={output}
        outputPlaceholder="The result shows up here"
        error={error}
        onSwap={swap}
        outputFooter={paramList}
      />
    </ToolPage>
  );
};
