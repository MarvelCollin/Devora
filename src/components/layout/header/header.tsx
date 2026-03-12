import { HiOutlineCommandLine, HiOutlineSun, HiOutlineMoon } from "react-icons/hi2";
import { clsx } from "clsx";
import { useTheme } from "../../../hooks/use-theme";

interface IHeaderProps {
  title: string;
  onHomeClick: () => void;
}

export const Header = ({ title, onHomeClick }: IHeaderProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800 sticky top-0 z-50">
      <button
        onClick={onHomeClick}
        className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 shadow-lg shadow-accent-600/20">
          <HiOutlineCommandLine className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-dark-100 tracking-tight">
          DevTools
        </span>
      </button>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 text-dark-400 hover:text-dark-100 hover:bg-dark-800"
        >
          {theme === "dark" ? (
            <HiOutlineSun className="w-5 h-5" />
          ) : (
            <HiOutlineMoon className="w-5 h-5" />
          )}
        </button>
        <div className="h-4 w-px bg-dark-700" />
        <h1
          className={clsx(
            "text-sm font-medium text-dark-400",
            title !== "Home" && "text-dark-300"
          )}
        >
          {title}
        </h1>
      </div>
    </header>
  );
};
