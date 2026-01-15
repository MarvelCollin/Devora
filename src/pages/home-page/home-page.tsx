import type { ITool } from "../../interfaces/ITool";
import { ToolCard } from "../../components/common/tool-card/tool-card";

interface IHomePageProps {
  tools: ITool[];
  onToolSelect: (toolId: string) => void;
}

export const HomePage = ({ tools, onToolSelect }: IHomePageProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-dark-100 mb-3 tracking-tight">
            Developer Tools
          </h2>
          <p className="text-dark-400 text-lg">
            Powerful utilities to streamline your development workflow
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              title={tool.name}
              description={tool.description}
              icon={tool.icon}
              onClick={() => onToolSelect(tool.id)}
            />
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-sm text-dark-500">
            More tools coming soon
          </p>
        </div>
      </div>
    </div>
  );
};
