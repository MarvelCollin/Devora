import { useMemo, useState } from "react";
import {
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { Notice } from "../../components/common/notice/notice";
import {
  formatJson,
  minifyJson,
  validateJson,
} from "../../services/json-formatter-service";

type OutputMode = "pretty" | "minified";

const MODE_OPTIONS: { value: OutputMode; label: string }[] = [
  { value: "pretty", label: "Pretty" },
  { value: "minified", label: "Minified" },
];

const INDENT_OPTIONS = [
  { value: 2, label: "2 spaces" },
  { value: 4, label: "4 spaces" },
  { value: 8, label: "8 spaces" },
];

const parseErrorDetail = (text: string): string | null => {
  try {
    JSON.parse(text);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : null;
  }
};

export const JsonFormatterPage = () => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<OutputMode>("pretty");
  const [indent, setIndent] = useState(2);

  const hasInput = input.trim() !== "";

  const validation = useMemo(
    () => (hasInput ? validateJson(input) : null),
    [input, hasInput]
  );

  const output = useMemo(() => {
    if (!hasInput || !validation?.valid) return "";
    const result = mode === "pretty" ? formatJson(input, indent) : minifyJson(input);
    return result.success ? result.data : "";
  }, [input, hasInput, validation, mode, indent]);

  const errorDetail = useMemo(
    () => (validation?.valid === false ? parseErrorDetail(input.trim()) : null),
    [validation, input]
  );

  const lineCount = output ? output.split("\n").length : 0;

  return (
    <ToolPage
      title="JSON Formatter"
      description="Paste JSON to check it and get a clean, readable version."
      fill
      actions={
        <>
          <SegmentedControl
            label="Output"
            options={MODE_OPTIONS}
            value={mode}
            onChange={setMode}
          />
          <SegmentedControl
            label="Indent"
            options={INDENT_OPTIONS}
            value={indent}
            onChange={setIndent}
            disabled={mode === "minified"}
          />
        </>
      }
    >
      <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <TextArea
          label="Input"
          value={input}
          onChange={setInput}
          placeholder={'{"name": "devora", "tools": 13}'}
          invalid={validation?.valid === false}
          hint={
            validation &&
            (validation.valid ? (
              <span className="inline-flex items-center gap-1 font-medium text-success">
                <HiOutlineCheckCircle className="h-4 w-4" aria-hidden="true" />
                Valid JSON
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-danger">
                <HiOutlineExclamationTriangle className="h-4 w-4" aria-hidden="true" />
                Invalid JSON
              </span>
            ))
          }
          actions={
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onClick={() => setInput("")}
              disabled={!input}
              icon={HiOutlineTrash}
            />
          }
        />
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <TextArea
            label="Output"
            value={output}
            readOnly
            placeholder="Formatted JSON shows up here"
            hint={lineCount > 0 ? `${lineCount} ${lineCount === 1 ? "line" : "lines"}` : undefined}
            actions={<CopyButton value={output} />}
            className="flex-1"
          />
          {validation?.valid === false && (
            <Notice tone="error">
              <p>The input is not valid JSON. Check for missing quotes, commas or closing brackets.</p>
              {errorDetail && <p className="mt-1 font-mono text-xs">{errorDetail}</p>}
            </Notice>
          )}
        </div>
      </div>
    </ToolPage>
  );
};
