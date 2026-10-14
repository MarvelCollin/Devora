import type { IconType } from "react-icons";

export type ToolGroup =
  | "Format and convert"
  | "Encode and decode"
  | "Text and generators"
  | "Time and color"
  | "Images"
  | "Input devices"
  | "Screen and sound"
  | "Network and system";

export interface ITool {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  group: ToolGroup;
  keywords: string[];
}
