import { useEffect, useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { TextArea } from "../../components/common/text-area/text-area";
import { Button } from "../../components/common/button/button";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { Switch } from "../../components/common/switch/switch";
import { usePersistentState } from "../../hooks/use-persistent-state";

type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const ALGORITHMS: { id: HashAlgorithm; note: string }[] = [
  { id: "SHA-1", note: "Legacy, not safe for security" },
  { id: "SHA-256", note: "Most common choice" },
  { id: "SHA-384", note: "Truncated SHA-512" },
  { id: "SHA-512", note: "Longest digest" },
];

const computeHash = async (text: string, algorithm: HashAlgorithm): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const HashGeneratorPage = () => {
  const [input, setInput] = usePersistentState("hash:input", "");
  const [computed, setComputed] = useState<{
    source: string;
    values: Partial<Record<HashAlgorithm, string>>;
  }>({ source: "", values: {} });
  const [uppercase, setUppercase] = usePersistentState("hash:uppercase", false);

  useEffect(() => {
    if (input === "") return;
    let cancelled = false;
    Promise.all(ALGORITHMS.map(({ id }) => computeHash(input, id))).then((values) => {
      if (cancelled) return;
      setComputed({
        source: input,
        values: Object.fromEntries(ALGORITHMS.map(({ id }, index) => [id, values[index]])),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  const hashes: Partial<Record<HashAlgorithm, string>> =
    input !== "" && computed.source === input ? computed.values : {};

  return (
    <ToolPage
      title="Hash Generator"
      description="Hashes update as you type. The text is hashed as UTF-8 and never leaves your browser."
      actions={
        <Switch label="Uppercase output" checked={uppercase} onChange={setUppercase} />
      }
    >
      <TextArea
        label="Text to hash"
        value={input}
        onChange={setInput}
        placeholder="Type or paste text"
        compact
        hint={input ? `${input.length.toLocaleString()} characters` : undefined}
        actions={
          <Button
            label="Clear"
            variant="ghost"
            size="sm"
            onClick={() => setInput("")}
            disabled={!input}
            icon={HiOutlineTrash}
          />
        }
      />

      <section aria-labelledby="hash-results-heading" className="flex flex-col gap-2">
        <h2 id="hash-results-heading" className="text-sm font-medium text-ink">
          Hashes
        </h2>
        <ul className="rounded-lg border border-rule bg-raised">
          {ALGORITHMS.map(({ id, note }) => {
            const raw = hashes[id] ?? "";
            const value = uppercase ? raw.toUpperCase() : raw;
            return (
              <li
                key={id}
                className="flex flex-col gap-2 border-b border-rule px-4 py-3 last:border-b-0 sm:flex-row sm:items-start sm:gap-6"
              >
                <div className="w-32 shrink-0">
                  <p className="font-mono text-sm font-semibold text-strong">{id}</p>
                  <p className="text-xs text-muted">{note}</p>
                </div>
                <p className="min-w-0 flex-1 font-mono text-sm leading-relaxed break-all text-ink">
                  {value || <span className="text-muted">Waiting for text</span>}
                </p>
                <CopyButton value={value} className="self-start" />
              </li>
            );
          })}
        </ul>
      </section>
    </ToolPage>
  );
};
