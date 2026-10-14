import { EFF_SHORT_WORDS } from "../data/eff-short-wordlist";

export interface ICharacterOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  avoidLookalikes: boolean;
}

export interface IPassphraseOptions {
  words: number;
  separator: string;
  capitalize: boolean;
  addNumber: boolean;
}

export interface IStrength {
  bits: number;
  level: 0 | 1 | 2 | 3;
  label: string;
  crackTime: string;
}

const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/~",
};

const LOOKALIKES = /[Il1O0o|`'"]/g;

export const randomIndex = (max: number): number => {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
};

const activeSets = (options: ICharacterOptions): string[] =>
  (Object.keys(SETS) as (keyof typeof SETS)[])
    .filter((key) => options[key])
    .map((key) => (options.avoidLookalikes ? SETS[key].replace(LOOKALIKES, "") : SETS[key]));

export const poolSize = (options: ICharacterOptions): number =>
  activeSets(options).reduce((total, set) => total + set.length, 0);

export const generatePassword = (options: ICharacterOptions): string => {
  const sets = activeSets(options);
  if (sets.length === 0) return "";
  const pool = sets.join("");
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const chars = Array.from({ length: options.length }, () => pool[randomIndex(pool.length)]);
    const coversAll = options.length < sets.length || sets.every((set) => chars.some((char) => set.includes(char)));
    if (coversAll) return chars.join("");
  }
  return Array.from({ length: options.length }, () => pool[randomIndex(pool.length)]).join("");
};

export const generatePassphrase = (options: IPassphraseOptions): string => {
  const words = Array.from({ length: options.words }, () => {
    const word = EFF_SHORT_WORDS[randomIndex(EFF_SHORT_WORDS.length)];
    return options.capitalize ? word[0].toUpperCase() + word.slice(1) : word;
  });
  if (options.addNumber) {
    const position = randomIndex(words.length);
    words[position] = `${words[position]}${randomIndex(10)}`;
  }
  return words.join(options.separator);
};

export const passphraseBits = (options: IPassphraseOptions): number =>
  options.words * Math.log2(EFF_SHORT_WORDS.length) +
  (options.addNumber ? Math.log2(10) + Math.log2(options.words) : 0);

const humanizeSeconds = (seconds: number): string => {
  if (seconds < 1) return "instantly";
  const units: [number, string][] = [
    [3.15e16, "billion years"],
    [3.15e13, "million years"],
    [3.15e9, "centuries"],
    [3.15e7, "years"],
    [86400 * 30, "months"],
    [86400, "days"],
    [3600, "hours"],
    [60, "minutes"],
    [1, "seconds"],
  ];
  if (seconds >= 4.35e17) return "longer than the age of the universe";
  const [size, unit] = units.find(([limit]) => seconds >= limit) ?? units[units.length - 1];
  return `about ${Math.round(seconds / size).toLocaleString()} ${unit}`;
};

export const rateStrength = (bits: number): IStrength => {
  const seconds = 2 ** bits / 1e10 / 2;
  const crackTime = humanizeSeconds(seconds);
  if (bits < 40) return { bits, level: 0, label: "Weak", crackTime };
  if (bits < 60) return { bits, level: 1, label: "Fair", crackTime };
  if (bits < 80) return { bits, level: 2, label: "Strong", crackTime };
  return { bits, level: 3, label: "Very strong", crackTime };
};
