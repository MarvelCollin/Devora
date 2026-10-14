import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { HiOutlineBolt } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Notice } from "../../components/common/notice/notice";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";
import { ValueList } from "../../components/common/value-list/value-list";

interface IBatteryManager extends EventTarget {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

interface IBatteryState {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

interface ILogEntry {
  time: Date;
  text: string;
}

type Status = "loading" | "ready" | "unsupported";

const readBattery = (battery: IBatteryManager): IBatteryState => ({
  level: battery.level,
  charging: battery.charging,
  chargingTime: battery.chargingTime,
  dischargingTime: battery.dischargingTime,
});

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
};

const BatteryGraphic = ({ level, charging }: { level: number; charging: boolean }) => (
  <div className="flex items-center" aria-hidden="true">
    <div className="relative h-16 w-36 overflow-hidden rounded-lg border-2 border-line p-1">
      <div
        className={clsx(
          "h-full rounded-sm transition-[width] duration-500",
          level <= 0.15 ? "bg-danger" : level <= 0.3 ? "bg-warning" : "bg-primary"
        )}
        style={{ width: `${Math.max(3, level * 100)}%` }}
      />
      {charging && (
        <HiOutlineBolt className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-ink" />
      )}
    </div>
    <div className="h-6 w-1.5 rounded-r-sm bg-line" />
  </div>
);

const batteryApi = () =>
  (navigator as Navigator & { getBattery?: () => Promise<IBatteryManager> }).getBattery;

export const BatteryStatusPage = () => {
  const [status, setStatus] = useState<Status>(() => (typeof batteryApi() === "function" ? "loading" : "unsupported"));
  const [state, setState] = useState<IBatteryState | null>(null);
  const [log, setLog] = useState<ILogEntry[]>([]);

  useEffect(() => {
    const getBattery = batteryApi();
    if (typeof getBattery !== "function") return;
    let battery: IBatteryManager | null = null;
    let cancelled = false;
    const update = (event?: Event) => {
      if (!battery || cancelled) return;
      const next = readBattery(battery);
      setState(next);
      if (event?.type === "chargingchange") {
        setLog((previous) => [{ time: new Date(), text: next.charging ? "Charger connected" : "Charger disconnected" }, ...previous].slice(0, 20));
      } else if (event?.type === "levelchange") {
        setLog((previous) => [{ time: new Date(), text: `Charge changed to ${Math.round(next.level * 100)}%` }, ...previous].slice(0, 20));
      }
    };
    const events = ["levelchange", "chargingchange", "chargingtimechange", "dischargingtimechange"];
    getBattery
      .call(navigator)
      .then((manager) => {
        if (cancelled) return;
        battery = manager;
        events.forEach((name) => manager.addEventListener(name, update));
        update();
        setStatus("ready");
      })
      .catch(() => setStatus("unsupported"));
    return () => {
      cancelled = true;
      if (battery) events.forEach((name) => battery?.removeEventListener(name, update));
    };
  }, []);

  const level = state ? Math.round(state.level * 100) : 0;
  const toFull = state ? formatDuration(state.chargingTime) : null;
  const toEmpty = state ? formatDuration(state.dischargingTime) : null;
  const full = state?.charging && state.level >= 1;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;

  return (
    <ToolPage
      title="Battery Status"
      description="See your battery charge, whether it is charging and roughly how long it will last. Updates live while this page is open."
    >
      {status === "unsupported" && (
        <Notice tone="info">
          This browser does not share battery information. Firefox and Safari keep it private. Open this page in Chrome or
          Edge to see it.
        </Notice>
      )}

      {status === "loading" && (
        <div className="h-28 animate-pulse rounded-lg bg-surface" aria-hidden="true" />
      )}

      {status === "ready" && state && (
        <>
          <section aria-labelledby="battery-heading" className="flex flex-wrap items-center gap-8">
            <h2 id="battery-heading" className="sr-only">
              Battery
            </h2>
            <BatteryGraphic level={state.level} charging={state.charging} />
            <div>
              <p className="font-mono text-5xl font-semibold tabular-nums text-ink">{level}%</p>
              <p className={clsx("mt-1 font-medium", state.charging ? "text-success" : level <= 15 ? "text-danger" : "text-muted")}>
                {full ? "Fully charged" : state.charging ? "Charging" : level <= 15 ? "Low battery, plug in soon" : "On battery power"}
              </p>
            </div>
          </section>

          <SummaryStrip
            label="Battery times"
            items={[
              full
                ? { label: "Charge", value: "Complete", context: "You can unplug the charger", lead: true }
                : {
                    label: state.charging ? "Time to full" : "Time left",
                    value: (state.charging ? toFull : toEmpty) ?? "Estimating",
                    context:
                      (state.charging ? toFull : toEmpty) === null
                        ? "Browsers need a few minutes of use to estimate"
                        : "Estimated by your device",
                    lead: true,
                  },
              { label: "Power source", value: state.charging ? "Charger" : "Battery" },
            ]}
          />
        </>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="log-heading" className="flex flex-col gap-2">
          <h2 id="log-heading" className="text-sm font-medium text-ink">
            Changes while this page is open
          </h2>
          {log.length === 0 ? (
            <p className="rounded-lg border border-rule bg-surface px-4 py-6 text-sm text-muted">
              Plug in or unplug the charger and the change is listed here.
            </p>
          ) : (
            <ol className="rounded-lg border border-rule bg-raised">
              {log.map((entry, i) => (
                <li key={i} className="flex justify-between gap-4 border-b border-rule px-4 py-2.5 text-sm last:border-b-0">
                  <span className="text-ink">{entry.text}</span>
                  <span className="font-mono text-muted">{entry.time.toLocaleTimeString()}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section aria-labelledby="device-heading" className="flex flex-col gap-2">
          <h2 id="device-heading" className="text-sm font-medium text-ink">
            This device
          </h2>
          <ValueList
            rows={[
              { label: "CPU threads", value: String(navigator.hardwareConcurrency || "Unknown"), copy: false },
              ...(memory ? [{ label: "Memory", value: `About ${memory} GB`, copy: false, note: "Browsers round this down to protect privacy" }] : []),
              {
                label: "Reduced motion",
                value: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "On" : "Off",
                copy: false,
                mono: false,
              },
            ]}
          />
        </section>
      </div>
    </ToolPage>
  );
};
