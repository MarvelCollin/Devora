import { clsx } from "clsx";
import { HiOutlineSquares2X2, HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import type { ITool } from "../../../interfaces/ITool";
import { TOOL_GROUPS } from "../../../constants/tools";
import { routeHref } from "../../../hooks/use-hash-route";
import { useTheme } from "../../../hooks/use-theme";

interface ISidebarProps {
  tools: ITool[];
  activeTool: string | null;
  onNavigate?: () => void;
}

const linkClass = (active: boolean) =>
  clsx(
    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 ease-out",
    active
      ? "bg-tint font-semibold text-strong before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-primary"
      : "text-muted hover:bg-tint hover:text-ink"
  );

export const Sidebar = ({ tools, activeTool, onNavigate }: ISidebarProps) => {
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === "dark" ? HiOutlineSun : HiOutlineMoon;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-5 pb-4 pt-5">
        <a
          href={routeHref(null)}
          onClick={onNavigate}
          className="inline-flex items-baseline gap-1 rounded-md font-mono text-lg font-semibold tracking-tight text-ink"
        >
          devora<span className="text-strong">/</span>
        </a>
        <p className="mt-0.5 text-sm text-muted">Tools that stay in your browser</p>
      </div>

      <nav aria-label="Tools" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <a
          href={routeHref(null)}
          onClick={onNavigate}
          aria-current={activeTool === null ? "page" : undefined}
          className={linkClass(activeTool === null)}
        >
          <HiOutlineSquares2X2 className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          All tools
        </a>

        {TOOL_GROUPS.map((group) => {
          const groupTools = tools.filter((tool) => tool.group === group);
          if (groupTools.length === 0) return null;
          const headingId = `nav-${group.replace(/\s+/g, "-").toLowerCase()}`;
          return (
            <div key={group} className="mt-5">
              <h2 id={headingId} className="px-3 pb-1.5 text-xs font-medium text-muted">
                {group}
              </h2>
              <ul aria-labelledby={headingId} className="flex flex-col gap-0.5">
                {groupTools.map((tool) => {
                  const Icon = tool.icon;
                  const active = activeTool === tool.id;
                  return (
                    <li key={tool.id}>
                      <a
                        href={routeHref(tool.id)}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={linkClass(active)}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        <span className="truncate">{tool.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-rule px-3 py-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted transition-colors duration-150 ease-out hover:bg-tint hover:text-ink"
        >
          <ThemeIcon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        </button>
      </div>
    </div>
  );
};
