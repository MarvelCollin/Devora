import { useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  HiOutlineSignal,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineClock,
  HiOutlinePlay,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";
import { Button } from "../../components/common/button/button";

type TestStatus = "idle" | "running" | "success" | "error";

interface ITestResult {
  pingMs: number;
  jitterMs: number;
  downloadMbps: number;
  uploadMbps: number;
}

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const calculateJitter = (samples: number[]): number => {
  if (samples.length < 2) return 0;
  const diffs: number[] = [];
  for (let i = 1; i < samples.length; i += 1) {
    diffs.push(Math.abs(samples[i] - samples[i - 1]));
  }
  return average(diffs);
};

const measurePing = async (sampleCount: number): Promise<{ pingMs: number; jitterMs: number }> => {
  const samples: number[] = [];
  for (let i = 0; i < sampleCount; i += 1) {
    const url = `https://speed.cloudflare.com/cdn-cgi/trace?sample=${Date.now()}-${i}`;
    const start = performance.now();
    const response = await fetch(url, {
      cache: "no-store",
      mode: "cors",
    });
    if (!response.ok) {
      throw new Error("Ping request failed");
    }
    const end = performance.now();
    samples.push(end - start);
  }
  return {
    pingMs: roundToTwo(average(samples)),
    jitterMs: roundToTwo(calculateJitter(samples)),
  };
};

const measureDownload = async (): Promise<number> => {
  const bytes = 10_000_000;
  const url = `https://speed.cloudflare.com/__down?bytes=${bytes}&sample=${Date.now()}`;
  const start = performance.now();
  const response = await fetch(url, {
    cache: "no-store",
    mode: "cors",
  });
  if (!response.ok) {
    throw new Error("Download test failed");
  }
  const buffer = await response.arrayBuffer();
  const end = performance.now();
  const seconds = (end - start) / 1000;
  return roundToTwo((buffer.byteLength * 8) / seconds / 1_000_000);
};

const measureUpload = async (): Promise<number> => {
  const bytes = 2_500_000;
  const payload = new Uint8Array(bytes);
  crypto.getRandomValues(payload.subarray(0, Math.min(payload.length, 65_536)));
  const start = performance.now();
  const response = await fetch("https://speed.cloudflare.com/__up", {
    method: "POST",
    body: payload,
    cache: "no-store",
    mode: "no-cors",
  });
  if (!response) {
    throw new Error("Upload test failed");
  }
  const end = performance.now();
  const seconds = (end - start) / 1000;
  return roundToTwo((bytes * 8) / seconds / 1_000_000);
};

export const WifiSpeedTestPage = () => {
  const [status, setStatus] = useState<TestStatus>("idle");
  const [result, setResult] = useState<ITestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [stage, setStage] = useState("Ready");

  const isRunning = status === "running";

  const runTest = async () => {
    setStatus("running");
    setErrorMessage("");
    setStage("Testing ping and jitter...");

    try {
      const pingResult = await measurePing(5);

      setStage("Testing download speed...");
      const downloadMbps = await measureDownload();

      setStage("Testing upload speed...");
      const uploadMbps = await measureUpload();

      setResult({
        pingMs: pingResult.pingMs,
        jitterMs: pingResult.jitterMs,
        downloadMbps,
        uploadMbps,
      });
      setStatus("success");
      setStage("Completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Speed test failed";
      setStatus("error");
      setErrorMessage(message);
      setStage("Failed");
    }
  };

  const quality = useMemo(() => {
    if (!result) return "Not measured";
    if (result.downloadMbps >= 100 && result.uploadMbps >= 20 && result.pingMs <= 30) return "Excellent";
    if (result.downloadMbps >= 50 && result.uploadMbps >= 10 && result.pingMs <= 60) return "Good";
    if (result.downloadMbps >= 20 && result.uploadMbps >= 5 && result.pingMs <= 90) return "Fair";
    return "Basic";
  }, [result]);

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-600/10 text-accent-400">
            <HiOutlineSignal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">WiFi Speed Test</h2>
            <p className="text-sm text-dark-400">
              Measure latency, download speed, and upload speed in your browser
            </p>
          </div>
        </div>
        <Button
          label={isRunning ? "Running..." : result ? "Run Again" : "Start Test"}
          variant="primary"
          size="md"
          onClick={runTest}
          disabled={isRunning}
          icon={isRunning ? HiOutlineArrowPath : result ? HiOutlineArrowPath : HiOutlinePlay}
          className={clsx(isRunning && "animate-pulse")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold">Ping</span>
            <HiOutlineClock className="w-4 h-4 text-dark-500" />
          </div>
          <p className="text-2xl font-semibold text-dark-100">
            {result ? `${result.pingMs} ms` : "-"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold">Jitter</span>
            <HiOutlineClock className="w-4 h-4 text-dark-500" />
          </div>
          <p className="text-2xl font-semibold text-dark-100">
            {result ? `${result.jitterMs} ms` : "-"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold">Download</span>
            <HiOutlineArrowDownTray className="w-4 h-4 text-dark-500" />
          </div>
          <p className="text-2xl font-semibold text-dark-100">
            {result ? `${result.downloadMbps} Mbps` : "-"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold">Upload</span>
            <HiOutlineArrowUpTray className="w-4 h-4 text-dark-500" />
          </div>
          <p className="text-2xl font-semibold text-dark-100">
            {result ? `${result.uploadMbps} Mbps` : "-"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="xl:col-span-2 p-4 rounded-xl bg-dark-900 border border-dark-700">
          <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3 block">Status</span>
          <div className="flex items-center gap-2 mb-3">
            {status === "success" && <HiOutlineCheckCircle className="w-5 h-5 text-success-400" />}
            {status === "error" && <HiOutlineExclamationCircle className="w-5 h-5 text-error-400" />}
            {(status === "idle" || status === "running") && <HiOutlineSignal className="w-5 h-5 text-accent-400" />}
            <p className="text-sm text-dark-300">{stage}</p>
          </div>

          {status === "error" && (
            <div className="rounded-lg border border-error-500/30 bg-error-500/10 px-3 py-2 text-sm text-error-400">
              {errorMessage}
            </div>
          )}

          {status === "idle" && (
            <p className="text-sm text-dark-400">
              Press Start Test to run connection checks from this browser session.
            </p>
          )}

          {status === "success" && result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="rounded-lg border border-dark-700 bg-dark-800 px-3 py-2">
                <p className="text-xs uppercase tracking-wider text-dark-500 mb-1">Connection Quality</p>
                <p className="text-lg font-semibold text-accent-400">{quality}</p>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-800 px-3 py-2">
                <p className="text-xs uppercase tracking-wider text-dark-500 mb-1">Realtime Result</p>
                <p className="text-sm text-dark-200">
                  {`Down ${result.downloadMbps} Mbps | Up ${result.uploadMbps} Mbps | Ping ${result.pingMs} ms`}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-dark-700">
          <span className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3 block">Test Scope</span>
          <ul className="space-y-2 text-sm text-dark-300">
            <li>Ping and jitter are measured with repeated requests.</li>
            <li>Download speed uses a large binary transfer.</li>
            <li>Upload speed sends binary payload data.</li>
            <li>Values can vary by browser, network load, and VPN usage.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};