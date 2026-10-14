const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "per", "the", "to", "vs", "via",
]);

export const splitWords = (text: string): string[] =>
  text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^\p{L}\p{N}']+/u)
    .filter(Boolean);

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

const perLine = (text: string, convert: (line: string) => string) =>
  text
    .split("\n")
    .map((line) => (line.trim() ? convert(line) : line))
    .join("\n");

const joinWords = (separator: string, transform: (word: string, index: number) => string) => (line: string) =>
  splitWords(line).map(transform).join(separator);

export interface ICaseStyle {
  id: string;
  label: string;
  convert: (text: string) => string;
}

export const CASE_STYLES: ICaseStyle[] = [
  {
    id: "camel",
    label: "camelCase",
    convert: (text) =>
      perLine(text, joinWords("", (word, i) => (i === 0 ? word.toLowerCase() : capitalize(word)))),
  },
  { id: "pascal", label: "PascalCase", convert: (text) => perLine(text, joinWords("", capitalize)) },
  { id: "snake", label: "snake_case", convert: (text) => perLine(text, joinWords("_", (w) => w.toLowerCase())) },
  {
    id: "constant",
    label: "CONSTANT_CASE",
    convert: (text) => perLine(text, joinWords("_", (w) => w.toUpperCase())),
  },
  { id: "kebab", label: "kebab-case", convert: (text) => perLine(text, joinWords("-", (w) => w.toLowerCase())) },
  { id: "train", label: "Train-Case", convert: (text) => perLine(text, joinWords("-", capitalize)) },
  { id: "dot", label: "dot.case", convert: (text) => perLine(text, joinWords(".", (w) => w.toLowerCase())) },
  { id: "path", label: "path/case", convert: (text) => perLine(text, joinWords("/", (w) => w.toLowerCase())) },
  {
    id: "title",
    label: "Title Case",
    convert: (text) =>
      perLine(text, (line) => {
        const words = splitWords(line);
        return words
          .map((word, i) =>
            i > 0 && i < words.length - 1 && SMALL_WORDS.has(word.toLowerCase())
              ? word.toLowerCase()
              : capitalize(word)
          )
          .join(" ");
      }),
  },
  {
    id: "sentence",
    label: "Sentence case",
    convert: (text) =>
      perLine(text, (line) => {
        const joined = splitWords(line).join(" ").toLowerCase();
        return joined.charAt(0).toUpperCase() + joined.slice(1);
      }),
  },
  { id: "lower", label: "lower case", convert: (text) => text.toLowerCase() },
  { id: "upper", label: "UPPER CASE", convert: (text) => text.toUpperCase() },
];
