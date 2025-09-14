/**
 * Design Tokens - Central configuration for all design elements
 * This file controls the entire application's look and feel
 */

export interface ColorPalette {
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  accent: string;
  accentHover: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveHover: string;
  success: string;
  successHover: string;
  warning: string;
  warningHover: string;
  info: string;
  infoHover: string;
}

export interface Typography {
  fontFamily: {
    sans: string[];
    mono: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
  };
  fontWeight: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  lineHeight: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
}

export interface Spacing {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

export interface BorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface Shadows {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

export interface Animations {
  duration: {
    75: string;
    100: string;
    150: string;
    200: string;
    300: string;
    500: string;
    700: string;
    1000: string;
  };
  easing: {
    linear: string;
    in: string;
    out: string;
    inOut: string;
  };
}

export interface Breakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface DesignTokens {
  colors: {
    light: ColorPalette;
    dark: ColorPalette;
  };
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  animations: Animations;
  breakpoints: Breakpoints;
}

// Default Design Tokens - Your current design values
export const defaultTokens: DesignTokens = {
  colors: {
    light: {
      primary: 'hsl(221.2 83.2% 53.3%)',
      primaryHover: 'hsl(221.2 83.2% 45%)',
      secondary: 'hsl(210 40% 96%)',
      secondaryHover: 'hsl(210 40% 90%)',
      accent: 'hsl(210 40% 96%)',
      accentHover: 'hsl(210 40% 90%)',
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
      card: 'hsl(0 0% 100%)',
      cardForeground: 'hsl(222.2 84% 4.9%)',
      popover: 'hsl(0 0% 100%)',
      popoverForeground: 'hsl(222.2 84% 4.9%)',
      muted: 'hsl(210 40% 96%)',
      mutedForeground: 'hsl(215.4 16.3% 46.9%)',
      border: 'hsl(214.3 31.8% 91.4%)',
      input: 'hsl(214.3 31.8% 91.4%)',
      ring: 'hsl(221.2 83.2% 53.3%)',
      destructive: 'hsl(0 72.2% 50.6%)',
      destructiveHover: 'hsl(0 72.2% 45%)',
      success: 'hsl(142.1 76.2% 36.3%)',
      successHover: 'hsl(142.1 76.2% 30%)',
      warning: 'hsl(47.9 95.8% 53.1%)',
      warningHover: 'hsl(47.9 95.8% 45%)',
      info: 'hsl(199.3 89.5% 48.4%)',
      infoHover: 'hsl(199.3 89.5% 40%)',
    },
    dark: {
      primary: 'hsl(217.2 91.2% 59.8%)',
      primaryHover: 'hsl(217.2 91.2% 65%)',
      secondary: 'hsl(217.2 32.6% 17.5%)',
      secondaryHover: 'hsl(217.2 32.6% 22%)',
      accent: 'hsl(217.2 32.6% 17.5%)',
      accentHover: 'hsl(217.2 32.6% 22%)',
      background: 'hsl(222.2 84% 4.9%)',
      foreground: 'hsl(210 40% 98%)',
      card: 'hsl(222.2 84% 4.9%)',
      cardForeground: 'hsl(210 40% 98%)',
      popover: 'hsl(222.2 84% 4.9%)',
      popoverForeground: 'hsl(210 40% 98%)',
      muted: 'hsl(217.2 32.6% 17.5%)',
      mutedForeground: 'hsl(215 20.2% 65.1%)',
      border: 'hsl(217.2 32.6% 17.5%)',
      input: 'hsl(217.2 32.6% 17.5%)',
      ring: 'hsl(224.3 76.3% 94.1%)',
      destructive: 'hsl(0 62.8% 30.6%)',
      destructiveHover: 'hsl(0 62.8% 35%)',
      success: 'hsl(142.1 70.6% 45.3%)',
      successHover: 'hsl(142.1 70.6% 50%)',
      warning: 'hsl(47.9 95.8% 53.1%)',
      warningHover: 'hsl(47.9 95.8% 58%)',
      info: 'hsl(199.3 89.5% 48.4%)',
      infoHover: 'hsl(199.3 89.5% 55%)',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      thin: 100,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  spacing: {
    0: '0rem',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem',
  },
  borderRadius: {
    none: '0px',      // Sharp corners - your preferred style
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  animations: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Global design system configuration
let currentTokens: DesignTokens = { ...defaultTokens };

export const designSystem = {
  // Get current tokens
  getTokens: (): DesignTokens => currentTokens,

  // Update tokens (triggers CSS variable updates)
  updateTokens: (newTokens: Partial<DesignTokens>): void => {
    currentTokens = { ...currentTokens, ...newTokens };
    updateCSSVariables();
  },

  // Reset to defaults
  reset: (): void => {
    currentTokens = { ...defaultTokens };
    updateCSSVariables();
  },

  // Quick theme presets
  applyPreset: (preset: 'sharp' | 'rounded' | 'minimal' | 'vibrant'): void => {
    switch (preset) {
      case 'sharp':
        currentTokens.borderRadius = {
          ...currentTokens.borderRadius,
          none: '0px',
          sm: '0px',
          md: '0px',
          lg: '0px',
          xl: '0px',
          '2xl': '0px',
          '3xl': '0px',
          full: '0px',
        };
        break;
      case 'rounded':
        currentTokens.borderRadius = {
          ...currentTokens.borderRadius,
          none: '0px',
          sm: '0.25rem',
          md: '0.5rem',
          lg: '0.75rem',
          xl: '1rem',
          '2xl': '1.5rem',
          '3xl': '2rem',
          full: '9999px',
        };
        break;
      // Add more presets as needed
    }
    updateCSSVariables();
  },
};

// Update CSS variables function (to be implemented in CSS file)
function updateCSSVariables(): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const tokens = currentTokens;
    const theme = 'light'; // This will be dynamic based on theme context

    // Update color variables
    Object.entries(tokens.colors[theme]).forEach(([key, value]) => {
      root.style.setProperty(`--ds-color-${key}`, value);
    });

    // Update spacing variables
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--ds-spacing-${key}`, value);
    });

    // Update border radius variables
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--ds-radius-${key}`, value);
    });

    // Update shadow variables
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--ds-shadow-${key}`, value);
    });
  }
}

export { updateCSSVariables };