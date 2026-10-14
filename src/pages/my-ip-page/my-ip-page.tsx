import { useCallback, useEffect, useState } from "react";
import { HiArrowPath, HiOutlineSignal, HiOutlineSignalSlash } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { Notice } from "../../components/common/notice/notice";
import { ValueList } from "../../components/common/value-list/value-list";
import type { IValueRow } from "../../components/common/value-list/value-list";

type Trace = Record<string, string>;

interface INetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

const connection = (): INetworkInformation | undefined =>
  (navigator as Navigator & { connection?: INetworkInformation }).connection;

const fetchTrace = async (): Promise<Trace> => {
  const response = await fetch(`https://speed.cloudflare.com/cdn-cgi/trace?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("trace");
  const text = await response.text();
  return Object.fromEntries(
    text
      .trim()
      .split("\n")
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at), line.slice(at + 1)];
      })
  );
};

const countryName = (code: string) => {
  try {
    return new Intl.DisplayNames(undefined, { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

const ipVersion = (ip: string) => (ip.includes(":") ? "IPv6" : "IPv4");

const browserRows = (): IValueRow[] => {
  const info = connection();
  const rows: IValueRow[] = [];
  if (info?.effectiveType) {
    rows.push({
      label: "Connection type",
      value: `${info.effectiveType.toUpperCase()} class${info.type ? `, ${info.type}` : ""}`,
      note: "How fast the browser thinks this connection is, not the actual network technology",
      copy: false,
      mono: false,
    });
  }
  if (info?.downlink !== undefined) {
    rows.push({ label: "Estimated speed", value: `${info.downlink} Mbps`, copy: false, note: "Browsers round this value" });
  }
  if (info?.rtt !== undefined) rows.push({ label: "Estimated latency", value: `${info.rtt} ms`, copy: false });
  if (info?.saveData) rows.push({ label: "Data saver", value: "On", copy: false, mono: false });
  rows.push({ label: "Language", value: navigator.languages.join(", "), copy: false });
  rows.push({ label: "Timezone", value: Intl.DateTimeFormat().resolvedOptions().timeZone, copy: false });
  rows.push({ label: "User agent", value: navigator.userAgent });
  return rows;
};

export const MyIpPage = () => {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [browser, setBrowser] = useState<IValueRow[]>(browserRows);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setTrace(await fetchTrace());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setBrowser(browserRows());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchTrace()
      .then((result) => {
        if (!cancelled) setTrace(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const update = () => {
      setOnline(navigator.onLine);
      setBrowser(browserRows());
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    connection()?.addEventListener?.("change", update);
    return () => {
      cancelled = true;
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      connection()?.removeEventListener?.("change", update);
    };
  }, []);

  const ip = trace?.ip ?? "";
  const traceRows: IValueRow[] = trace
    ? [
        { label: "Country", value: trace.loc ? `${countryName(trace.loc)} (${trace.loc})` : "Unknown", copy: false, mono: false },
        {
          label: "Nearest data center",
          value: trace.colo ?? "Unknown",
          note: "Cloudflare location code, usually the nearest airport",
          copy: false,
        },
        { label: "HTTP version", value: trace.http?.toUpperCase().replace("HTTP/", "HTTP ") ?? "Unknown", copy: false },
        { label: "TLS version", value: trace.tls ?? "Unknown", copy: false },
        ...(trace.kex ? [{ label: "Key exchange", value: trace.kex, copy: false }] : []),
        {
          label: "Cloudflare WARP",
          value: trace.warp === "on" || trace.warp === "plus" ? "On" : "Off",
          copy: false,
          mono: false,
        },
      ]
    : [];

  return (
    <ToolPage
      title="My IP and Connection"
      description="See the public IP address websites see for you, plus details about this connection."
      actions={<Button label="Check again" variant="secondary" icon={HiArrowPath} onClick={load} loading={loading} />}
    >
      <section aria-labelledby="ip-heading" className="flex flex-col gap-2 border-y border-rule py-6">
        <h2 id="ip-heading" className="text-sm text-muted">
          Your public IP address
        </h2>
        {loading && !trace ? (
          <>
            <span className="h-10 w-72 max-w-full animate-pulse rounded-md bg-surface" aria-hidden="true" />
            <span className="sr-only">Loading</span>
          </>
        ) : ip ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-3xl font-semibold tracking-tight text-ink [overflow-wrap:anywhere] sm:text-4xl">
              {ip}
            </p>
            <CopyButton value={ip} variant="secondary" />
          </div>
        ) : (
          <p className="text-xl text-muted">Not available</p>
        )}
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {ip && <span>{ipVersion(ip)} address</span>}
          <span className={online ? "flex items-center gap-1.5 text-success" : "flex items-center gap-1.5 text-danger"}>
            {online ? (
              <HiOutlineSignal className="h-4 w-4" aria-hidden="true" />
            ) : (
              <HiOutlineSignalSlash className="h-4 w-4" aria-hidden="true" />
            )}
            {online ? "Online" : "Offline"}
          </span>
        </p>
      </section>

      {error && (
        <Notice tone="error" action={<Button label="Try again" variant="secondary" size="sm" onClick={load} />}>
          Your IP could not be looked up. Check that you are online and that an ad blocker is not blocking
          speed.cloudflare.com.
        </Notice>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="route-heading" className="flex flex-col gap-2">
          <h2 id="route-heading" className="text-sm font-medium text-ink">
            Route to the internet
          </h2>
          {traceRows.length > 0 ? (
            <ValueList rows={traceRows} />
          ) : (
            <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-rule" aria-hidden="true">
              {[0, 1, 2, 3].map((row) => (
                <span key={row} className="h-12 animate-pulse bg-surface" />
              ))}
            </div>
          )}
        </section>
        <section aria-labelledby="browser-heading" className="flex flex-col gap-2">
          <h2 id="browser-heading" className="text-sm font-medium text-ink">
            What your browser reports
          </h2>
          <ValueList rows={browser} />
        </section>
      </div>

      <p className="text-sm text-muted">
        This page asks Cloudflare's public trace service for your address. Nothing is stored. A VPN or proxy will show its
        own address instead of yours.
      </p>
    </ToolPage>
  );
};
