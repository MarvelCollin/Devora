const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
const PREFIXES: Record<number, RegExp> = { 16: /^0x/i, 2: /^0b/i, 8: /^0o/i };

export const BASE_NAMES: Record<number, string> = {
  2: "binary",
  8: "octal",
  10: "decimal",
  16: "hexadecimal",
};

export const parseInBase = (text: string, base: number): bigint | null => {
  let cleaned = text.trim().replace(/[\s_,]/g, "").toLowerCase();
  if (!cleaned) return null;
  const negative = cleaned.startsWith("-");
  if (negative) cleaned = cleaned.slice(1);
  const prefix = PREFIXES[base];
  if (prefix) cleaned = cleaned.replace(prefix, "");
  if (!cleaned) return null;
  const allowed = DIGITS.slice(0, base);
  let value = 0n;
  const bigBase = BigInt(base);
  for (const char of cleaned) {
    const digit = allowed.indexOf(char);
    if (digit === -1) return null;
    value = value * bigBase + BigInt(digit);
  }
  return negative ? -value : value;
};

export const formatInBase = (
  value: bigint,
  base: number,
  options: { group: boolean; uppercase: boolean }
): string => {
  const negative = value < 0n;
  let digits = (negative ? -value : value).toString(base);
  if (options.uppercase) digits = digits.toUpperCase();
  if (options.group) {
    const size = base === 2 || base === 16 ? 4 : 3;
    const separator = base === 10 ? "," : " ";
    const padded = base === 2 ? digits.padStart(Math.ceil(digits.length / 4) * 4, "0") : digits;
    const groups: string[] = [];
    for (let end = padded.length; end > 0; end -= size) {
      groups.unshift(padded.slice(Math.max(0, end - size), end));
    }
    digits = groups.join(separator);
  }
  return negative ? `-${digits}` : digits;
};

export const digitHint = (base: number): string => {
  if (base <= 10) return `Use digits 0 to ${base - 1}.`;
  return `Use digits 0 to 9 and letters A to ${DIGITS[base - 1].toUpperCase()}.`;
};

export const bitsNeeded = (value: bigint): number => {
  if (value === 0n) return 1;
  if (value > 0n) return value.toString(2).length;
  return (-value - 1n).toString(2).length + 1;
};

const TYPES: { name: string; bits: number; signed: boolean }[] = [
  { name: "u8", bits: 8, signed: false },
  { name: "i8", bits: 8, signed: true },
  { name: "u16", bits: 16, signed: false },
  { name: "i16", bits: 16, signed: true },
  { name: "u32", bits: 32, signed: false },
  { name: "i32", bits: 32, signed: true },
  { name: "u64", bits: 64, signed: false },
  { name: "i64", bits: 64, signed: true },
  { name: "u128", bits: 128, signed: false },
  { name: "i128", bits: 128, signed: true },
];

export const fittingTypes = (value: bigint): string[] =>
  TYPES.filter((type) => {
    const size = BigInt(type.bits);
    if (type.signed) {
      const limit = 1n << (size - 1n);
      return value >= -limit && value < limit;
    }
    return value >= 0n && value < 1n << size;
  }).map((type) => type.name);
