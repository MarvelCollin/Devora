import type { IconType } from "react-icons";

export interface IButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  icon?: IconType;
  iconPosition?: "left" | "right";
}

export interface ITextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  className?: string;
  label?: string;
}

export interface IToolCardProps {
  title: string;
  description: string;
  icon: IconType;
  onClick: () => void;
}
