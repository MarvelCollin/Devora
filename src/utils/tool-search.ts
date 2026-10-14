import type { ITool } from "../interfaces/ITool";

const scoreTool = (tool: ITool, terms: string[]): number => {
  const name = tool.name.toLowerCase();
  const keywords = tool.keywords.join(" ").toLowerCase();
  const description = tool.description.toLowerCase();
  let total = 0;
  for (const term of terms) {
    if (name.startsWith(term)) total += 8;
    else if (name.split(/[\s/]+/).some((word) => word.startsWith(term))) total += 6;
    else if (name.includes(term)) total += 4;
    else if (keywords.includes(term)) total += 3;
    else if (description.includes(term)) total += 1;
    else return 0;
  }
  return total;
};

export const searchTools = (tools: ITool[], query: string): ITool[] => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return tools;
  return tools
    .map((tool) => ({ tool, score: scoreTool(tool, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.tool);
};
