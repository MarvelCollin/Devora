import type { ReactNode } from "react";
import { HiArrowsRightLeft, HiOutlineTrash } from "react-icons/hi2";
import { TextArea } from "../text-area/text-area";
import { Button } from "../button/button";
import { CopyButton } from "../copy-button/copy-button";
import { Notice } from "../notice/notice";

interface IConverterPanesProps {
  inputLabel: string;
  outputLabel: string;
  input: string;
  onInputChange: (value: string) => void;
  inputPlaceholder?: string;
  output: string;
  outputPlaceholder?: string;
  error?: string | null;
  onSwap?: () => void;
  swapLabel?: string;
  outputFooter?: ReactNode;
}

export const ConverterPanes = ({
  inputLabel,
  outputLabel,
  input,
  onInputChange,
  inputPlaceholder,
  output,
  outputPlaceholder,
  error,
  onSwap,
  swapLabel = "Swap",
  outputFooter,
}: IConverterPanesProps) => {
  return (
    <div
      className={
        onSwap
          ? "grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-5"
          : "grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:gap-6"
      }
    >
      <TextArea
        label={inputLabel}
        value={input}
        onChange={onInputChange}
        placeholder={inputPlaceholder}
        invalid={Boolean(error)}
        actions={
          <Button
            label="Clear"
            variant="ghost"
            size="sm"
            onClick={() => onInputChange("")}
            disabled={!input}
            icon={HiOutlineTrash}
          />
        }
      />

      {onSwap && (
        <div className="flex items-center justify-center lg:pt-10">
          <Button
            label={swapLabel}
            variant="secondary"
            size="sm"
            onClick={onSwap}
            disabled={!output}
            icon={HiArrowsRightLeft}
          />
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <TextArea
          label={outputLabel}
          value={output}
          readOnly
          placeholder={outputPlaceholder}
          actions={<CopyButton value={output} />}
          className="flex-1"
        />
        {error && <Notice tone="error">{error}</Notice>}
        {outputFooter}
      </div>
    </div>
  );
};
