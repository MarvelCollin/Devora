import { useId, useMemo, useState } from "react";
import { HiOutlineMagnifyingGlass, HiXMark } from "react-icons/hi2";
import type { ITool } from "../../interfaces/ITool";
import { TOOL_GROUPS } from "../../constants/tools";
import { routeHref } from "../../hooks/use-hash-route";
import { useRecentTools } from "../../hooks/use-recent-tools";
import { searchTools } from "../../utils/tool-search";
import { SHORTCUT_LABEL } from "../../utils/platform";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";

interface IHomePageProps {
  tools: ITool[];
}

const ToolList = ({ tools }: { tools: ITool[] }) => (
  <ul className="grid border-t border-rule sm:grid-cols-2 sm:gap-x-8 xl:grid-cols-3">
    {tools.map((tool) => {
      const Icon = tool.icon;
      return (
        <li key={tool.id} className="border-b border-rule">
          <a
            href={routeHref(tool.id)}
            className="group -mx-3 flex items-start gap-3 rounded-md px-3 py-3.5 transition-colors duration-150 ease-out hover:bg-tint"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-strong" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block font-medium text-ink group-hover:underline group-hover:underline-offset-4">
                {tool.name}
              </span>
              <span className="block text-sm text-muted">{tool.description}</span>
            </span>
          </a>
        </li>
      );
    })}
  </ul>
);

export const HomePage = ({ tools }: IHomePageProps) => {
  const [query, setQuery] = useState("");
  const searchId = useId();
  const recentIds = useRecentTools();
  const searching = query.trim() !== "";

  const results = useMemo(() => searchTools(tools, query), [tools, query]);
  const recent = recentIds
    .map((id) => tools.find((tool) => tool.id === id))
    .filter((tool): tool is ITool => Boolean(tool))
    .slice(0, 3);

  return (
    <ToolPage
      title="Developer tools"
      description="Small utilities for everyday dev work. Everything runs in your browser and your text and files stay on this device."
    >
      <div className="flex max-w-xl flex-col gap-2">
        <label htmlFor={searchId} className="text-sm font-medium text-ink">
          Find a tool
        </label>
        <div className="flex h-11 items-center gap-2 rounded-lg border border-line bg-raised px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
          <HiOutlineMagnifyingGlass className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try json, password or webcam"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-ink placeholder:text-muted/80 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-muted hover:bg-tint hover:text-ink"
            >
              <HiXMark className="h-4 w-4" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          {searching
            ? `${results.length} of ${tools.length} tools match`
            : `${tools.length} tools in ${TOOL_GROUPS.length} groups. Press ${SHORTCUT_LABEL} on any page to jump to a tool.`}
        </p>
      </div>

      {searching ? (
        results.length === 0 ? (
          <div className="flex flex-col items-start gap-3 border-t border-rule pt-6">
            <p className="text-ink">No tool matches "{query.trim()}".</p>
            <p className="text-sm text-muted">
              Search by what the tool does, like encode, compress, generate or test.
            </p>
            <Button label="Clear search" onClick={() => setQuery("")} />
          </div>
        ) : (
          <section aria-labelledby="results-heading">
            <h2 id="results-heading" className="mb-1 font-mono text-sm font-semibold text-strong">
              Best matches
            </h2>
            <ToolList tools={results} />
          </section>
        )
      ) : (
        <div className="flex flex-col gap-8">
          {recent.length > 0 && (
            <section aria-labelledby="recent-heading">
              <h2 id="recent-heading" className="mb-1 font-mono text-sm font-semibold text-strong">
                Recently used
              </h2>
              <ToolList tools={recent} />
            </section>
          )}
          {TOOL_GROUPS.map((group) => {
            const groupTools = tools.filter((tool) => tool.group === group);
            if (groupTools.length === 0) return null;
            const headingId = `home-${group.replace(/\s+/g, "-").toLowerCase()}`;
            return (
              <section key={group} aria-labelledby={headingId}>
                <h2 id={headingId} className="mb-1 font-mono text-sm font-semibold text-strong">
                  {group}
                </h2>
                <ToolList tools={groupTools} />
              </section>
            );
          })}
        </div>
      )}
    </ToolPage>
  );
};
