import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { clsx } from "clsx";
import { HiOutlineArrowUpTray } from "react-icons/hi2";
import { Button } from "../button/button";

interface IDropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title: string;
  activeTitle: string;
  subtitle?: string;
  buttonLabel: string;
  className?: string;
}

export const DropZone = ({
  onFiles,
  accept = "image/*",
  multiple = false,
  title,
  activeTitle,
  subtitle = "or pick from your device",
  buttonLabel,
  className = "",
}: IDropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={clsx(
        "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors duration-150",
        dragging ? "border-primary bg-tint" : "border-line bg-surface",
        className
      )}
    >
      <HiOutlineArrowUpTray className="h-6 w-6 text-strong" aria-hidden="true" />
      <p className="font-medium text-ink">{dragging ? activeTitle : title}</p>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      <Button
        label={buttonLabel}
        variant="secondary"
        size="sm"
        onClick={() => inputRef.current?.click()}
        className="mt-2"
      />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFiles(files);
          event.target.value = "";
        }}
      />
    </div>
  );
};
