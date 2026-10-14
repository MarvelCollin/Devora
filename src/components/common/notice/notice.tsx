import type { ReactNode } from "react";
import { clsx } from "clsx";
import {
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
} from "react-icons/hi2";

interface INoticeProps {
  tone?: "error" | "success" | "info";
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

const TONES = {
  error: {
    icon: HiOutlineExclamationTriangle,
    className: "bg-danger-tint text-danger",
  },
  success: {
    icon: HiOutlineCheckCircle,
    className: "bg-success-tint text-success",
  },
  info: {
    icon: HiOutlineInformationCircle,
    className: "bg-surface text-muted",
  },
};

export const Notice = ({
  tone = "info",
  children,
  action,
  className = "",
}: INoticeProps) => {
  const { icon: Icon, className: toneClass } = TONES[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-4 py-3 text-sm",
        toneClass,
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
};
