"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, createGlobalStyle } from "styled-components";
import type { AppThemeName } from "./theme";
import { darkTheme, lightTheme } from "./theme";

const LS_THEME_KEY = "app_theme";

const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: ${(p: any) => (p.theme.name === "dark" ? "dark" : "light")};
  }

  body {
    margin: 0;
    background: ${(p: any) => p.theme.pageBg};
    color: ${(p: any) => p.theme.text};
  }
`;

const ThemeToggleContext = createContext<{
  themeName: AppThemeName;
  setThemeName: (t: AppThemeName) => void;
  toggle: () => void;
} | null>(null);

export function useAppTheme() {
  const ctx = useContext(ThemeToggleContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeClient");
  return ctx;
}

export function ThemeClient({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] = useState<AppThemeName>("light");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem(LS_THEME_KEY) as AppThemeName | null) : null;
    if (stored === "light" || stored === "dark") setThemeNameState(stored);
  }, []);

  function setThemeName(t: AppThemeName) {
    setThemeNameState(t);
    if (typeof window !== "undefined") localStorage.setItem(LS_THEME_KEY, t);
  }

  function toggle() {
    setThemeName(themeName === "dark" ? "light" : "dark");
  }

  const theme = useMemo(() => (themeName === "dark" ? darkTheme : lightTheme), [themeName]);

  return (
    <ThemeToggleContext.Provider value={{ themeName, setThemeName, toggle }}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </ThemeToggleContext.Provider>
  );
}
