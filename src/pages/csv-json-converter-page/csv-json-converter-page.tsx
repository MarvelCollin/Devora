import { useDeferredValue, useMemo } from "react";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { ConverterPanes } from "../../components/common/converter-panes/converter-panes";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { Switch } from "../../components/common/switch/switch";
import { Button } from "../../components/common/button/button";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { csvToJson, jsonToCsv } from "../../services/csv-service";
import type { Delimiter } from "../../services/csv-service";

type Direction = "csv-to-json" | "json-to-csv";

const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "csv-to-json", label: "CSV to JSON" },
  { value: "json-to-csv", label: "JSON to CSV" },
];

const DELIMITERS: { value: Delimiter; label: string }[] = [
  { value: "auto", label: "Detect" },
  { value: ",", label: "Comma" },
  { value: ";", label: "Semicolon" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe" },
];

const DELIMITER_NAMES: Record<string, string> = { ",": "comma", ";": "semicolon", "\t": "tab", "|": "pipe" };

const CSV_PLACEHOLDER = `name,email,age,active
"Lovelace, Ada",ada@example.com,36,true
Grace Hopper,grace@example.com,85,false`;

const JSON_PLACEHOLDER = `[
  { "name": "Ada", "team": { "name": "Engines" }, "age": 36 },
  { "name": "Grace", "team": { "name": "Compilers" }, "age": 85 }
]`;

export const CsvJsonConverterPage = () => {
  const [direction, setDirection] = usePersistentState<Direction>("csv:direction", "csv-to-json");
  const [input, setInput] = usePersistentState("csv:input", "");
  const [delimiter, setDelimiter] = usePersistentState<Delimiter>("csv:delimiter", "auto");
  const [header, setHeader] = usePersistentState("csv:header", true);
  const [typed, setTyped] = usePersistentState("csv:typed", true);
  const [flattenNested, setFlattenNested] = usePersistentState("csv:flatten", true);
  const deferredInput = useDeferredValue(input);

  const result = useMemo(() => {
    if (!deferredInput.trim()) return null;
    try {
      if (direction === "csv-to-json") {
        const converted = csvToJson(deferredInput, { delimiter, header, typed });
        return {
          output: converted.json,
          rows: converted.rows,
          columns: converted.columns,
          detected: delimiter === "auto" ? converted.delimiter : null,
          error: null,
        };
      }
      const outDelimiter = delimiter === "auto" ? "," : delimiter;
      const converted = jsonToCsv(deferredInput, outDelimiter, flattenNested);
      return { output: converted.csv, rows: converted.rows, columns: converted.columns, detected: null, error: null };
    } catch (error) {
      return {
        output: "",
        rows: 0,
        columns: [] as string[],
        detected: null,
        error: error instanceof Error ? error.message : "This input could not be converted.",
      };
    }
  }, [deferredInput, direction, delimiter, header, typed, flattenNested]);

  const toCsv = direction === "json-to-csv";

  const changeDirection = (next: Direction) => {
    setDirection(next);
    setInput("");
  };

  const swap = () => {
    setDirection(toCsv ? "csv-to-json" : "json-to-csv");
    setInput(result?.output ?? "");
  };

  const download = () => {
    if (!result?.output) return;
    const type = toCsv ? "text/csv" : "application/json";
    const url = URL.createObjectURL(new Blob([result.output], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = toCsv ? "data.csv" : "data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const summary =
    result && !result.error && result.output ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{result.rows.toLocaleString()}</span>{" "}
          {result.rows === 1 ? "row" : "rows"}
          {result.columns.length > 0 && (
            <>
              {" "}
              and <span className="font-semibold text-ink">{result.columns.length}</span> columns:{" "}
              <span className="font-mono">{result.columns.slice(0, 6).join(", ")}</span>
              {result.columns.length > 6 && ` and ${result.columns.length - 6} more`}
            </>
          )}
          {result.detected && `. Detected ${DELIMITER_NAMES[result.detected]} separated values`}.
        </p>
        <Button
          label={toCsv ? "Download CSV" : "Download JSON"}
          variant="ghost"
          size="sm"
          icon={HiOutlineArrowDownTray}
          onClick={download}
        />
      </div>
    ) : null;

  return (
    <ToolPage
      title="CSV / JSON Converter"
      description="Turn spreadsheet rows into JSON, or a JSON array into CSV you can open in Excel or Sheets."
      fill
      actions={
        <SegmentedControl label="Direction" options={DIRECTIONS} value={direction} onChange={changeDirection} />
      }
    >
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <SegmentedControl
          label={toCsv ? "Separator to write" : "Separator"}
          options={toCsv ? DELIMITERS.filter((d) => d.value !== "auto") : DELIMITERS}
          value={toCsv && delimiter === "auto" ? "," : delimiter}
          onChange={setDelimiter}
        />
        <div className="flex flex-wrap gap-x-6 gap-y-2 pb-1.5">
          {toCsv ? (
            <Switch label="Flatten nested objects as a.b columns" checked={flattenNested} onChange={setFlattenNested} />
          ) : (
            <>
              <Switch label="First row is a header" checked={header} onChange={setHeader} />
              <Switch label="Turn numbers and true or false into values" checked={typed} onChange={setTyped} />
            </>
          )}
        </div>
      </div>

      <ConverterPanes
        inputLabel={toCsv ? "JSON" : "CSV"}
        outputLabel={toCsv ? "CSV" : "JSON"}
        input={input}
        onInputChange={setInput}
        inputPlaceholder={toCsv ? JSON_PLACEHOLDER : CSV_PLACEHOLDER}
        output={result?.output ?? ""}
        outputPlaceholder="The converted result shows up here"
        error={result?.error}
        onSwap={swap}
        swapLabel="Swap direction"
        outputFooter={summary}
      />
    </ToolPage>
  );
};
