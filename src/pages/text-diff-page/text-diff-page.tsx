import { useDeferredValue, useMemo } from "react";
import { clsx } from "clsx";
import { diffChars, diffLines, diffWordsWithSpace, diffWords, createTwoFilesPatch } from "diff";
import type { ChangeObject } from "diff";
import { HiArrowsRightLeft, HiOutlineTrash } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { Switch } from "../../components/common/switch/switch";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";
import { Notice } from "../../components/common/notice/notice";
import { usePersistentState } from "../../hooks/use-persistent-state";

type Mode = "lines" | "words" | "chars";

interface IRow {
  type: "same" | "added" | "removed" | "fold";
  text: string;
  oldNo?: number;
  newNo?: number;
}

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "lines", label: "Lines" },
  { value: "words", label: "Words" },
  { value: "chars", label: "Characters" },
];

const CONTEXT = 3;
const DIFF_TIMEOUT = 2000;

const toRows = (changes: ChangeObject<string>[]): IRow[] => {
  const rows: IRow[] = [];
  let oldNo = 0;
  let newNo = 0;
  for (const change of changes) {
    const lines = change.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    for (const text of lines) {
      if (change.added) rows.push({ type: "added", text, newNo: ++newNo });
      else if (change.removed) rows.push({ type: "removed", text, oldNo: ++oldNo });
      else rows.push({ type: "same", text, oldNo: ++oldNo, newNo: ++newNo });
    }
  }
  return rows;
};

const foldRows = (rows: IRow[]): IRow[] => {
  const result: IRow[] = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i].type !== "same") {
      result.push(rows[i]);
      i += 1;
      continue;
    }
    let end = i;
    while (end < rows.length && rows[end].type === "same") end += 1;
    const run = rows.slice(i, end);
    const keepStart = i === 0 ? 0 : CONTEXT;
    const keepEnd = end === rows.length ? 0 : CONTEXT;
    if (run.length > keepStart + keepEnd + 1) {
      result.push(...run.slice(0, keepStart));
      const hidden = run.length - keepStart - keepEnd;
      result.push({ type: "fold", text: `${hidden} unchanged ${hidden === 1 ? "line" : "lines"}` });
      result.push(...run.slice(run.length - keepEnd));
    } else {
      result.push(...run);
    }
    i = end;
  }
  return result;
};

const ROW_STYLES = {
  same: "text-ink",
  added: "bg-success-tint text-ink",
  removed: "bg-danger-tint text-ink",
  fold: "bg-surface text-muted",
};

const MARKERS = { same: " ", added: "+", removed: "-", fold: "" };
const SR_PREFIX = { same: "", added: "Added: ", removed: "Removed: ", fold: "" };

export const TextDiffPage = () => {
  const [original, setOriginal] = usePersistentState("diff:original", "");
  const [changed, setChanged] = usePersistentState("diff:changed", "");
  const [mode, setMode] = usePersistentState<Mode>("diff:mode", "lines");
  const [ignoreSpace, setIgnoreSpace] = usePersistentState("diff:ignore-space", false);
  const [ignoreCase, setIgnoreCase] = usePersistentState("diff:ignore-case", false);
  const [hideSame, setHideSame] = usePersistentState("diff:hide-same", true);

  const deferredOriginal = useDeferredValue(original);
  const deferredChanged = useDeferredValue(changed);
  const hasInput = deferredOriginal !== "" || deferredChanged !== "";

  const changes = useMemo(() => {
    if (!hasInput) return null;
    if (mode === "lines") {
      return diffLines(deferredOriginal, deferredChanged, {
        ignoreWhitespace: ignoreSpace,
        timeout: DIFF_TIMEOUT,
      });
    }
    if (mode === "words") {
      const options = { ignoreCase, timeout: DIFF_TIMEOUT };
      return ignoreSpace
        ? diffWords(deferredOriginal, deferredChanged, options)
        : diffWordsWithSpace(deferredOriginal, deferredChanged, options);
    }
    return diffChars(deferredOriginal, deferredChanged, { ignoreCase, timeout: DIFF_TIMEOUT });
  }, [hasInput, mode, deferredOriginal, deferredChanged, ignoreSpace, ignoreCase]);

  const rows = useMemo(() => {
    if (!changes || mode !== "lines") return [];
    const all = toRows(changes);
    return hideSame ? foldRows(all) : all;
  }, [changes, mode, hideSame]);

  const counts = useMemo(() => {
    const total = { added: 0, removed: 0, same: 0 };
    for (const change of changes ?? []) {
      const amount =
        mode === "lines"
          ? change.count ?? 0
          : mode === "words"
            ? change.value.trim().split(/\s+/).filter(Boolean).length
            : change.value.length;
      if (change.added) total.added += amount;
      else if (change.removed) total.removed += amount;
      else total.same += amount;
    }
    return total;
  }, [changes, mode]);

  const unit = mode === "lines" ? "lines" : mode === "words" ? "words" : "characters";
  const identical = changes !== null && changes !== undefined && counts.added === 0 && counts.removed === 0;
  const patch =
    mode === "lines" && changes && !identical
      ? createTwoFilesPatch("original", "changed", deferredOriginal, deferredChanged, "", "", { context: CONTEXT })
      : "";

  const swap = () => {
    setOriginal(changed);
    setChanged(original);
  };

  return (
    <ToolPage
      title="Text Diff"
      description="Compare two versions of a text and see exactly what was added and removed."
      actions={
        <SegmentedControl label="Compare by" options={MODE_OPTIONS} value={mode} onChange={setMode} />
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-5">
        <TextArea
          label="Original"
          value={original}
          onChange={setOriginal}
          placeholder="Paste the first version"
          compact
          actions={
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onClick={() => setOriginal("")}
              disabled={!original}
              icon={HiOutlineTrash}
            />
          }
        />
        <div className="flex items-center justify-center lg:pt-10">
          <Button
            label="Swap"
            variant="secondary"
            size="sm"
            icon={HiArrowsRightLeft}
            onClick={swap}
            disabled={!original && !changed}
          />
        </div>
        <TextArea
          label="Changed"
          value={changed}
          onChange={setChanged}
          placeholder="Paste the second version"
          compact
          actions={
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onClick={() => setChanged("")}
              disabled={!changed}
              icon={HiOutlineTrash}
            />
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Switch
          label={mode === "lines" ? "Ignore spaces at line ends" : "Ignore whitespace changes"}
          checked={ignoreSpace}
          onChange={setIgnoreSpace}
        />
        <Switch
          label="Ignore case"
          checked={mode !== "lines" && ignoreCase}
          onChange={setIgnoreCase}
          disabled={mode === "lines"}
        />
        {mode === "lines" && (
          <Switch label="Hide unchanged lines" checked={hideSame} onChange={setHideSame} />
        )}
      </div>

      {!hasInput || changes === null ? (
        <p className="rounded-lg border border-rule bg-surface px-4 py-8 text-center text-muted">
          Paste two versions above and the differences appear here.
        </p>
      ) : changes === undefined ? (
        <Notice tone="error">
          These texts have too many differences to compare quickly. Try comparing by lines, or
          compare smaller sections.
        </Notice>
      ) : identical ? (
        <Notice tone="success">The two texts are identical{ignoreSpace || ignoreCase ? " with the current ignore settings" : ""}.</Notice>
      ) : (
        <>
          <SummaryStrip
            label="Difference summary"
            items={[
              {
                label: "Changes",
                value: (counts.added + counts.removed).toLocaleString(),
                context: `${unit} added or removed`,
                lead: true,
              },
              { label: "Added", value: `+${counts.added.toLocaleString()}` },
              { label: "Removed", value: `-${counts.removed.toLocaleString()}` },
              { label: "Unchanged", value: counts.same.toLocaleString() },
            ]}
          />

          <section aria-labelledby="diff-heading" className="flex flex-col gap-2">
            <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
              <h2 id="diff-heading" className="text-sm font-medium text-ink">
                Differences
              </h2>
              <div className="flex items-center gap-4">
                <ul className="flex items-center gap-4 text-sm text-muted" aria-label="Legend">
                  <li className="flex items-center gap-1.5">
                    <span className="rounded-sm bg-success-tint px-1 font-mono text-success" aria-hidden="true">+</span>
                    Added
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="rounded-sm bg-danger-tint px-1 font-mono text-danger" aria-hidden="true">-</span>
                    Removed
                  </li>
                </ul>
                {patch && <CopyButton value={patch} label="Copy as patch" />}
              </div>
            </div>

            {mode === "lines" ? (
              <div
                tabIndex={0}
                role="region"
                aria-labelledby="diff-heading"
                className="max-h-[36rem] overflow-auto rounded-lg border border-rule bg-raised font-mono text-sm"
              >
                {rows.map((row, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "grid min-w-fit grid-cols-[3rem_3rem_1.5rem_minmax(0,1fr)]",
                      ROW_STYLES[row.type],
                      row.type === "fold" && "border-y border-rule"
                    )}
                  >
                    {row.type === "fold" ? (
                      <span className="col-span-4 px-4 py-1 text-center text-xs">{row.text}</span>
                    ) : (
                      <>
                        <span className="select-none border-r border-rule px-2 py-0.5 text-right text-xs leading-6 text-muted">
                          {row.oldNo ?? ""}
                        </span>
                        <span className="select-none border-r border-rule px-2 py-0.5 text-right text-xs leading-6 text-muted">
                          {row.newNo ?? ""}
                        </span>
                        <span
                          className={clsx(
                            "select-none py-0.5 text-center font-semibold leading-6",
                            row.type === "added" && "text-success",
                            row.type === "removed" && "text-danger"
                          )}
                          aria-hidden="true"
                        >
                          {MARKERS[row.type]}
                        </span>
                        <span className="whitespace-pre py-0.5 pr-4 leading-6">
                          <span className="sr-only">{SR_PREFIX[row.type]}</span>
                          {row.text || " "}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p
                tabIndex={0}
                role="region"
                aria-labelledby="diff-heading"
                className="max-h-[36rem] overflow-auto rounded-lg border border-rule bg-raised px-4 py-3 font-mono text-sm leading-7 whitespace-pre-wrap text-ink [overflow-wrap:anywhere]"
              >
                {changes.map((change, i) =>
                  change.added ? (
                    <ins
                      key={i}
                      className="rounded-sm bg-success-tint text-success underline decoration-2 underline-offset-4"
                    >
                      {change.value}
                    </ins>
                  ) : change.removed ? (
                    <del key={i} className="rounded-sm bg-danger-tint text-danger decoration-2">
                      {change.value}
                    </del>
                  ) : (
                    <span key={i}>{change.value}</span>
                  )
                )}
              </p>
            )}
          </section>
        </>
      )}

    </ToolPage>
  );
};
