import type { ReactNode } from "react";
import { useId } from "react";
import { CopyButton } from "../copy-button/copy-button";

interface ICodeBlockProps {
  label: string;
  code: string;
  hint?: ReactNode;
  copy?: boolean;
}

export const CodeBlock = ({ label, code, hint, copy = true }: ICodeBlockProps) => {
  const labelId = useId();

  return (
    <section aria-labelledby={labelId} className="flex min-w-0 flex-col gap-2">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-center gap-3">
          <h2 id={labelId} className="text-sm font-medium text-ink">
            {label}
          </h2>
          {hint && <span className="text-sm text-muted">{hint}</span>}
        </div>
        {copy && <CopyButton value={code} />}
      </div>
      <pre
        tabIndex={0}
        role="region"
        aria-labelledby={labelId}
        className="max-h-96 overflow-auto rounded-lg border border-rule bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-ink"
      >
        {code}
      </pre>
    </section>
  );
};
