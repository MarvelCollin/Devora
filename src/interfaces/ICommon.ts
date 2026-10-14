import type { ReactNode } from "react";
import type { IconType } from "react-icons";

export interface IButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: IconType;
  iconPosition?: "left" | "right";
  type?: "button" | "submit";
  ariaLabel?: string;
}

export interface ITextAreaProps {
  value: string;
  onChange?: (value: string) => void;
  label: string;
  hint?: ReactNode;
  actions?: ReactNode;
  placeholder?: string;
  readOnly?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  prose?: boolean;
  compact?: boolean;
}

export interface ITextInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint?: ReactNode;
  actions?: ReactNode;
  error?: string | null;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  size?: "md" | "lg";
  inputMode?: "text" | "numeric" | "decimal";
  className?: string;
}

export interface ISegmentOption<T extends string | number> {
  value: T;
  label: string;
}

export interface ISegmentedControlProps<T extends string | number> {
  label: string;
  hideLabel?: boolean;
  options: ISegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export interface ISwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export interface ISliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  valueText?: string;
  trackBackground?: string;
  hint?: ReactNode;
}
