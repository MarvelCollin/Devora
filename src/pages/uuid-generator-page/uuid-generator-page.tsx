import { useMemo, useState } from "react";
import {
  HiArrowPath,
  HiOutlineArrowDownTray,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { NumberField } from "../../components/common/number-field/number-field";
import { Switch } from "../../components/common/switch/switch";
import { TextInput } from "../../components/common/text-input/text-input";
import { CodeBlock } from "../../components/common/code-block/code-block";
import { ValueList } from "../../components/common/value-list/value-list";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { formatUuid, generateUuids, inspectUuid } from "../../services/uuid-service";
import type { UuidVersion } from "../../services/uuid-service";
import { formatDateTime } from "../../utils/date-utils";

const VERSION_OPTIONS: { value: UuidVersion; label: string }[] = [
  { value: "v4", label: "v4 random" },
  { value: "v7", label: "v7 time ordered" },
];

const VERSION_NOTES: Record<UuidVersion, string> = {
  v4: "Fully random. The usual choice when order does not matter.",
  v7: "Starts with a timestamp, so new IDs sort after old ones. Good for database keys.",
};

export const UuidGeneratorPage = () => {
  const [version, setVersion] = usePersistentState<UuidVersion>("uuid:version", "v4");
  const [count, setCount] = usePersistentState("uuid:count", 5);
  const [uppercase, setUppercase] = usePersistentState("uuid:uppercase", false);
  const [hyphens, setHyphens] = usePersistentState("uuid:hyphens", true);
  const [ids, setIds] = useState(() => generateUuids(version, count));
  const [check, setCheck] = useState("");

  const regenerate = () => setIds(generateUuids(version, count));
  const changeVersion = (next: UuidVersion) => {
    setVersion(next);
    setIds(generateUuids(next, count));
  };
  const changeCount = (next: number) => {
    setCount(next);
    setIds(generateUuids(version, next));
  };

  const shown = ids.map((id) => formatUuid(id, uppercase, hyphens));
  const all = shown.join("\n");
  const info = useMemo(() => (check.trim() ? inspectUuid(check) : null), [check]);

  const download = () => {
    const url = URL.createObjectURL(new Blob([all + "\n"], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `uuids-${version}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolPage
      title="UUID Generator"
      description="Create random or time ordered UUIDs with your browser's secure random generator."
      actions={<Button label="Generate new" variant="primary" icon={HiArrowPath} onClick={regenerate} />}
    >
      <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
        <SegmentedControl label="Version" options={VERSION_OPTIONS} value={version} onChange={changeVersion} />
        <NumberField label="How many" value={count} onChange={changeCount} min={1} max={1000} />
        <div className="flex flex-col gap-2">
          <span className="flex min-h-8 items-center text-sm font-medium text-ink">Format</span>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Switch label="Uppercase" checked={uppercase} onChange={setUppercase} />
            <Switch label="Hyphens" checked={hyphens} onChange={setHyphens} />
          </div>
        </div>
      </div>
      <p className="-mt-2 text-sm text-muted">{VERSION_NOTES[version]}</p>

      {shown.length > 0 && (
        <section aria-labelledby="first-uuid-heading" className="flex flex-col gap-2 border-y border-rule py-5">
          <h2 id="first-uuid-heading" className="text-sm text-muted">
            {shown.length === 1 ? "Your UUID" : "First UUID"}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-xl font-semibold tracking-tight text-ink [overflow-wrap:anywhere] sm:text-2xl">
              {shown[0]}
            </p>
            <CopyButton value={shown[0]} variant="secondary" />
          </div>
        </section>
      )}

      {shown.length > 1 && (
        <div className="flex flex-col gap-2">
          <CodeBlock label="All UUIDs" hint={`${shown.length} generated`} code={all} />
          <Button
            label="Download as text file"
            variant="ghost"
            size="sm"
            icon={HiOutlineArrowDownTray}
            onClick={download}
            className="self-start"
          />
        </div>
      )}

      <section aria-labelledby="inspect-heading" className="flex max-w-3xl flex-col gap-3">
        <h2 id="inspect-heading" className="font-mono text-sm font-semibold text-strong">
          Check a UUID
        </h2>
        <TextInput
          label="UUID to check"
          hint="Paste any UUID to see its version and time"
          value={check}
          onChange={setCheck}
          placeholder="0192f3c4-7b1a-7cde-8f00-1a2b3c4d5e6f"
          error={info && !info.valid ? "This is not a UUID. A UUID has 32 hex digits, usually split 8-4-4-4-12." : null}
        />
        {info?.valid && (
          <>
            <p className="flex items-center gap-2 text-success">
              <HiOutlineCheckCircle className="h-5 w-5" aria-hidden="true" />
              <span className="font-medium">Valid UUID</span>
            </p>
            <ValueList
              rows={[
                { label: "Normalized", value: info.normalized },
                {
                  label: "Version",
                  value: info.special === "nil" ? "Nil UUID" : info.special === "max" ? "Max UUID" : `Version ${info.version}`,
                  copy: false,
                  mono: false,
                },
                { label: "Variant", value: info.variant, copy: false, mono: false },
                ...(info.timestamp
                  ? [
                      {
                        label: "Created at",
                        value: formatDateTime(info.timestamp),
                        note: info.timestamp.toISOString(),
                      },
                    ]
                  : []),
              ]}
            />
            {info.version !== null && ![1, 4, 6, 7].includes(info.version) && (
              <p className="flex items-center gap-2 text-sm text-warning">
                <HiOutlineExclamationTriangle className="h-4 w-4" aria-hidden="true" />
                Version {info.version} is uncommon. Check where this ID came from.
              </p>
            )}
          </>
        )}
      </section>
    </ToolPage>
  );
};
