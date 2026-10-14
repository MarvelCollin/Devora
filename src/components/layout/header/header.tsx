import type { RefObject } from "react";
import { HiOutlineBars3 } from "react-icons/hi2";
import { routeHref } from "../../../hooks/use-hash-route";

interface IHeaderProps {
  menuOpen: boolean;
  onMenuClick: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}

export const Header = ({ menuOpen, onMenuClick, menuButtonRef }: IHeaderProps) => {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-rule bg-surface px-4 lg:hidden">
      <a
        href={routeHref(null)}
        className="inline-flex items-baseline gap-1 rounded-md font-mono text-lg font-semibold tracking-tight text-ink"
      >
        devora<span className="text-strong">/</span>
      </a>
      <button
        ref={menuButtonRef}
        type="button"
        onClick={onMenuClick}
        aria-expanded={menuOpen}
        aria-controls="nav-drawer"
        className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-raised px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-tint"
      >
        <HiOutlineBars3 className="h-5 w-5" aria-hidden="true" />
        Menu
      </button>
    </header>
  );
};
