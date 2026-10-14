import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { HiArrowPath, HiOutlineSun, HiOutlineMoon } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { DateTimeField } from "../../components/common/date-time-field/date-time-field";
import { Combobox } from "../../components/common/combobox/combobox";
import type { IComboOption } from "../../components/common/combobox/combobox";
import { Button } from "../../components/common/button/button";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { formatDateTime, parseWallTime } from "../../utils/date-utils";
import {
  dayDifference,
  getAllZones,
  getLocalZone,
  isValidZone,
  offsetLabel,
  partOfDay,
  wallTimeToInstant,
  zoneCity,
  zoneParts,
  zoneRegion,
} from "../../services/timezone-service";

const DEFAULT_ZONES = ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney"];

const PART_LABELS = {
  night: "Night",
  morning: "Early morning",
  work: "Working hours",
  evening: "Evening",
};

const pad = (value: number) => String(value).padStart(2, "0");

const wallText = (instant: number, zone: string) => {
  const p = zoneParts(instant, zone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
};

const offsetMinutes = (instant: number, zone: string) => {
  const label = offsetLabel(instant, zone);
  const match = label.match(/UTC([+-])(\d+)(?::(\d+))?/);
  if (!match) return 0;
  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] ?? 0));
};

export const TimezoneConverterPage = () => {
  const [sourceZone, setSourceZone] = usePersistentState("timezone:source", getLocalZone(), "local");
  const [targets, setTargets] = usePersistentState<string[]>("timezone:targets", DEFAULT_ZONES, "local");
  const [openedAt] = useState(() => Date.now());
  const [text, setText] = useState(() => formatDateTime(new Date(openedAt)));

  const zones = useMemo(() => getAllZones(), []);
  const options: IComboOption[] = useMemo(
    () =>
      zones.map((zone) => ({
        value: zone,
        label: zoneCity(zone),
        hint: `${zoneRegion(zone) || "Zone"}, ${offsetLabel(openedAt, zone)}`,
      })),
    [zones, openedAt]
  );

  const safeSource = isValidZone(sourceZone) ? sourceZone : "UTC";
  const wall = parseWallTime(text);
  const instant = wall ? wallTimeToInstant(wall, safeSource) : null;
  const validTargets = targets.filter(isValidZone);

  const rows =
    instant === null || wall === null
      ? []
      : validTargets
          .map((zone) => {
            const parts = zoneParts(instant, zone);
            return { zone, parts, offset: offsetMinutes(instant, zone), shift: dayDifference(wall, parts) };
          })
          .sort((a, b) => a.offset - b.offset);

  const addZone = (zone: string) => {
    if (!targets.includes(zone)) setTargets([...targets, zone]);
  };

  return (
    <ToolPage
      title="Timezone Converter"
      description="Pick a time in one place and see it everywhere else. Daylight saving time is handled for every date."
    >
      <div className="grid gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] lg:items-start">
        <DateTimeField
          label="Date and time"
          hint={`In ${zoneCity(safeSource)}`}
          value={text}
          onChange={setText}
          error={text.trim() && !wall ? "Use the format YYYY-MM-DD HH:mm, like 2026-10-14 09:30." : null}
        />
        <Combobox label="Time zone" options={options} value={safeSource} onChange={setSourceZone} />
        <div className="lg:pt-10">
          <Button
            label="Use current time"
            variant="secondary"
            icon={HiArrowPath}
            onClick={() => setText(wallText(Date.now(), safeSource))}
          />
        </div>
      </div>

      <section aria-labelledby="zones-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="zones-heading" className="text-sm font-medium text-ink">
            Same moment in {rows.length} {rows.length === 1 ? "place" : "places"}
          </h2>
          <p className="text-sm text-muted">Sorted from west to east</p>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-rule bg-surface px-4 py-6 text-muted">
            {wall ? "Add a time zone below to compare." : "Enter a valid date and time to compare zones."}
          </p>
        ) : (
          <ul className="rounded-lg border border-rule bg-raised">
            {rows.map(({ zone, parts, shift }) => {
              const part = partOfDay(parts.hour);
              const PartIcon = part === "night" ? HiOutlineMoon : HiOutlineSun;
              const time = `${pad(parts.hour)}:${pad(parts.minute)}`;
              const date = `${parts.weekday} ${parts.day} ${new Date(Date.UTC(parts.year, parts.month - 1, 1)).toLocaleString(undefined, { month: "short", timeZone: "UTC" })}`;
              const isSource = zone === safeSource;
              return (
                <li
                  key={zone}
                  className={clsx(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-rule px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.3fr)_9rem_minmax(0,1fr)_auto]",
                    isSource && "bg-tint"
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {zoneCity(zone)}
                      {isSource && <span className="ml-2 text-sm font-normal text-strong">Your input</span>}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {zoneRegion(zone)}
                      {zoneRegion(zone) ? ", " : ""}
                      {offsetLabel(instant ?? openedAt, zone)}
                    </p>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="font-mono text-2xl font-semibold tabular-nums text-ink">{time}</p>
                    <p className="text-sm text-muted">
                      {date}
                      {shift !== 0 && (
                        <span className="ml-1.5 font-medium text-accent-strong">
                          {shift > 0 ? `+${shift} day` : `${shift} day`}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    <PartIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {PART_LABELS[part]}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    <CopyButton value={`${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${time} ${zone}`} />
                    <Button
                      label="Remove"
                      ariaLabel={`Remove ${zoneCity(zone)}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => setTargets(targets.filter((item) => item !== zone))}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="max-w-md">
          <Combobox
            label="Add a time zone"
            options={options.filter((option) => !targets.includes(option.value))}
            value={null}
            onChange={addZone}
            placeholder="Search a city, like Jakarta or Berlin"
            clearOnSelect
          />
        </div>
      </section>
    </ToolPage>
  );
};
