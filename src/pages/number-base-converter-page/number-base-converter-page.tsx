import { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextInput } from "../../components/common/text-input/text-input";
import { NumberField } from "../../components/common/number-field/number-field";
import { Switch } from "../../components/common/switch/switch";
import { Button } from "../../components/common/button/button";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";
import { usePersistentState } from "../../hooks/use-persistent-state";
import {
  BASE_NAMES,
  bitsNeeded,
  digitHint,
  fittingTypes,
  formatInBase,
  parseInBase,
} from "../../services/number-base-service";

interface IField {
  id: string;
  label: string;
  base: number;
  prefix?: string;
}

const FIXED_FIELDS: IField[] = [
  { id: "dec", label: "Decimal", base: 10 },
  { id: "hex", label: "Hexadecimal", base: 16, prefix: "0x" },
  { id: "bin", label: "Binary", base: 2, prefix: "0b" },
  { id: "oct", label: "Octal", base: 8, prefix: "0o" },
];

const describeChar = (value: bigint): string | null => {
  if (value < 32n || value > 0x10ffffn || (value >= 0xd800n && value <= 0xdfffn)) return null;
  const code = Number(value);
  return `${String.fromCodePoint(code)}  U+${code.toString(16).toUpperCase().padStart(4, "0")}`;
};

export const NumberBaseConverterPage = () => {
  const [stored, setStored] = usePersistentState("number-base:value", "255");
  const [customBase, setCustomBase] = usePersistentState("number-base:custom", 36);
  const [group, setGroup] = usePersistentState("number-base:group", false);
  const [uppercase, setUppercase] = usePersistentState("number-base:uppercase", true);
  const [draft, setDraft] = useState<{ id: string; text: string } | null>(null);

  const value = parseInBase(stored, 10);
  const fields: IField[] = [...FIXED_FIELDS, { id: "custom", label: `Base ${customBase}`, base: customBase }];

  const handleChange = (field: IField, text: string) => {
    setDraft({ id: field.id, text });
    if (text.trim() === "") {
      setStored("");
      return;
    }
    const parsed = parseInBase(text, field.base);
    if (parsed !== null) setStored(parsed.toString());
  };

  const displayFor = (field: IField) => {
    if (draft?.id === field.id) return draft.text;
    return value === null ? "" : formatInBase(value, field.base, { group, uppercase });
  };

  const errorFor = (field: IField) => {
    if (draft?.id !== field.id || !draft.text.trim()) return null;
    if (parseInBase(draft.text, field.base) !== null) return null;
    const name = BASE_NAMES[field.base] ?? `base ${field.base}`;
    return `That is not a valid ${name} number. ${digitHint(field.base)}`;
  };

  const types = value === null ? [] : fittingTypes(value);
  const char = value === null ? null : describeChar(value);

  return (
    <ToolPage
      title="Number Base Converter"
      description="Type a number in any base and every other base updates. Very large and negative numbers work too."
      actions={
        <Button
          label="Clear"
          variant="ghost"
          icon={HiOutlineTrash}
          onClick={() => {
            setDraft(null);
            setStored("");
          }}
          disabled={value === null}
        />
      }
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Switch label="Group digits" checked={group} onChange={setGroup} />
        <Switch label="Uppercase letters" checked={uppercase} onChange={setUppercase} />
      </div>

      <div className="grid max-w-5xl gap-x-8 gap-y-5 lg:grid-cols-2">
        {fields.map((field) => {
          const shown = value === null ? "" : formatInBase(value, field.base, { group: false, uppercase });
          return (
            <div key={field.id} onBlur={() => setDraft(null)} className="flex flex-col gap-3">
              {field.id === "custom" && (
                <NumberField label="Custom base" value={customBase} onChange={setCustomBase} min={2} max={36} />
              )}
              <TextInput
                label={field.label}
                value={displayFor(field)}
                onChange={(text) => handleChange(field, text)}
                prefix={field.prefix}
                error={errorFor(field)}
                actions={<CopyButton value={shown} />}
              />
            </div>
          );
        })}
      </div>

      {value !== null && (
        <SummaryStrip
          label="Number details"
          items={[
            {
              label: "Bits needed",
              value: bitsNeeded(value).toLocaleString(),
              context: value < 0n ? "In two's complement" : "Without a sign bit",
              lead: true,
            },
            { label: "Bytes", value: Math.ceil(bitsNeeded(value) / 8).toLocaleString() },
            {
              label: "Fits in",
              value: types.length > 0 ? types.slice(0, 2).join(", ") : "Over 128 bits",
              context: types.length > 2 ? `and ${types.length - 2} larger types` : undefined,
            },
            ...(char ? [{ label: "Character", value: char }] : []),
          ]}
        />
      )}
    </ToolPage>
  );
};
