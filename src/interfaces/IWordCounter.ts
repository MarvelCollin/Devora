export interface IWordStats {
  words: number;
  uniqueWords: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingSeconds: number;
  speakingSeconds: number;
}

export interface IWordFrequency {
  word: string;
  count: number;
  density: number;
}
