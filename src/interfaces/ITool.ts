import type { IconType } from "react-icons";

export interface ITool {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  path: string;
}

export interface IToolState {
  activeTool: string | null;
  tools: ITool[];
}
