import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export const MIN_FONT_SCALE = 80;
export const MAX_FONT_SCALE = 150;
export const DEFAULT_FONT_SCALE = 100;

interface ThemeContextType {
  /** Page font size as a percentage of the browser default (80-150). */
  fontScale: number;
  setFontScale: (scale: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const readStorage = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const writeStorage = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [fontScale, setFontScaleState] = useState<number>(() => {
    const saved = Number(readStorage('fontScale'));
    return saved >= MIN_FONT_SCALE && saved <= MAX_FONT_SCALE ? saved : DEFAULT_FONT_SCALE;
  });

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Everything is sized in rem, so changing the root font size scales the whole app.
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
    writeStorage('fontScale', String(fontScale));
  }, [fontScale]);

  const setFontScale = (scale: number) => {
    setFontScaleState(Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, Math.round(scale))));
  };

  return (
    <ThemeContext.Provider value={{ fontScale, setFontScale }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return { ...context, isDark: true };
}
