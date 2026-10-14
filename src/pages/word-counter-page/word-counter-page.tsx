import { useMemo } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { Switch } from "../../components/common/switch/switch";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";
import {
  analyzeText,
  getWordFrequency,
  formatDuration,
} from "../../services/word-counter-service";
import { usePersistentState } from "../../hooks/use-persistent-state";

const plural = (count: number, word: string) =>
  `${count.toLocaleString()} ${count === 1 ? word : `${word}s`}`;

export const WordCounterPage = () => {
  const [input, setInput] = usePersistentState("word-counter:input", "");
  const [ignoreStopWords, setIgnoreStopWords] = usePersistentState("word-counter:skip-common", true);

  const stats = useMemo(() => analyzeText(input), [input]);
  const frequency = useMemo(
    () => getWordFrequency(input, ignoreStopWords),
    [input, ignoreStopWords]
  );
  const topCount = frequency[0]?.count ?? 0;

  return (
    <ToolPage
      title="Word Counter"
      description="Paste or type text to count words and characters and estimate how long it takes to read."
      fill
    >
      <SummaryStrip
        label="Text statistics"
        items={[
          {
            label: "Words",
            value: stats.words.toLocaleString(),
            context: `${stats.uniqueWords.toLocaleString()} unique`,
            lead: true,
          },
          {
            label: "Characters",
            value: stats.characters.toLocaleString(),
            context: `${stats.charactersNoSpaces.toLocaleString()} without spaces`,
          },
          {
            label: "Sentences",
            value: stats.sentences.toLocaleString(),
            context: plural(stats.paragraphs, "paragraph"),
          },
          {
            label: "Reading time",
            value: formatDuration(stats.readingSeconds),
            context: "at 238 words a minute",
          },
          {
            label: "Speaking time",
            value: formatDuration(stats.speakingSeconds),
            context: "at 150 words a minute",
          },
        ]}
      />

      <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <TextArea
          label="Text"
          value={input}
          onChange={setInput}
          placeholder="Type or paste your text"
          hint={plural(stats.lines, "line")}
          prose
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

        <section aria-labelledby="top-words-heading" className="flex min-h-0 flex-col gap-2">
          <h2
            id="top-words-heading"
            className="flex min-h-8 items-center text-sm font-medium text-ink"
          >
            Top words
          </h2>
          <Switch
            label="Skip common words like the and of"
            checked={ignoreStopWords}
            onChange={setIgnoreStopWords}
          />
          {frequency.length === 0 ? (
            <p className="rounded-lg border border-rule bg-surface px-4 py-6 text-sm text-muted">
              The most used words show up here once you add text.
            </p>
          ) : (
            <div
              tabIndex={0}
              role="region"
              aria-label="Top words list"
              className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-rule bg-raised"
            >
              <ol className="flex flex-col">
                {frequency.map((item, index) => (
                  <li
                    key={item.word}
                    className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-rule px-3 py-2 last:border-b-0"
                  >
                    <span className="text-right font-mono text-xs tabular-nums text-muted">
                      {index + 1}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-mono text-sm break-all text-ink">{item.word}</span>
                      <span
                        className="h-1 rounded-full bg-soft"
                        style={{ width: `${(item.count / topCount) * 100}%` }}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-right font-mono text-sm tabular-nums text-ink">
                      {item.count}
                      <span className="block text-xs text-muted">
                        {item.density.toFixed(1)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </div>
    </ToolPage>
  );
};
