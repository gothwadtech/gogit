import React, { createContext, useContext, useEffect, useState, useLayoutEffect } from 'react';
import { safeStorage } from '../utils/safeStorage';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'gothwad_github_theme';

const applyThemeToDOM = (isDarkMode: boolean) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;
  
  if (isDarkMode) {
    root.classList.add('dark');
    body?.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    body?.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = safeStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'dark'; // default to Google Dark #202124
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Calculate actual boolean
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';

  // Apply synchronously before paint
  useLayoutEffect(() => {
    applyThemeToDOM(isDark);
  }, [isDark]);

  // Listen to OS system color-scheme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
      if (theme === 'system') {
        applyThemeToDOM(e.matches);
      }
    };

    setSystemIsDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    safeStorage.setItem(THEME_STORAGE_KEY, newTheme);
    
    const willBeDark = newTheme === 'system' ? systemIsDark : newTheme === 'dark';
    applyThemeToDOM(willBeDark);
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
