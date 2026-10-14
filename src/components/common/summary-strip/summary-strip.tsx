import type { ReactNode } from "react";
import { clsx } from "clsx";

export interface ISummaryItem {
  label: string;
  value: ReactNode;
  context?: ReactNode;
  lead?: boolean;
}

interface ISummaryStripProps {
  items: ISummaryItem[];
  label?: string;
  className?: string;
}

export const SummaryStrip = ({ items, label, className = "" }: ISummaryStripProps) => {
  return (
    <dl
      aria-label={label}
      className={clsx(
        "flex flex-wrap items-end gap-x-8 gap-y-5 border-y border-rule py-5",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={clsx("flex min-w-0 flex-col", item.lead && "mr-4")}
        >
          <dt className="text-sm text-muted">{item.label}</dt>
          <dd
            className={clsx(
              "font-mono font-semibold tabular-nums text-ink",
              item.lead ? "text-4xl leading-tight" : "text-xl leading-snug"
            )}
          >
            {item.value}
          </dd>
          {item.context && (
            <dd className="mt-0.5 text-sm text-muted">{item.context}</dd>
          )}
        </div>
      ))}
    </dl>
  );
};
