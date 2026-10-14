import type { IWordStats, IWordFrequency } from "../interfaces/IWordCounter";

const READING_WPM = 238;
const SPEAKING_WPM = 150;

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "all", "am", "an", "and", "any",
  "are", "as", "at", "be", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "can", "could", "did", "do", "does", "doing",
  "down", "during", "each", "few", "for", "from", "further", "had", "has",
  "have", "having", "he", "her", "here", "hers", "him", "his", "how", "i",
  "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more",
  "most", "my", "no", "nor", "not", "now", "of", "off", "on", "once", "only",
  "or", "other", "our", "ours", "out", "over", "own", "same", "she", "should",
  "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
  "then", "there", "these", "they", "this", "those", "through", "to", "too",
  "under", "until", "up", "very", "was", "we", "were", "what", "when",
  "where", "which", "while", "who", "whom", "why", "will", "with", "would",
  "you", "your", "yours",
]);

const wordSegmenter = new Intl.Segmenter(undefined, { granularity: "word" });
const sentenceSegmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

const extractWords = (text: string): string[] => {
  const words: string[] = [];
  for (const segment of wordSegmenter.segment(text)) {
    if (segment.isWordLike) {
      words.push(segment.segment);
    }
  }
  return words;
};

const countGraphemes = (text: string): number => {
  let count = 0;
  for (const segment of graphemeSegmenter.segment(text)) {
    if (segment.segment) count++;
  }
  return count;
};

const countSentences = (text: string): number => {
  let count = 0;
  for (const segment of sentenceSegmenter.segment(text)) {
    if (segment.segment.trim()) count++;
  }
  return count;
};

export const analyzeText = (text: string): IWordStats => {
  const words = extractWords(text);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));

  return {
    words: words.length,
    uniqueWords: uniqueWords.size,
    characters: countGraphemes(text),
    charactersNoSpaces: countGraphemes(text.replace(/\s/g, "")),
    sentences: countSentences(text),
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
    lines: text ? text.split(/\r\n|\r|\n/).length : 0,
    readingSeconds: Math.ceil((words.length / READING_WPM) * 60),
    speakingSeconds: Math.ceil((words.length / SPEAKING_WPM) * 60),
  };
};

export const getWordFrequency = (
  text: string,
  ignoreStopWords: boolean,
  limit = 20
): IWordFrequency[] => {
  const words = extractWords(text).map((w) => w.toLowerCase());
  const counts = new Map<string, number>();

  for (const word of words) {
    if (ignoreStopWords && STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({
      word,
      count,
      density: words.length ? (count / words.length) * 100 : 0,
    }));
};

export const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes} min ${seconds} sec` : `${minutes} min`;
};
