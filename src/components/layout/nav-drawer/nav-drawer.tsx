import { useEffect, useRef } from "react";
import { HiXMark } from "react-icons/hi2";
import type { ITool } from "../../../interfaces/ITool";
import { Sidebar } from "../sidebar/sidebar";
import { useFocusTrap } from "../../../hooks/use-focus-trap";

interface INavDrawerProps {
  open: boolean;
  onClose: () => void;
  tools: ITool[];
  activeTool: string | null;
}

export const NavDrawer = ({ open, onClose, tools, activeTool }: INavDrawerProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(panelRef, open, onClose);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => {
      if (query.matches) onClose();
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div
        className="absolute inset-0 animate-fade-in bg-scrim"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id="nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-3rem))] animate-drawer-in flex-col bg-surface shadow-pop"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted transition-colors duration-150 hover:bg-tint hover:text-ink"
        >
          <HiXMark className="h-5 w-5" aria-hidden="true" />
          Close
        </button>
        <Sidebar tools={tools} activeTool={activeTool} onNavigate={onClose} />
      </div>
    </div>
  );
};
