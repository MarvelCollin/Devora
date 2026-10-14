import { useDeferredValue, useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { HiOutlineTrash, HiOutlineBeaker, HiOutlineArrowDownTray } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { usePersistentState } from "../../hooks/use-persistent-state";

type View = "preview" | "html";

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: "preview", label: "Preview" },
  { value: "html", label: "HTML" },
];

const EXAMPLE = `# Project title

A short description with **bold**, *italic* and \`inline code\`.

## Install

\`\`\`bash
npm install devora
npm run dev
\`\`\`

## Checklist

- [x] Write the README
- [ ] Add screenshots
- [ ] Publish

## Notes

> Everything runs in the browser, so nothing is uploaded.

| Tool | Group |
| --- | --- |
| JSON Formatter | Format and convert |
| Regex Tester | Text and generators |

Read more on [the docs site](https://example.com).
`;

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("href")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

const render = (markdown: string): string =>
  DOMPurify.sanitize(marked.parse(markdown, { async: false, gfm: true }));

export const MarkdownPreviewPage = () => {
  const [input, setInput] = usePersistentState("markdown:input", "");
  const [view, setView] = usePersistentState<View>("markdown:view", "preview");
  const deferredInput = useDeferredValue(input);
  const html = useMemo(() => (deferredInput.trim() ? render(deferredInput) : ""), [deferredInput]);
  const words = input.trim() ? input.trim().split(/\s+/).length : 0;

  const download = () => {
    const url = URL.createObjectURL(new Blob([input], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "document.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolPage
      title="Markdown Preview"
      description="Write GitHub flavored Markdown and see it rendered as you type. Raw HTML is cleaned so scripts never run."
      fill
      actions={
        <>
          <Button label="Load an example" variant="secondary" icon={HiOutlineBeaker} onClick={() => setInput(EXAMPLE)} />
          <SegmentedControl label="Show" options={VIEW_OPTIONS} value={view} onChange={setView} />
        </>
      }
    >
      <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <TextArea
          label="Markdown"
          value={input}
          onChange={setInput}
          placeholder="# Start writing"
          hint={words ? `${words.toLocaleString()} ${words === 1 ? "word" : "words"}` : undefined}
          actions={
            <>
              <Button
                label="Download .md"
                variant="ghost"
                size="sm"
                icon={HiOutlineArrowDownTray}
                onClick={download}
                disabled={!input}
              />
              <Button
                label="Clear"
                variant="ghost"
                size="sm"
                onClick={() => setInput("")}
                disabled={!input}
                icon={HiOutlineTrash}
              />
            </>
          }
        />

        <section aria-labelledby="rendered-heading" className="flex min-h-0 min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center justify-between gap-3">
            <h2 id="rendered-heading" className="text-sm font-medium text-ink">
              {view === "preview" ? "Preview" : "HTML"}
            </h2>
            <CopyButton value={html} label="Copy HTML" />
          </div>
          {view === "preview" ? (
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="rendered-heading"
              className="min-h-64 flex-1 overflow-y-auto rounded-lg border border-rule bg-raised px-6 py-5"
            >
              {html ? (
                <div className="md-preview" dangerouslySetInnerHTML={{ __html: html }} />
              ) : (
                <p className="text-muted">The rendered document shows up here.</p>
              )}
            </div>
          ) : (
            <pre
              tabIndex={0}
              role="region"
              aria-labelledby="rendered-heading"
              className="min-h-64 flex-1 overflow-auto rounded-lg border border-rule bg-surface px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap text-ink [overflow-wrap:anywhere]"
            >
              {html || <span className="text-muted">The generated HTML shows up here.</span>}
            </pre>
          )}
        </section>
      </div>
    </ToolPage>
  );
};
