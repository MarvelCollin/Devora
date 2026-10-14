import { HiCheck, HiOutlineClipboardDocument } from "react-icons/hi2";
import { Button } from "../button/button";
import { useClipboard } from "../../../hooks/use-clipboard";

interface ICopyButtonProps {
  value: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}

export const CopyButton = ({
  value,
  label = "Copy",
  variant = "ghost",
  className,
}: ICopyButtonProps) => {
  const { copied, copy } = useClipboard();

  return (
    <>
      <Button
        label={copied ? "Copied" : label}
        variant={variant}
        size="sm"
        onClick={() => copy(value)}
        disabled={!value}
        icon={copied ? HiCheck : HiOutlineClipboardDocument}
        className={className}
      />
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
};
