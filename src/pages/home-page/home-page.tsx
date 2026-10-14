import { useId, useMemo, useState } from "react";
import { HiOutlineMagnifyingGlass, HiXMark } from "react-icons/hi2";
import type { ITool } from "../../interfaces/ITool";
import { TOOL_GROUPS } from "../../constants/tools";
import { routeHref } from "../../hooks/use-hash-route";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";

interface IHomePageProps {
  tools: ITool[];
}

const matches = (tool: ITool, query: string) => {
  const haystack = [tool.name, tool.description, ...tool.keywords]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
};

export const HomePage = ({ tools }: IHomePageProps) => {
  const [query, setQuery] = useState("");
  const searchId = useId();

  const filtered = useMemo(
    () => (query.trim() ? tools.filter((tool) => matches(tool, query)) : tools),
    [tools, query]
  );

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
            placeholder="Try json, hash or image"
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
          {query.trim()
            ? `${filtered.length} of ${tools.length} tools match`
            : `${tools.length} tools in ${TOOL_GROUPS.length} groups`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-start gap-3 border-t border-rule pt-6">
          <p className="text-ink">No tool matches "{query.trim()}".</p>
          <p className="text-sm text-muted">
            Check the spelling or search by what the tool does, like encode or compress.
          </p>
          <Button label="Clear search" onClick={() => setQuery("")} />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {TOOL_GROUPS.map((group) => {
            const groupTools = filtered.filter((tool) => tool.group === group);
            if (groupTools.length === 0) return null;
            const headingId = `home-${group.replace(/\s+/g, "-").toLowerCase()}`;
            return (
              <section key={group} aria-labelledby={headingId}>
                <h2
                  id={headingId}
                  className="mb-1 font-mono text-sm font-semibold text-strong"
                >
                  {group}
                </h2>
                <ul className="grid border-t border-rule sm:grid-cols-2 sm:gap-x-8 xl:grid-cols-3">
                  {groupTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <li key={tool.id} className="border-b border-rule">
                        <a
                          href={routeHref(tool.id)}
                          className="group -mx-3 flex items-start gap-3 rounded-md px-3 py-3.5 transition-colors duration-150 ease-out hover:bg-tint"
                        >
                          <Icon
                            className="mt-0.5 h-5 w-5 shrink-0 text-strong"
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <span className="block font-medium text-ink group-hover:underline group-hover:underline-offset-4">
                              {tool.name}
                            </span>
                            <span className="block text-sm text-muted">
                              {tool.description}
                            </span>
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </ToolPage>
  );
};
