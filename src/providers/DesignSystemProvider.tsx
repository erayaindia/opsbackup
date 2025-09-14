/**
 * Design System Provider - React Context for global design system management
 * This provider allows real-time control of design tokens across the entire app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DesignTokens, designSystem, defaultTokens, updateCSSVariables } from '@/lib/design-system/tokens';

export interface DesignSystemContextValue {
  tokens: DesignTokens;
  theme: 'light' | 'dark';
  updateTokens: (newTokens: Partial<DesignTokens>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  applyPreset: (preset: 'sharp' | 'rounded' | 'minimal' | 'vibrant') => void;
  resetToDefaults: () => void;
  // Quick access to common settings
  setCornerStyle: (style: 'sharp' | 'rounded') => void;
  setColorScheme: (colors: Partial<DesignTokens['colors']>) => void;
  setSpacing: (spacing: Partial<DesignTokens['spacing']>) => void;
}

const DesignSystemContext = createContext<DesignSystemContextValue | null>(null);

export interface DesignSystemProviderProps {
  children: React.ReactNode;
  initialTheme?: 'light' | 'dark';
  initialTokens?: Partial<DesignTokens>;
}

export const DesignSystemProvider: React.FC<DesignSystemProviderProps> = ({
  children,
  initialTheme = 'light',
  initialTokens,
}) => {
  const [tokens, setTokens] = useState<DesignTokens>(() => {
    if (initialTokens) {
      return { ...defaultTokens, ...initialTokens };
    }
    return designSystem.getTokens();
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);

  // Update CSS variables whenever tokens or theme changes
  useEffect(() => {
    updateCSSVariables();

    // Apply theme class to document
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [tokens, theme]);

  // Initialize CSS variables on mount
  useEffect(() => {
    if (initialTokens) {
      designSystem.updateTokens(initialTokens);
    }
    updateCSSVariables();
  }, []);

  const updateTokens = (newTokens: Partial<DesignTokens>) => {
    const updatedTokens = { ...tokens, ...newTokens };
    setTokens(updatedTokens);
    designSystem.updateTokens(newTokens);
  };

  const applyPreset = (preset: 'sharp' | 'rounded' | 'minimal' | 'vibrant') => {
    designSystem.applyPreset(preset);
    setTokens(designSystem.getTokens());
  };

  const resetToDefaults = () => {
    designSystem.reset();
    setTokens(designSystem.getTokens());
  };

  const setCornerStyle = (style: 'sharp' | 'rounded') => {
    const newBorderRadius = style === 'sharp'
      ? {
          none: '0px',
          sm: '0px',
          md: '0px',
          lg: '0px',
          xl: '0px',
          '2xl': '0px',
          '3xl': '0px',
          full: '0px',
        }
      : {
          none: '0px',
          sm: '0.25rem',
          md: '0.5rem',
          lg: '0.75rem',
          xl: '1rem',
          '2xl': '1.5rem',
          '3xl': '2rem',
          full: '9999px',
        };

    updateTokens({
      borderRadius: { ...tokens.borderRadius, ...newBorderRadius }
    });
  };

  const setColorScheme = (colors: Partial<DesignTokens['colors']>) => {
    updateTokens({
      colors: { ...tokens.colors, ...colors }
    });
  };

  const setSpacing = (spacing: Partial<DesignTokens['spacing']>) => {
    updateTokens({
      spacing: { ...tokens.spacing, ...spacing }
    });
  };

  const contextValue: DesignSystemContextValue = {
    tokens,
    theme,
    updateTokens,
    setTheme,
    applyPreset,
    resetToDefaults,
    setCornerStyle,
    setColorScheme,
    setSpacing,
  };

  return (
    <DesignSystemContext.Provider value={contextValue}>
      {children}
    </DesignSystemContext.Provider>
  );
};

// Hook to use the design system context
export const useDesignSystem = (): DesignSystemContextValue => {
  const context = useContext(DesignSystemContext);
  if (!context) {
    throw new Error('useDesignSystem must be used within a DesignSystemProvider');
  }
  return context;
};

// Hook for getting current theme colors
export const useThemeColors = () => {
  const { tokens, theme } = useDesignSystem();
  return tokens.colors[theme];
};

// Hook for responsive design
export const useBreakpoints = () => {
  const { tokens } = useDesignSystem();
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('sm');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkBreakpoint = () => {
      const width = window.innerWidth;
      const breakpoints = tokens.breakpoints;

      if (width >= parseInt(breakpoints['2xl'])) {
        setCurrentBreakpoint('2xl');
      } else if (width >= parseInt(breakpoints.xl)) {
        setCurrentBreakpoint('xl');
      } else if (width >= parseInt(breakpoints.lg)) {
        setCurrentBreakpoint('lg');
      } else if (width >= parseInt(breakpoints.md)) {
        setCurrentBreakpoint('md');
      } else {
        setCurrentBreakpoint('sm');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [tokens.breakpoints]);

  return {
    currentBreakpoint,
    isMobile: currentBreakpoint === 'sm',
    isTablet: currentBreakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(currentBreakpoint),
    breakpoints: tokens.breakpoints,
  };
};

// Quick preset functions for common use cases
export const designPresets = {
  // Apply sharp corners across the entire app
  applySharpCorners: () => {
    const context = useDesignSystem();
    context.setCornerStyle('sharp');
  },

  // Apply rounded corners across the entire app
  applyRoundedCorners: () => {
    const context = useDesignSystem();
    context.setCornerStyle('rounded');
  },

  // Switch to dark mode
  enableDarkMode: () => {
    const context = useDesignSystem();
    context.setTheme('dark');
  },

  // Switch to light mode
  enableLightMode: () => {
    const context = useDesignSystem();
    context.setTheme('light');
  },
};

// Export for direct usage without hooks
export { designSystem };