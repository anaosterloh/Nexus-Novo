import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' | 'zinc';
type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('nexus-theme');
    return (saved as Theme) || 'emerald';
  });

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    const saved = localStorage.getItem('nexus-color-mode');
    return (saved as ColorMode) || 'system';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('nexus-theme', newTheme);
  };

  const setColorMode = (newMode: ColorMode) => {
    setColorModeState(newMode);
    localStorage.setItem('nexus-color-mode', newMode);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-emerald', 'theme-blue', 'theme-violet', 'theme-rose', 'theme-amber', 'theme-zinc');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (
      colorMode === 'dark' ||
      (colorMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [colorMode]);

  // Listen for system preference changes
  useEffect(() => {
    if (colorMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [colorMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorMode, setColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
