/**
 * Design System - Central Export
 * Import everything you need from this single file
 */

// Core design system
export {
  defaultTokens,
  designSystem,
  updateCSSVariables,
  type DesignTokens,
  type ColorPalette,
  type Typography,
  type Spacing,
  type BorderRadius,
  type Shadows,
  type Animations,
  type Breakpoints,
} from './tokens';

// Component variants
export {
  componentVariants,
  buttonVariants,
  inputVariants,
  cardVariants,
  badgeVariants,
  tableVariants,
  alertVariants,
  dialogVariants,
  navigationVariants,
  combineVariants,
  useVariant,
  getCornerClass,
  type ComponentVariant,
  type VariantProps,
} from './variants';

// React provider and hooks
export {
  DesignSystemProvider,
  useDesignSystem,
  useThemeColors,
  useBreakpoints,
  designPresets,
  type DesignSystemContextValue,
  type DesignSystemProviderProps,
} from '../providers/DesignSystemProvider';

// Quick setup helper
export const setupDesignSystem = {
  // Apply sharp corners globally
  enableSharpCorners: () => designSystem.applyPreset('sharp'),

  // Apply rounded corners globally
  enableRoundedCorners: () => designSystem.applyPreset('rounded'),

  // Switch to dark theme
  enableDarkMode: () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  },

  // Switch to light theme
  enableLightMode: () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  },

  // Reset everything to defaults
  reset: () => designSystem.reset(),
};

// Utility functions
export const designUtils = {
  // Get current theme
  getCurrentTheme: () => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  },

  // Check if corners are sharp
  isCornersSharp: () => {
    const tokens = designSystem.getTokens();
    return tokens.borderRadius.md === '0px';
  },

  // Generate CSS variables string for inline styles
  getCSSVariables: () => {
    const tokens = designSystem.getTokens();
    const theme = designUtils.getCurrentTheme();
    const colors = tokens.colors[theme];

    const cssVars: Record<string, string> = {};

    // Add color variables
    Object.entries(colors).forEach(([key, value]) => {
      cssVars[`--ds-color-${key}`] = value;
    });

    return cssVars;
  },
};