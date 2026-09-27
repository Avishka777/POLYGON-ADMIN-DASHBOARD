'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'app_manager_theme';

interface ThemeContextType {
  theme: 'light' | 'dark';
  isLightTheme: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isLightTheme: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isLightTheme: theme === 'light',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
