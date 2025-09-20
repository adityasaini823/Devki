import React, { createContext, useContext, useMemo, useState } from 'react';

export type Theme = {
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    muted: string;
  };
};

const lightTheme: Theme = {
  colors: {
    primary: '#035afc',    
    background: '#f4f4f4',
    card: '#ffffff',
    text: '#000000',
    muted: '#666666',
  },
};

type ThemeContextValue = {
  theme: Theme;
  setPrimary: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(lightTheme);

  const setPrimary = (color: string) => {
    setTheme((t) => ({ ...t, colors: { ...t.colors, primary: color } }));
  };

  const value = useMemo(() => ({ theme, setPrimary }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
