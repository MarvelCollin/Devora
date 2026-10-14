import type { ReactNode } from "react";
import { clsx } from "clsx";
import { CopyButton } from "../copy-button/copy-button";

export interface IValueRow {
  label: string;
  value: string;
  note?: ReactNode;
  copy?: boolean;
  mono?: boolean;
}

interface IValueListProps {
  rows: IValueRow[];
  className?: string;
}

export const ValueList = ({ rows, className = "" }: IValueListProps) => (
  <dl className={clsx("rounded-lg border border-rule bg-raised", className)}>
    {rows.map((row) => (
      <div
        key={row.label}
        className="flex flex-col gap-1 border-b border-rule px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-6"
      >
        <dt className="shrink-0 text-sm text-muted sm:w-44">{row.label}</dt>
        <dd className="min-w-0 flex-1">
          <span
            className={clsx(
              "block whitespace-pre-wrap text-ink [overflow-wrap:anywhere]",
              row.mono === false ? "text-sm" : "font-mono text-sm"
            )}
          >
            {row.value}
          </span>
          {row.note && <span className="mt-0.5 block text-xs text-muted">{row.note}</span>}
        </dd>
        {row.copy !== false && (
          <dd className="sm:self-center">
            <CopyButton value={row.value} />
          </dd>
        )}
      </div>
    ))}
  </dl>
);
