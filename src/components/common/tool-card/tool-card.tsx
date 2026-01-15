import type { IToolCardProps } from "../../../interfaces/ICommon";
import { HiArrowRight } from "react-icons/hi2";

export const ToolCard = ({
  title,
  description,
  icon: Icon,
  onClick,
}: IToolCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col p-6 rounded-2xl border border-dark-700 bg-dark-900/50 backdrop-blur-sm transition-all duration-300 hover:border-accent-500/50 hover:bg-dark-800/50 hover:shadow-xl hover:shadow-accent-600/5 text-left"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-600/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-accent-600/20 to-accent-500/10 text-accent-400">
            <Icon className="w-6 h-6" />
          </div>
          <HiArrowRight className="w-5 h-5 text-dark-500 transition-all duration-300 group-hover:text-accent-400 group-hover:translate-x-1" />
        </div>
        <h3 className="text-lg font-semibold text-dark-100 mb-2">{title}</h3>
        <p className="text-sm text-dark-400 leading-relaxed">{description}</p>
      </div>
    </button>
  );
};
