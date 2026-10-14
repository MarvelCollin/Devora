import { useMemo } from "react";
import cronstrue from "cronstrue";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextInput } from "../../components/common/text-input/text-input";
import { Button } from "../../components/common/button/button";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { Notice } from "../../components/common/notice/notice";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { useNow } from "../../hooks/use-now";
import { FIELD_RANGES, expandMacro, nextRuns, parseCron } from "../../services/cron-service";
import { formatRelative, getTimezoneLabel } from "../../utils/date-utils";

type Zone = "local" | "utc";

const ZONE_OPTIONS: { value: Zone; label: string }[] = [
  { value: "local", label: "Local time" },
  { value: "utc", label: "UTC" },
];

const PRESETS = [
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Weekdays at 9", value: "0 9 * * 1-5" },
  { label: "Every Sunday", value: "0 0 * * 0" },
  { label: "First of the month", value: "0 0 1 * *" },
];

const describeField = (raw: string, name: string): string => {
  if (raw === "*" || raw === "?") return `Every ${name.toLowerCase()}`;
  if (raw.startsWith("*/")) return `Every ${raw.slice(2)} ${name.toLowerCase()}s`;
  if (raw.includes(",")) return `Only ${raw.split(",").join(", ")}`;
  if (raw.includes("-")) return `From ${raw.replace("-", " to ").replace("/", " every ")}`;
  return `Only ${raw}`;
};

const formatRun = (date: Date, utc: boolean) =>
  date.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: utc ? "UTC" : undefined,
  });

export const CronExplainerPage = () => {
  const [expression, setExpression] = usePersistentState("cron:expression", "*/15 9-17 * * 1-5");
  const [zone, setZone] = usePersistentState<Zone>("cron:zone", "local");
  const now = useNow(30000);

  const description = useMemo(() => {
    if (!expression.trim()) return null;
    try {
      return cronstrue.toString(expandMacro(expression), {
        use24HourTimeFormat: true,
        throwExceptionOnParseError: true,
        verbose: true,
      });
    } catch {
      return null;
    }
  }, [expression]);

  const parsed = useMemo(() => {
    if (!expression.trim()) return null;
    try {
      return { schedule: parseCron(expression), error: null };
    } catch (error) {
      return { schedule: null, error: error instanceof Error ? error.message : "This cron expression is not valid." };
    }
  }, [expression]);

  const runs = useMemo(
    () => (parsed?.schedule ? nextRuns(parsed.schedule, now, 8, zone === "utc") : []),
    [parsed, now, zone]
  );

  const fieldError = parsed?.error && !description ? parsed.error : null;

  return (
    <ToolPage
      title="Cron Explainer"
      description="Read any cron expression in plain words and see exactly when it will run next."
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="Cron expression"
          hint="minute hour day month weekday"
          value={expression}
          onChange={setExpression}
          size="lg"
          placeholder="*/15 9-17 * * 1-5"
          error={fieldError}
        />
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Start from:</span>
          {PRESETS.map((preset) => (
            <Button
              key={preset.value}
              label={preset.label}
              variant="ghost"
              size="sm"
              onClick={() => setExpression(preset.value)}
            />
          ))}
        </div>
      </div>

      {description && (
        <p className="border-y border-rule py-5 text-xl leading-relaxed font-medium text-ink sm:text-2xl" aria-live="polite">
          {description}
        </p>
      )}

      {parsed?.error && description && <Notice tone="info">{parsed.error}</Notice>}

      {parsed?.schedule && (
        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="fields-heading" className="flex flex-col gap-2">
            <h2 id="fields-heading" className="flex min-h-8 items-center text-sm font-medium text-ink">
              Fields
            </h2>
            <dl className="rounded-lg border border-rule bg-raised">
              {parsed.schedule.fields.map((field, i) => (
                <div key={field.name} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 border-b border-rule px-4 py-3 last:border-b-0">
                  <dt className="text-sm text-muted">{field.name}</dt>
                  <dd className="min-w-0">
                    <span className="font-mono text-sm font-semibold text-strong">{field.raw}</span>
                    <span className="ml-3 text-sm text-ink">{describeField(field.raw, field.name)}</span>
                    <span className="mt-0.5 block text-xs text-muted">Allowed: {FIELD_RANGES[i]}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="runs-heading" className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="runs-heading" className="flex min-h-8 items-center text-sm font-medium text-ink">
                Next runs
              </h2>
              <SegmentedControl label="Show times in" hideLabel options={ZONE_OPTIONS} value={zone} onChange={setZone} />
            </div>
            {runs.length === 0 ? (
              <p className="rounded-lg border border-rule bg-surface px-4 py-6 text-sm text-muted">
                This schedule never runs in the next five years. Check the day and month, like 31 in a 30 day month.
              </p>
            ) : (
              <ol className="rounded-lg border border-rule bg-raised">
                {runs.map((run, i) => (
                  <li key={run.getTime()} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule px-4 py-2.5 last:border-b-0">
                    <span className="font-mono text-sm tabular-nums text-ink">
                      <span className="mr-3 text-muted">{i + 1}</span>
                      {formatRun(run, zone === "utc")}
                    </span>
                    <span className="text-sm text-muted">{formatRelative(run, now)}</span>
                  </li>
                ))}
              </ol>
            )}
            <p className="text-sm text-muted">
              {zone === "utc" ? "Times are in UTC." : `Times are in your timezone, ${getTimezoneLabel()}.`} Most
              servers run cron in UTC unless configured otherwise.
            </p>
          </section>
        </div>
      )}
    </ToolPage>
  );
};
