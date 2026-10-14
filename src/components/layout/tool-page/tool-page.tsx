import type { ReactNode } from "react";
import { clsx } from "clsx";

interface IToolPageProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
  fill?: boolean;
}

export const ToolPage = ({
  title,
  description,
  actions,
  children,
  fill = false,
}: IToolPageProps) => {
  return (
    <div
      className={clsx(
        "mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-10 lg:py-8",
        fill && "lg:h-full"
      )}
    >
      <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1
            id="page-title"
            tabIndex={-1}
            className="font-mono text-2xl font-semibold tracking-tight text-ink"
          >
            {title}
          </h1>
          <p className="mt-1 max-w-prose text-muted">{description}</p>
        </div>
        {actions && (
          <div className="flex flex-wrap items-end gap-3">{actions}</div>
        )}
      </header>
      <div className={clsx("flex flex-col gap-6", fill && "lg:min-h-0 lg:flex-1")}>
        {children}
      </div>
    </div>
  );
};
