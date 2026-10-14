import { useMemo } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { ValueList } from "../../components/common/value-list/value-list";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { CASE_STYLES, splitWords } from "../../services/case-service";

export const CaseConverterPage = () => {
  const [input, setInput] = usePersistentState("case:input", "");

  const rows = useMemo(
    () =>
      CASE_STYLES.map((style) => ({
        label: style.label,
        value: input.trim() ? style.convert(input) : "",
      })),
    [input]
  );

  const wordCount = input.trim() ? splitWords(input).length : 0;

  return (
    <ToolPage
      title="Case Converter"
      description="Turn names and phrases into camelCase, snake_case, kebab-case and more. Each line is converted on its own."
    >
      <TextArea
        label="Text"
        value={input}
        onChange={setInput}
        compact
        placeholder={"getHTTPResponse\nuser profile id\nMAX_RETRY_COUNT"}
        hint={wordCount ? `${wordCount} ${wordCount === 1 ? "word" : "words"} found` : undefined}
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

      {input.trim() ? (
        <section aria-labelledby="cases-heading" className="flex flex-col gap-2">
          <h2 id="cases-heading" className="text-sm font-medium text-ink">
            Converted
          </h2>
          <ValueList rows={rows} />
        </section>
      ) : (
        <p className="rounded-lg border border-rule bg-surface px-4 py-6 text-muted">
          Type a name like <span className="font-mono text-ink">user profile id</span> to see it in
          every case style.
        </p>
      )}
    </ToolPage>
  );
};
