import { useMemo } from "react";
import type { ReactNode } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextArea } from "../../components/common/text-area/text-area";
import { TextInput } from "../../components/common/text-input/text-input";
import { Button } from "../../components/common/button/button";
import { ToggleGroup } from "../../components/common/toggle-group/toggle-group";
import { CodeBlock } from "../../components/common/code-block/code-block";
import { Notice } from "../../components/common/notice/notice";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { useRegexWorker } from "../../hooks/use-regex-worker";
import type { IRegexMatch } from "../../workers/regex-worker";

const FLAG_OPTIONS = [
  { value: "g", label: "g", hint: "All matches" },
  { value: "i", label: "i", hint: "Ignore case" },
  { value: "m", label: "m", hint: "Multiline" },
  { value: "s", label: "s", hint: "Dot matches newline" },
  { value: "u", label: "u", hint: "Unicode" },
  { value: "y", label: "y", hint: "Sticky" },
];

const FLAG_ORDER = "gimsuy";

const EXAMPLES: { name: string; pattern: string; flags: string[]; sample: string }[] = [
  {
    name: "Email",
    pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.-]+",
    flags: ["g", "i"],
    sample: "Write to ada@example.com or support@devora.dev for help.",
  },
  {
    name: "URL",
    pattern: "https?:\\/\\/[^\\s/$.?#].[^\\s]*",
    flags: ["g", "i"],
    sample: "Docs live at https://example.com/docs and http://localhost:5173/#/json-formatter.",
  },
  {
    name: "Date",
    pattern: "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})",
    flags: ["g"],
    sample: "Released 2026-10-14, patched 2026-11-02.",
  },
  {
    name: "Hex color",
    pattern: "#(?:[0-9a-f]{3}){1,2}\\b",
    flags: ["g", "i"],
    sample: "Primary #2f7d6d, accent #F0B788 and white #fff.",
  },
];

const CHEATSHEET: [string, string][] = [
  ["\\d \\w \\s", "Digit, word character, whitespace"],
  ["\\D \\W \\S", "Not a digit, word character or whitespace"],
  [".", "Any character except a newline"],
  ["[abc] [^abc]", "One of a, b or c. Anything except a, b or c"],
  ["^ $", "Start and end of the text, or of a line with m"],
  ["\\b", "Word boundary"],
  ["a* a+ a?", "Zero or more, one or more, zero or one"],
  ["a{2,4}", "Between two and four"],
  ["(abc) (?:abc)", "Capturing group and non-capturing group"],
  ["(?<name>abc)", "Named group, use $<name> in a replacement"],
  ["a|b", "Either a or b"],
  ["(?=a) (?!a)", "Followed by a, not followed by a"],
];

const buildHighlight = (text: string, matches: IRegexMatch[]): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((match, i) => {
    if (match.end <= match.index || match.index < cursor) return;
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    nodes.push(
      <mark
        key={i}
        className={
          i % 2 === 0
            ? "rounded-sm bg-soft text-ink underline decoration-strong decoration-2 underline-offset-2"
            : "rounded-sm bg-accent-tint text-ink underline decoration-accent-strong decoration-2 underline-offset-2"
        }
      >
        {text.slice(match.index, match.end)}
      </mark>
    );
    cursor = match.end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
};

export const RegexTesterPage = () => {
  const [pattern, setPattern] = usePersistentState("regex:pattern", "");
  const [flagList, setFlagList] = usePersistentState<string[]>("regex:flags", ["g"]);
  const [text, setText] = usePersistentState("regex:text", "");
  const [replacement, setReplacement] = usePersistentState("regex:replacement", "");

  const flags = FLAG_ORDER.split("")
    .filter((flag) => flagList.includes(flag))
    .join("");

  const syntaxError = useMemo(() => {
    if (!pattern) return null;
    try {
      new RegExp(pattern, flags);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message.replace(/^Invalid regular expression: /, "") : "Invalid pattern";
    }
  }, [pattern, flags]);

  const run = useRegexWorker(
    pattern && !syntaxError ? { pattern, flags, text, replacement } : null
  );

  const response = run.status === "done" ? run.response : null;
  const matches = response?.matches ?? [];
  const sourceText = run.status === "done" ? run.text : text;

  const loadExample = (example: (typeof EXAMPLES)[number]) => {
    setPattern(example.pattern);
    setFlagList(example.flags);
    if (!text.trim()) setText(example.sample);
  };

  const summary =
    !pattern
      ? "Type a pattern to start"
      : syntaxError
        ? "Fix the pattern to see matches"
        : run.status === "timeout"
          ? "Stopped"
          : response
            ? `${matches.length}${response.truncated ? "+" : ""} ${matches.length === 1 ? "match" : "matches"}`
            : "Matching";

  return (
    <ToolPage
      title="Regex Tester"
      description="Write a JavaScript regular expression and see every match, group and replacement as you type."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Try an example:</span>
          {EXAMPLES.map((example) => (
            <Button
              key={example.name}
              label={example.name}
              variant="ghost"
              size="sm"
              onClick={() => loadExample(example)}
            />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <TextInput
            label="Pattern"
            value={pattern}
            onChange={setPattern}
            prefix="/"
            suffix={`/${flags}`}
            size="lg"
            placeholder={"\\d{4}-\\d{2}-\\d{2}"}
            error={syntaxError ? `${syntaxError}. Check for unclosed brackets or a stray backslash.` : null}
          />
          <ToggleGroup label="Flags" options={FLAG_OPTIONS} value={flagList} onChange={setFlagList} />
        </div>
      </div>

      {run.status === "timeout" && (
        <Notice tone="error">
          This pattern took too long and was stopped. Nested repeats like (a+)+ can backtrack
          forever on some text. Try making the repeat more specific.
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <TextArea
          label="Test text"
          value={text}
          onChange={setText}
          placeholder="Paste the text you want to search"
          actions={
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onClick={() => setText("")}
              disabled={!text}
              icon={HiOutlineTrash}
            />
          }
        />
        <section aria-labelledby="highlight-heading" className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-3">
            <h2 id="highlight-heading" className="text-sm font-medium text-ink">
              Matches
            </h2>
            <span className="text-sm text-muted" aria-live="polite">
              {summary}
            </span>
          </div>
          <pre
            tabIndex={0}
            role="region"
            aria-labelledby="highlight-heading"
            className="min-h-64 flex-1 overflow-auto rounded-lg border border-rule bg-surface px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap text-ink [overflow-wrap:anywhere]"
          >
            {sourceText ? (
              buildHighlight(sourceText, matches)
            ) : (
              <span className="text-muted">Matched parts of your text are highlighted here.</span>
            )}
          </pre>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="details-heading" className="flex min-w-0 flex-col gap-2">
          <h2 id="details-heading" className="flex min-h-8 items-center text-sm font-medium text-ink">
            Match details
          </h2>
          {matches.length === 0 ? (
            <p className="rounded-lg border border-rule bg-surface px-4 py-6 text-sm text-muted">
              Each match, its position and its groups are listed here.
            </p>
          ) : (
            <ol
              tabIndex={0}
              aria-labelledby="details-heading"
              className="max-h-96 overflow-y-auto rounded-lg border border-rule bg-raised"
            >
              {matches.map((match, i) => (
                <li key={`${match.index}-${i}`} className="border-b border-rule px-4 py-3 last:border-b-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-ink">Match {i + 1}</span>
                    <span className="font-mono text-xs text-muted">
                      index {match.index} to {match.end}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-sm text-strong [overflow-wrap:anywhere]">
                    {match.text === "" ? <span className="text-muted">(empty match)</span> : match.text}
                  </p>
                  {(match.groups.length > 0 || Object.keys(match.named).length > 0) && (
                    <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                      {match.groups.map((group, g) => (
                        <div key={`g${g}`} className="contents">
                          <dt className="font-mono text-muted">${g + 1}</dt>
                          <dd className="font-mono text-ink [overflow-wrap:anywhere]">
                            {group ?? <span className="text-muted">no match</span>}
                          </dd>
                        </div>
                      ))}
                      {Object.entries(match.named).map(([name, value]) => (
                        <div key={name} className="contents">
                          <dt className="font-mono text-muted">{name}</dt>
                          <dd className="font-mono text-ink [overflow-wrap:anywhere]">
                            {value ?? <span className="text-muted">no match</span>}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-4">
          <TextInput
            label="Replace with"
            hint="Use $1 or $<name> for groups"
            value={replacement}
            onChange={setReplacement}
            placeholder="$<day>/$<month>/$<year>"
          />
          <CodeBlock
            label="Result"
            code={response && pattern ? response.replaced : text}
            hint={flags.includes("g") ? "Replaces every match" : "Replaces the first match only"}
          />
        </div>
      </div>

      <details className="group rounded-lg border border-rule bg-raised">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 text-sm font-medium text-ink hover:bg-tint [&::-webkit-details-marker]:hidden">
          Cheat sheet
          <span className="text-muted group-open:hidden">Show</span>
          <span className="hidden text-muted group-open:inline">Hide</span>
        </summary>
        <dl className="grid gap-x-6 gap-y-2 border-t border-rule px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)]">
          {CHEATSHEET.map(([token, meaning]) => (
            <div key={token} className="contents">
              <dt className="font-mono text-sm font-semibold text-strong">{token}</dt>
              <dd className="text-sm text-muted">{meaning}</dd>
            </div>
          ))}
        </dl>
      </details>
    </ToolPage>
  );
};
