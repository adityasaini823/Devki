import React, { createContext, useContext, useMemo, useState } from 'react';

export type Theme = {
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    muted: string;
    // Additional colors for compatibility
    border?: string;
    accentSoft?: string;
    textPrimary?: string;
    textSecondary?: string;
    textMuted?: string;
    error?: string;
  };
};

const lightTheme: Theme = {
  colors: {
    primary: '#FF5C00',    // Purple matching login/signup
    background: '#F9FAFB', // Light gray background
    card: '#FFFFFF',       // White cards
    text: '#1F2937',       // Dark gray text
    muted: '#6B7280',      // Medium gray for secondary text
    // Additional colors
    border: '#E5E7EB',     // Light border color
    accentSoft: '#F3F4F6', // Soft accent background
    textPrimary: '#1F2937', // Primary text (same as text)
    textSecondary: '#6B7280', // Secondary text (same as muted)
    textMuted: '#9CA3AF',  // Muted text
    error: '#EF4444',      // Error/red color
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
