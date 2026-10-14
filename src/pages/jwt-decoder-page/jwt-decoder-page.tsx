import { useMemo, useState } from "react";
import {
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineClock,
  HiOutlineBeaker,
} from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { Notice } from "../../components/common/notice/notice";
import { CodeBlock } from "../../components/common/code-block/code-block";
import { ValueList } from "../../components/common/value-list/value-list";
import type { IValueRow } from "../../components/common/value-list/value-list";
import { formatDateTime, formatRelative } from "../../utils/date-utils";
import { useNow } from "../../hooks/use-now";

type JsonObject = Record<string, unknown>;

interface IDecoded {
  parts: string[];
  header: JsonObject;
  payload: JsonObject;
}

const ALGORITHMS: Record<string, string> = {
  HS256: "HMAC with SHA-256",
  HS384: "HMAC with SHA-384",
  HS512: "HMAC with SHA-512",
  RS256: "RSA with SHA-256",
  RS384: "RSA with SHA-384",
  RS512: "RSA with SHA-512",
  ES256: "ECDSA P-256 with SHA-256",
  ES384: "ECDSA P-384 with SHA-384",
  ES512: "ECDSA P-521 with SHA-512",
  PS256: "RSA-PSS with SHA-256",
  EdDSA: "Edwards curve signature",
  none: "No signature",
};

const CLAIMS: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  exp: "Expires",
  nbf: "Not valid before",
  iat: "Issued at",
  jti: "Token ID",
};

const DATE_CLAIMS = new Set(["exp", "nbf", "iat"]);

const base64UrlDecode = (segment: string): string => {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
};

const base64UrlEncode = (text: string): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const decodeSegment = (segment: string, name: string): JsonObject => {
  let text: string;
  try {
    text = base64UrlDecode(segment);
  } catch {
    throw new Error(`The ${name} is not valid Base64URL. Check that the token was copied completely.`);
  }
  try {
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed as JsonObject;
  } catch {
    throw new Error(`The ${name} decodes, but it is not a JSON object.`);
  }
};

const decodeToken = (token: string): IDecoded => {
  const cleaned = token.trim().replace(/^Bearer\s+/i, "");
  const parts = cleaned.split(".");
  if (parts.length !== 3) {
    throw new Error(
      `A JWT has three parts separated by dots. This text has ${parts.length} ${parts.length === 1 ? "part" : "parts"}.`
    );
  }
  return {
    parts,
    header: decodeSegment(parts[0], "header"),
    payload: decodeSegment(parts[1], "payload"),
  };
};

const buildExample = (): string => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: "https://auth.example.com",
    sub: "user_1024",
    name: "Ada Lovelace",
    role: "admin",
    iat: now,
    exp: now + 3600,
  };
  return [
    base64UrlEncode(JSON.stringify(header)),
    base64UrlEncode(JSON.stringify(payload)),
    "c2lnbmF0dXJlLW5vdC1jaGVja2VkLWhlcmU",
  ].join(".");
};

const describeValue = (key: string, value: unknown, nowMs: number): IValueRow => {
  const label = `${CLAIMS[key]} (${key})`;
  if (DATE_CLAIMS.has(key) && typeof value === "number") {
    const date = new Date(value * 1000);
    return { label, value: formatDateTime(date), note: `${formatRelative(date, nowMs)}, Unix ${value}` };
  }
  return { label, value: typeof value === "string" ? value : JSON.stringify(value) };
};

const TokenStatus = ({ payload, nowMs }: { payload: JsonObject; nowMs: number }) => {
  const now = nowMs / 1000;
  const exp = typeof payload.exp === "number" ? payload.exp : null;
  const nbf = typeof payload.nbf === "number" ? payload.nbf : null;

  if (nbf !== null && now < nbf) {
    return (
      <p className="flex items-center gap-2 text-warning">
        <HiOutlineClock className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">Not active yet.</span> Usable{" "}
          {formatRelative(new Date(nbf * 1000), nowMs)}.
        </span>
      </p>
    );
  }
  if (exp !== null && now >= exp) {
    return (
      <p className="flex items-center gap-2 text-danger">
        <HiOutlineExclamationTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">Expired</span> {formatRelative(new Date(exp * 1000), nowMs)}.
        </span>
      </p>
    );
  }
  if (exp !== null) {
    return (
      <p className="flex items-center gap-2 text-success">
        <HiOutlineCheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">Not expired.</span> Expires{" "}
          {formatRelative(new Date(exp * 1000), nowMs)}.
        </span>
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 text-muted">
      <HiOutlineClock className="h-5 w-5 shrink-0" aria-hidden="true" />
      This token has no expiry time.
    </p>
  );
};

export const JwtDecoderPage = () => {
  const [token, setToken] = useState("");
  const nowMs = useNow();

  const result = useMemo(() => {
    if (!token.trim()) return null;
    try {
      return { decoded: decodeToken(token), error: null };
    } catch (error) {
      return { decoded: null, error: error instanceof Error ? error.message : "This token could not be read." };
    }
  }, [token]);

  const decoded = result?.decoded ?? null;
  const algorithm = typeof decoded?.header.alg === "string" ? decoded.header.alg : null;
  const claimRows = decoded
    ? Object.keys(CLAIMS)
        .filter((key) => key in decoded.payload)
        .map((key) => describeValue(key, decoded.payload[key], nowMs))
    : [];

  return (
    <ToolPage
      title="JWT Decoder"
      description="Paste a JSON Web Token to read its header, payload and expiry. The token is decoded on this device and is not saved."
      actions={
        <Button
          label="Load an example"
          variant="secondary"
          icon={HiOutlineBeaker}
          onClick={() => setToken(buildExample())}
        />
      }
    >
      <TextArea
        label="Token"
        value={token}
        onChange={setToken}
        compact
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        invalid={Boolean(result?.error)}
        actions={
          <Button
            label="Clear"
            variant="ghost"
            size="sm"
            onClick={() => setToken("")}
            disabled={!token}
            icon={HiOutlineTrash}
          />
        }
      />

      {result?.error && <Notice tone="error">{result.error}</Notice>}

      {decoded && (
        <>
          <section aria-labelledby="token-parts-heading" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="token-parts-heading" className="text-sm font-medium text-ink">
                Token parts
              </h2>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Legend">
                <li className="flex items-center gap-2 text-strong">
                  <span className="h-0.5 w-4 bg-strong" aria-hidden="true" />
                  Header
                </li>
                <li className="flex items-center gap-2 text-accent-strong">
                  <span className="h-0.5 w-4 bg-accent-strong" aria-hidden="true" />
                  Payload
                </li>
                <li className="flex items-center gap-2 text-muted">
                  <span className="h-0.5 w-4 bg-muted" aria-hidden="true" />
                  Signature
                </li>
              </ul>
            </div>
            <p className="rounded-lg border border-rule bg-surface px-4 py-3 font-mono text-sm leading-relaxed [overflow-wrap:anywhere]">
              <span className="text-strong underline decoration-2 underline-offset-4">{decoded.parts[0]}</span>
              <span className="text-ink">.</span>
              <span className="text-accent-strong underline decoration-2 underline-offset-4">{decoded.parts[1]}</span>
              <span className="text-ink">.</span>
              <span className="text-muted underline decoration-dotted decoration-2 underline-offset-4">
                {decoded.parts[2] || "(empty)"}
              </span>
            </p>
            <TokenStatus payload={decoded.payload} nowMs={nowMs} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <CodeBlock
              label="Header"
              hint={algorithm ? `${algorithm}, ${ALGORITHMS[algorithm] ?? "unknown algorithm"}` : undefined}
              code={JSON.stringify(decoded.header, null, 2)}
            />
            <CodeBlock
              label="Payload"
              hint={`${Object.keys(decoded.payload).length} claims`}
              code={JSON.stringify(decoded.payload, null, 2)}
            />
          </div>

          {claimRows.length > 0 && (
            <section aria-labelledby="claims-heading" className="flex flex-col gap-2">
              <h2 id="claims-heading" className="text-sm font-medium text-ink">
                Registered claims
              </h2>
              <ValueList rows={claimRows} />
            </section>
          )}

          <Notice tone="info">
            The signature is shown but not verified. Anyone can read a JWT, so never put secrets
            in its payload.
          </Notice>
        </>
      )}
    </ToolPage>
  );
};
