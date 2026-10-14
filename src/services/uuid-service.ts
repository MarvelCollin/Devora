export type UuidVersion = "v4" | "v7";

export interface IUuidInfo {
  valid: boolean;
  normalized: string;
  version: number | null;
  variant: string;
  timestamp: Date | null;
  special: "nil" | "max" | null;
}

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const hyphenate = (hex: string) =>
  `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;

const uuidV4 = (): string => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return hyphenate(toHex(bytes));
};

let lastMs = 0;
let sequence = 0;

const uuidV7 = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let ms = Date.now();
  if (ms <= lastMs) {
    sequence += 1;
    if (sequence > 0xfff) {
      lastMs += 1;
      sequence = 0;
    }
    ms = lastMs;
  } else {
    lastMs = ms;
    sequence = (bytes[6] & 0x07) * 256 + bytes[7];
  }
  let time = ms;
  for (let i = 5; i >= 0; i -= 1) {
    bytes[i] = time % 256;
    time = Math.floor(time / 256);
  }
  bytes[6] = 0x70 | ((sequence >> 8) & 0x0f);
  bytes[7] = sequence & 0xff;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return hyphenate(toHex(bytes));
};

export const generateUuids = (version: UuidVersion, count: number): string[] =>
  Array.from({ length: count }, () => (version === "v4" ? uuidV4() : uuidV7()));

export const formatUuid = (uuid: string, uppercase: boolean, hyphens: boolean): string => {
  const shaped = hyphens ? uuid : uuid.replace(/-/g, "");
  return uppercase ? shaped.toUpperCase() : shaped;
};

const GREGORIAN_OFFSET = 0x01b21dd213814000n;

export const inspectUuid = (input: string): IUuidInfo => {
  const hex = input.trim().replace(/^\{|\}$/g, "").replace(/^urn:uuid:/i, "").replace(/-/g, "").toLowerCase();
  const invalid: IUuidInfo = {
    valid: false,
    normalized: "",
    version: null,
    variant: "",
    timestamp: null,
    special: null,
  };
  if (!/^[0-9a-f]{32}$/.test(hex)) return invalid;
  const normalized = hyphenate(hex);
  if (/^0{32}$/.test(hex)) return { ...invalid, valid: true, normalized, special: "nil", variant: "None" };
  if (/^f{32}$/.test(hex)) return { ...invalid, valid: true, normalized, special: "max", variant: "None" };

  const version = parseInt(hex[12], 16);
  const variantNibble = parseInt(hex[16], 16);
  const variant =
    variantNibble < 8
      ? "NCS, reserved"
      : variantNibble < 12
        ? "RFC 9562"
        : variantNibble < 14
          ? "Microsoft, reserved"
          : "Future, reserved";

  let timestamp: Date | null = null;
  if (version === 7) {
    timestamp = new Date(parseInt(hex.slice(0, 12), 16));
  } else if (version === 1) {
    const ticks = BigInt(`0x${hex.slice(13, 16)}${hex.slice(8, 12)}${hex.slice(0, 8)}`);
    timestamp = new Date(Number((ticks - GREGORIAN_OFFSET) / 10000n));
  } else if (version === 6) {
    const ticks = BigInt(`0x${hex.slice(0, 12)}${hex.slice(13, 16)}`);
    timestamp = new Date(Number((ticks - GREGORIAN_OFFSET) / 10000n));
  }

  return { valid: true, normalized, version, variant, timestamp, special: null };
};
