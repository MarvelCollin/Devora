import { useMemo, useState } from "react";
import { HiOutlineDocumentText, HiOutlineTrash } from "react-icons/hi2";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import {
  analyzeText,
  getWordFrequency,
  formatDuration,
} from "../../services/word-counter-service";

export const WordCounterPage = () => {
  const [input, setInput] = useState("");
  const [ignoreStopWords, setIgnoreStopWords] = useState(true);

  const stats = useMemo(() => analyzeText(input), [input]);
  const frequency = useMemo(
    () => getWordFrequency(input, ignoreStopWords),
    [input, ignoreStopWords]
  );

  const statItems = [
    { label: "Words", value: stats.words.toLocaleString() },
    { label: "Characters", value: stats.characters.toLocaleString() },
    { label: "Without Spaces", value: stats.charactersNoSpaces.toLocaleString() },
    { label: "Unique Words", value: stats.uniqueWords.toLocaleString() },
    { label: "Sentences", value: stats.sentences.toLocaleString() },
    { label: "Paragraphs", value: stats.paragraphs.toLocaleString() },
    { label: "Reading Time", value: formatDuration(stats.readingSeconds) },
    { label: "Speaking Time", value: formatDuration(stats.speakingSeconds) },
  ];

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineDocumentText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              Word Counter
            </h2>
            <p className="text-sm text-dark-400">
              Count words, characters, sentences, and reading time
            </p>
          </div>
        </div>
        <Button
          label="Clear"
          variant="ghost"
          size="sm"
          onClick={() => setInput("")}
          icon={HiOutlineTrash}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="p-4 rounded-xl bg-dark-900 border border-dark-700"
          >
            <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold">
              {item.label}
            </span>
            <p className="mt-1 text-2xl font-semibold text-dark-100 truncate">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-dark-300">Input Text</span>
            <span className="text-xs text-dark-500">
              {stats.lines.toLocaleString()} {stats.lines === 1 ? "line" : "lines"}
            </span>
          </div>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder="Type or paste text to count words..."
            rows={20}
          />
        </div>

        <div className="w-72 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-dark-300">Top Words</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ignoreStopWords}
                onChange={(e) => setIgnoreStopWords(e.target.checked)}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-accent-600 focus:ring-accent-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-dark-400">Ignore common words</span>
            </label>
          </div>
          <div className="flex-1 min-h-[200px] rounded-xl bg-dark-900 border border-dark-700 overflow-y-auto">
            {frequency.length === 0 ? (
              <p className="p-4 text-sm text-dark-500">
                Word frequency will appear here
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-800">
                    <th className="text-left px-4 py-2.5 text-xs text-dark-500 uppercase tracking-wider font-semibold">Word</th>
                    <th className="text-right px-4 py-2.5 text-xs text-dark-500 uppercase tracking-wider font-semibold">Count</th>
                    <th className="text-right px-4 py-2.5 text-xs text-dark-500 uppercase tracking-wider font-semibold">%</th>
                  </tr>
                </thead>
                <tbody>
                  {frequency.map((item) => (
                    <tr key={item.word} className="border-t border-dark-700">
                      <td className="px-4 py-2 font-mono text-accent-400 truncate max-w-[120px]">{item.word}</td>
                      <td className="px-4 py-2 text-right font-mono text-dark-200">{item.count}</td>
                      <td className="px-4 py-2 text-right font-mono text-dark-400">{item.density.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
