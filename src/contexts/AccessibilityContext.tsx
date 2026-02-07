import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type ColorblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
type TextSize = 100 | 110 | 120 | 130 | 140 | 150;

interface AccessibilityContextType {
  theme: Theme;
  colorblindMode: ColorblindMode;
  textSize: TextSize;
  setTheme: (theme: Theme) => void;
  setColorblindMode: (mode: ColorblindMode) => void;
  setTextSize: (size: TextSize) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [colorblindMode, setColorblindModeState] = useState<ColorblindMode>('none');
  const [textSize, setTextSizeState] = useState<TextSize>(100);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Apply colorblind mode
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('colorblind-deuteranopia', 'colorblind-protanopia', 'colorblind-tritanopia');
    if (colorblindMode !== 'none') {
      root.classList.add(`colorblind-${colorblindMode}`);
    }
  }, [colorblindMode]);

  // Apply text size
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-size-110', 'text-size-120', 'text-size-130', 'text-size-140', 'text-size-150');
    if (textSize !== 100) {
      root.classList.add(`text-size-${textSize}`);
    }
  }, [textSize]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('inkscape-theme', newTheme);
  };

  const setColorblindMode = (mode: ColorblindMode) => {
    setColorblindModeState(mode);
    localStorage.setItem('inkscape-colorblind', mode);
  };

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem('inkscape-textsize', size.toString());
  };

  // Load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('inkscape-theme') as Theme | null;
    const savedColorblind = localStorage.getItem('inkscape-colorblind') as ColorblindMode | null;
    const savedTextSize = localStorage.getItem('inkscape-textsize');

    if (savedTheme) setThemeState(savedTheme);
    if (savedColorblind) setColorblindModeState(savedColorblind);
    if (savedTextSize) setTextSizeState(parseInt(savedTextSize) as TextSize);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        colorblindMode,
        textSize,
        setTheme,
        setColorblindMode,
        setTextSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
