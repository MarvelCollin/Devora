import type { IconType } from "react-icons";

export type ToolGroup = "Text and data" | "Time and color" | "Images" | "Hardware and network";

export interface ITool {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  group: ToolGroup;
  keywords: string[];
}
