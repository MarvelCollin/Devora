export type Delimiter = "auto" | "," | ";" | "\t" | "|";

export interface ICsvParseOptions {
  delimiter: Delimiter;
  header: boolean;
  typed: boolean;
}

export interface ICsvToJsonResult {
  json: string;
  rows: number;
  columns: string[];
  delimiter: string;
}

export interface IJsonToCsvResult {
  csv: string;
  rows: number;
  columns: string[];
}

const CANDIDATES = [",", ";", "\t", "|"];

export const detectDelimiter = (text: string): string => {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  let best = ",";
  let bestCount = 0;
  for (const candidate of CANDIDATES) {
    let count = 0;
    let quoted = false;
    for (const char of firstLine) {
      if (char === '"') quoted = !quoted;
      else if (char === candidate && !quoted) count += 1;
    }
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
};

export const parseCsv = (text: string, delimiter: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let line = 1;
  let quoteStartLine = 1;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        if (char === "\n") line += 1;
        field += char;
      }
      continue;
    }
    if (char === '"' && field === "") {
      quoted = true;
      quoteStartLine = line;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      line += 1;
    } else {
      field += char;
    }
  }
  if (quoted) {
    throw new Error(`A quoted field that starts on line ${quoteStartLine} is never closed. Add the missing quote mark.`);
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
};

const typeValue = (value: string): unknown => {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed) && trimmed.length < 16) return Number(trimmed);
  return value;
};

export const csvToJson = (text: string, options: ICsvParseOptions): ICsvToJsonResult => {
  const delimiter = options.delimiter === "auto" ? detectDelimiter(text) : options.delimiter;
  const rows = parseCsv(text, delimiter);
  const convert = (value: string) => (options.typed ? typeValue(value) : value);

  if (!options.header) {
    const width = Math.max(0, ...rows.map((r) => r.length));
    return {
      json: JSON.stringify(rows.map((r) => r.map(convert)), null, 2),
      rows: rows.length,
      columns: Array.from({ length: width }, (_, i) => `column ${i + 1}`),
      delimiter,
    };
  }

  const [headerRow = [], ...body] = rows;
  const width = Math.max(headerRow.length, ...body.map((r) => r.length));
  const used = new Map<string, number>();
  const columns = Array.from({ length: width }, (_, i) => {
    const base = headerRow[i]?.trim() || `column_${i + 1}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}_${seen + 1}`;
  });
  const objects = body.map((r) =>
    Object.fromEntries(columns.map((column, i) => [column, convert(r[i] ?? "")]))
  );
  return { json: JSON.stringify(objects, null, 2), rows: objects.length, columns, delimiter };
};

const flatten = (value: unknown, prefix: string, out: Record<string, unknown>) => {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0 && prefix) out[prefix] = "";
    for (const [key, inner] of entries) flatten(inner, prefix ? `${prefix}.${key}` : key, out);
  } else {
    out[prefix] = value;
  }
};

const cell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const quote = (text: string, delimiter: string): string =>
  text.includes(delimiter) || /["\r\n]/.test(text) || text !== text.trim()
    ? `"${text.replace(/"/g, '""')}"`
    : text;

export const jsonToCsv = (text: string, delimiter: string, flattenNested: boolean): IJsonToCsvResult => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This is not valid JSON. Check for missing quotes, commas or brackets.");
  }
  const list = Array.isArray(data) ? data : [data];
  if (list.length === 0) return { csv: "", rows: 0, columns: [] };

  if (list.every((item) => Array.isArray(item))) {
    const csv = (list as unknown[][])
      .map((row) => row.map((value) => quote(cell(value), delimiter)).join(delimiter))
      .join("\n");
    return { csv, rows: list.length, columns: [] };
  }

  if (!list.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))) {
    throw new Error('To make a CSV, use an array of objects, like [{"name": "Ada", "age": 36}].');
  }

  const records = list.map((item) => {
    if (!flattenNested) return item as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    flatten(item, "", out);
    return out;
  });
  const columns: string[] = [];
  for (const record of records) {
    for (const key of Object.keys(record)) if (!columns.includes(key)) columns.push(key);
  }
  const lines = [
    columns.map((column) => quote(column, delimiter)).join(delimiter),
    ...records.map((record) => columns.map((column) => quote(cell(record[column]), delimiter)).join(delimiter)),
  ];
  return { csv: lines.join("\n"), rows: records.length, columns };
};
