import { clsx } from "clsx";
import { useState } from "react";
import {
  HiOutlinePlay,
  HiArrowPath,
  HiOutlineCheckCircle,
  HiOutlineMinusCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";
import { Notice } from "../../components/common/notice/notice";

type Step = "ping" | "download" | "upload";
type Status = "idle" | "running" | "done" | "error";

interface IResult {
  pingMs?: number;
  jitterMs?: number;
  downloadMbps?: number;
  uploadMbps?: number;
}

const STEPS: { id: Step; label: string; detail: string }[] = [
  { id: "ping", label: "Ping and jitter", detail: "5 small requests" },
  { id: "download", label: "Download", detail: "10 MB transfer" },
  { id: "upload", label: "Upload", detail: "2.5 MB transfer" },
];

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const measurePing = async (sampleCount: number) => {
  const samples: number[] = [];
  for (let i = 0; i < sampleCount; i += 1) {
    const start = performance.now();
    const response = await fetch(
      `https://speed.cloudflare.com/cdn-cgi/trace?sample=${Date.now()}-${i}`,
      { cache: "no-store", mode: "cors" }
    );
    if (!response.ok) throw new Error("ping");
    samples.push(performance.now() - start);
  }
  const diffs = samples.slice(1).map((sample, i) => Math.abs(sample - samples[i]));
  return { pingMs: roundToTwo(average(samples)), jitterMs: roundToTwo(average(diffs)) };
};

const measureDownload = async (): Promise<number> => {
  const start = performance.now();
  const response = await fetch(
    `https://speed.cloudflare.com/__down?bytes=10000000&sample=${Date.now()}`,
    { cache: "no-store", mode: "cors" }
  );
  if (!response.ok) throw new Error("download");
  const buffer = await response.arrayBuffer();
  const seconds = (performance.now() - start) / 1000;
  return roundToTwo((buffer.byteLength * 8) / seconds / 1_000_000);
};

const measureUpload = async (): Promise<number> => {
  const bytes = 2_500_000;
  const payload = new Uint8Array(bytes);
  crypto.getRandomValues(payload.subarray(0, 65_536));
  const start = performance.now();
  await fetch("https://speed.cloudflare.com/__up", {
    method: "POST",
    body: payload,
    cache: "no-store",
    mode: "no-cors",
  });
  const seconds = (performance.now() - start) / 1000;
  return roundToTwo((bytes * 8) / seconds / 1_000_000);
};

const rateConnection = (result: Required<IResult>) => {
  if (result.downloadMbps >= 100 && result.uploadMbps >= 20 && result.pingMs <= 30)
    return { label: "Excellent", note: "Fast enough for 4K streaming, large downloads and video calls on many devices." };
  if (result.downloadMbps >= 50 && result.uploadMbps >= 10 && result.pingMs <= 60)
    return { label: "Good", note: "Comfortable for HD streaming, video calls and most online games." };
  if (result.downloadMbps >= 20 && result.uploadMbps >= 5 && result.pingMs <= 90)
    return { label: "Fair", note: "Fine for browsing and HD video. Calls may stutter when others share the line." };
  return { label: "Basic", note: "Good for browsing and email. Streaming and calls may buffer." };
};

const StepRow = ({ label, detail, state }: { label: string; detail: string; state: "waiting" | "running" | "done" | "failed" }) => {
  const icon = {
    waiting: <HiOutlineMinusCircle className="h-5 w-5 text-muted" aria-hidden="true" />,
    running: <HiArrowPath className="h-5 w-5 animate-spin text-strong" aria-hidden="true" />,
    done: <HiOutlineCheckCircle className="h-5 w-5 text-success" aria-hidden="true" />,
    failed: <HiOutlineExclamationTriangle className="h-5 w-5 text-danger" aria-hidden="true" />,
  }[state];
  const stateText = { waiting: "Waiting", running: "Running", done: "Done", failed: "Failed" }[state];
  return (
    <li className="flex items-center gap-3 py-2">
      {icon}
      <span className="min-w-0 flex-1">
        <span className={clsx("block text-sm", state === "running" ? "font-semibold text-ink" : "text-ink")}>
          {label}
        </span>
        <span className="block text-xs text-muted">{detail}</span>
      </span>
      <span
        className={clsx(
          "text-sm",
          state === "done" && "text-success",
          state === "failed" && "text-danger",
          state === "running" && "font-medium text-strong",
          state === "waiting" && "text-muted"
        )}
      >
        {stateText}
      </span>
    </li>
  );
};

export const WifiSpeedTestPage = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState<Step | null>(null);
  const [result, setResult] = useState<IResult>({});

  const runTest = async () => {
    setStatus("running");
    setResult({});
    try {
      setStep("ping");
      const ping = await measurePing(5);
      setResult((prev) => ({ ...prev, ...ping }));
      setStep("download");
      const downloadMbps = await measureDownload();
      setResult((prev) => ({ ...prev, downloadMbps }));
      setStep("upload");
      const uploadMbps = await measureUpload();
      setResult((prev) => ({ ...prev, uploadMbps }));
      setStep(null);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const stepState = (id: Step): "waiting" | "running" | "done" | "failed" => {
    const order = STEPS.findIndex((s) => s.id === id);
    const current = step ? STEPS.findIndex((s) => s.id === step) : -1;
    if (status === "done") return "done";
    if (status === "idle") return "waiting";
    if (order < current) return "done";
    if (order === current) return status === "error" ? "failed" : "running";
    return "waiting";
  };

  const measured = (value: number | undefined, unit: string, id: Step) => {
    if (value !== undefined) return `${value} ${unit}`;
    if (status === "running" && stepState(id) === "running") {
      return (
        <>
          <span className="inline-block h-7 w-24 animate-pulse rounded bg-surface align-middle" aria-hidden="true" />
          <span className="sr-only">Measuring</span>
        </>
      );
    }
    return <span className="font-sans text-base font-normal text-muted">Not measured</span>;
  };

  const rating =
    status === "done" &&
    result.pingMs !== undefined &&
    result.jitterMs !== undefined &&
    result.downloadMbps !== undefined &&
    result.uploadMbps !== undefined
      ? rateConnection(result as Required<IResult>)
      : null;

  const running = status === "running";

  return (
    <ToolPage
      title="WiFi Speed Test"
      description="Measure the connection of this browser to the nearest Cloudflare server. The test takes about 10 to 30 seconds."
      actions={
        <Button
          label={running ? "Testing" : status === "idle" ? "Start test" : "Run again"}
          variant="primary"
          icon={status === "idle" ? HiOutlinePlay : HiArrowPath}
          onClick={runTest}
          loading={running}
        />
      }
    >
      <SummaryStrip
        label="Speed test results"
        items={[
          {
            label: "Download",
            value: measured(result.downloadMbps, "Mbps", "download"),
            context: rating ? `Connection quality: ${rating.label}` : "Megabits per second",
            lead: true,
          },
          { label: "Upload", value: measured(result.uploadMbps, "Mbps", "upload") },
          {
            label: "Ping",
            value: measured(result.pingMs, "ms", "ping"),
            context: "Lower is better",
          },
          { label: "Jitter", value: measured(result.jitterMs, "ms", "ping") },
        ]}
      />

      {status === "error" && (
        <Notice
          tone="error"
          action={<Button label="Try again" variant="secondary" size="sm" onClick={runTest} />}
        >
          The test could not reach the speed test server. Check that you are online and that an
          ad blocker or VPN is not blocking speed.cloudflare.com.
        </Notice>
      )}

      {rating && (
        <p className="max-w-prose text-ink">
          <span className="font-semibold">{rating.label}.</span> {rating.note}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="steps-heading">
          <h2 id="steps-heading" className="mb-1 text-sm font-medium text-ink">
            Progress
          </h2>
          <ol className="divide-y divide-rule border-y border-rule" aria-live="polite">
            {STEPS.map((s) => (
              <StepRow key={s.id} label={s.label} detail={s.detail} state={stepState(s.id)} />
            ))}
          </ol>
        </section>

        <section aria-labelledby="about-heading">
          <h2 id="about-heading" className="mb-2 text-sm font-medium text-ink">
            About this test
          </h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
            <li>Ping is the average time of five small requests. Jitter is how much that time varies.</li>
            <li>Download and upload send real data, so the test uses about 12.5 MB.</li>
            <li>Results change with network load, distance to the server and VPN use.</li>
          </ul>
        </section>
      </div>
    </ToolPage>
  );
};
