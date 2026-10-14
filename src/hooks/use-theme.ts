import { createContext, useContext } from "react";

export type Theme = "dark" | "light";

export interface IThemeContext {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<IThemeContext>({
  theme: "light",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
