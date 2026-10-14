export interface ICronField {
  name: string;
  raw: string;
  min: number;
  max: number;
  values: number[];
  wildcard: boolean;
}

export interface ICronSchedule {
  fields: ICronField[];
  expression: string;
}

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const SPECS = [
  { name: "Minute", min: 0, max: 59, names: null },
  { name: "Hour", min: 0, max: 23, names: null },
  { name: "Day of month", min: 1, max: 31, names: null },
  { name: "Month", min: 1, max: 12, names: MONTHS },
  { name: "Day of week", min: 0, max: 7, names: DAYS },
];

export const FIELD_RANGES = ["0 to 59", "0 to 23", "1 to 31", "1 to 12 or JAN to DEC", "0 to 6 or SUN to SAT, 7 is also Sunday"];

export const expandMacro = (expression: string): string =>
  MACROS[expression.trim().toLowerCase()] ?? expression.trim();

const toNumber = (token: string, spec: (typeof SPECS)[number]): number => {
  const upper = token.toUpperCase();
  if (spec.names) {
    const index = spec.names.indexOf(upper);
    if (index !== -1) return spec.name === "Month" ? index + 1 : index;
  }
  if (!/^\d+$/.test(token)) throw new Error(`"${token}" is not a valid ${spec.name.toLowerCase()} value.`);
  const value = Number(token);
  if (value < spec.min || value > spec.max) {
    throw new Error(`${spec.name} must be between ${spec.min} and ${spec.max}, but got ${value}.`);
  }
  return value;
};

const parseField = (raw: string, spec: (typeof SPECS)[number]): ICronField => {
  const quartz = raw
    .split(/[,/-]/)
    .some((token) => token.includes("#") || /^\d*L$/i.test(token) || /^\d+W$/i.test(token) || /^LW$/i.test(token));
  if (quartz) {
    throw new Error(`${spec.name} uses L, W or #. Those are Quartz extensions, so run times cannot be listed here.`);
  }
  const values = new Set<number>();
  for (const part of raw.split(",")) {
    if (!part) throw new Error(`${spec.name} has an empty item in its list.`);
    const [range, stepText] = part.split("/");
    const step = stepText === undefined ? 1 : Number(stepText);
    if (!Number.isInteger(step) || step < 1) throw new Error(`The step "/${stepText}" in ${spec.name.toLowerCase()} must be a whole number above 0.`);
    let start: number;
    let end: number;
    if (range === "*" || range === "?") {
      start = spec.min;
      end = spec.name === "Day of week" ? 6 : spec.max;
    } else if (range.includes("-")) {
      const [a, b] = range.split("-");
      start = toNumber(a, spec);
      end = toNumber(b, spec);
      if (end < start) throw new Error(`The range ${range} in ${spec.name.toLowerCase()} goes backwards.`);
    } else {
      start = toNumber(range, spec);
      end = stepText === undefined ? start : spec.name === "Day of week" ? 6 : spec.max;
    }
    for (let v = start; v <= end; v += step) values.add(spec.name === "Day of week" && v === 7 ? 0 : v);
  }
  return {
    name: spec.name,
    raw,
    min: spec.min,
    max: spec.max,
    values: [...values].sort((a, b) => a - b),
    wildcard: raw === "*" || raw === "?",
  };
};

export const parseCron = (input: string): ICronSchedule => {
  const expression = expandMacro(input);
  const parts = expression.split(/\s+/).filter(Boolean);
  if (parts.length !== 5) {
    throw new Error(
      `Standard cron has 5 fields: minute, hour, day of month, month and day of week. This has ${parts.length}.`
    );
  }
  return { expression, fields: parts.map((part, i) => parseField(part, SPECS[i])) };
};

export const nextRuns = (schedule: ICronSchedule, from: number, count: number, utc: boolean): Date[] => {
  const [minutes, hours, dom, months, dow] = schedule.fields;
  const restrictDom = !dom.wildcard;
  const restrictDow = !dow.wildcard;
  const start = new Date(from);
  const baseYear = utc ? start.getUTCFullYear() : start.getFullYear();
  const baseMonth = utc ? start.getUTCMonth() : start.getMonth();
  const baseDay = utc ? start.getUTCDate() : start.getDate();
  const results: Date[] = [];

  for (let offset = 0; offset < 366 * 5 && results.length < count; offset += 1) {
    const day = utc ? new Date(Date.UTC(baseYear, baseMonth, baseDay + offset)) : new Date(baseYear, baseMonth, baseDay + offset);
    const month = (utc ? day.getUTCMonth() : day.getMonth()) + 1;
    if (!months.values.includes(month)) continue;
    const date = utc ? day.getUTCDate() : day.getDate();
    const weekday = utc ? day.getUTCDay() : day.getDay();
    const domMatch = dom.values.includes(date);
    const dowMatch = dow.values.includes(weekday);
    const dayMatch = restrictDom && restrictDow ? domMatch || dowMatch : domMatch && dowMatch;
    if (!dayMatch) continue;
    for (const hour of hours.values) {
      for (const minute of minutes.values) {
        const y = utc ? day.getUTCFullYear() : day.getFullYear();
        const m = month - 1;
        const candidate = utc ? new Date(Date.UTC(y, m, date, hour, minute)) : new Date(y, m, date, hour, minute);
        if (!utc && (candidate.getHours() !== hour || candidate.getMinutes() !== minute)) continue;
        if (candidate.getTime() <= from) continue;
        results.push(candidate);
        if (results.length >= count) return results;
      }
    }
  }
  return results;
};
