import { clsx } from "clsx";
import type { ITool } from "../../../interfaces/ITool";
import { HiHome } from "react-icons/hi2";

interface ISidebarProps {
  tools: ITool[];
  activeTool: string | null;
  onToolSelect: (toolId: string) => void;
  onHomeClick: () => void;
}

export const Sidebar = ({
  tools,
  activeTool,
  onToolSelect,
  onHomeClick,
}: ISidebarProps) => {
  return (
    <aside className="w-64 min-w-64 bg-dark-900/50 border-r border-dark-800 flex flex-col">
      <div className="p-3">
        <button
          onClick={onHomeClick}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            activeTool === null
              ? "bg-accent-600/10 text-accent-400"
              : "text-dark-400 hover:text-dark-200 hover:bg-dark-800"
          )}
        >
          <HiHome className="w-5 h-5" />
          <span className="text-sm font-medium">Home</span>
        </button>
      </div>
      <div className="px-3 py-2">
        <span className="px-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
          Tools
        </span>
      </div>
      <nav className="flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left",
                isActive
                  ? "bg-accent-600/10 text-accent-400 shadow-sm"
                  : "text-dark-400 hover:text-dark-200 hover:bg-dark-800"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{tool.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
