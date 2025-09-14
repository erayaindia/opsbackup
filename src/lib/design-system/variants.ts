/**
 * Component Variants - Reusable component style configurations
 * This file defines standardized component appearances that can be applied globally
 */

import { designSystem } from './tokens';

export interface ComponentVariant {
  base: string;
  variants: Record<string, string>;
  sizes?: Record<string, string>;
  defaultVariant: string;
  defaultSize?: string;
}

export interface VariantProps {
  variant?: string;
  size?: string;
  corners?: 'sharp' | 'rounded' | 'auto';
  className?: string;
}

// Helper function to get corner classes based on design system
export const getCornerClass = (corners?: 'sharp' | 'rounded' | 'auto'): string => {
  const tokens = designSystem.getTokens();

  switch (corners) {
    case 'sharp':
      return 'rounded-none';
    case 'rounded':
      return 'rounded-md';
    case 'auto':
    default:
      // Use current design system setting
      return tokens.borderRadius.none === '0px' ? 'rounded-none' : 'rounded-md';
  }
};

// Button variants
export const buttonVariants: ComponentVariant = {
  base: 'inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  variants: {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
    success: 'bg-green-600 text-white hover:bg-green-700',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
    info: 'bg-blue-600 text-white hover:bg-blue-700',
  },
  sizes: {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
  },
  defaultVariant: 'default',
  defaultSize: 'default',
};

// Input variants
export const inputVariants: ComponentVariant = {
  base: 'flex w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  variants: {
    default: '',
    error: 'border-destructive focus-visible:ring-destructive',
    success: 'border-green-500 focus-visible:ring-green-500',
    warning: 'border-yellow-500 focus-visible:ring-yellow-500',
  },
  sizes: {
    default: 'h-10',
    sm: 'h-9',
    lg: 'h-11',
  },
  defaultVariant: 'default',
  defaultSize: 'default',
};

// Card variants
export const cardVariants: ComponentVariant = {
  base: 'border bg-card text-card-foreground shadow-sm',
  variants: {
    default: '',
    elevated: 'shadow-lg',
    outlined: 'border-2',
    filled: 'bg-muted',
    interactive: 'hover:shadow-md transition-shadow cursor-pointer',
  },
  sizes: {
    default: 'p-6',
    sm: 'p-4',
    lg: 'p-8',
    xl: 'p-12',
  },
  defaultVariant: 'default',
  defaultSize: 'default',
};

// Badge variants
export const badgeVariants: ComponentVariant = {
  base: 'inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  variants: {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground',
    success: 'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
    warning: 'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    info: 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
  defaultVariant: 'default',
};

// Table variants
export const tableVariants: ComponentVariant = {
  base: 'w-full caption-bottom text-sm',
  variants: {
    default: '',
    striped: '[&>tbody>tr:nth-child(odd)]:bg-muted/50',
    bordered: 'border border-border',
    hoverable: '[&>tbody>tr]:hover:bg-muted/50 [&>tbody>tr]:transition-colors',
  },
  defaultVariant: 'default',
};

// Alert variants
export const alertVariants: ComponentVariant = {
  base: 'relative w-full border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  variants: {
    default: 'bg-background text-foreground',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    success: 'border-green-500/50 text-green-800 bg-green-50 dark:text-green-400 dark:bg-green-950 [&>svg]:text-green-600',
    warning: 'border-yellow-500/50 text-yellow-800 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950 [&>svg]:text-yellow-600',
    info: 'border-blue-500/50 text-blue-800 bg-blue-50 dark:text-blue-400 dark:bg-blue-950 [&>svg]:text-blue-600',
  },
  defaultVariant: 'default',
};

// Modal/Dialog variants
export const dialogVariants: ComponentVariant = {
  base: 'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
  variants: {
    default: '',
    wide: 'max-w-2xl',
    narrow: 'max-w-sm',
    full: 'max-w-4xl',
  },
  defaultVariant: 'default',
};

// Navigation variants
export const navigationVariants: ComponentVariant = {
  base: 'flex items-center space-x-1',
  variants: {
    horizontal: 'flex-row',
    vertical: 'flex-col space-x-0 space-y-1',
    pills: 'bg-muted p-1',
    tabs: 'border-b',
  },
  defaultVariant: 'horizontal',
};

// Export all variants
export const componentVariants = {
  button: buttonVariants,
  input: inputVariants,
  card: cardVariants,
  badge: badgeVariants,
  table: tableVariants,
  alert: alertVariants,
  dialog: dialogVariants,
  navigation: navigationVariants,
};

// Utility function to combine variant classes
export const combineVariants = (
  component: ComponentVariant,
  variant?: string,
  size?: string,
  corners?: 'sharp' | 'rounded' | 'auto',
  className?: string
): string => {
  const baseClasses = component.base;
  const variantClasses = component.variants[variant || component.defaultVariant] || '';
  const sizeClasses = component.sizes?.[size || component.defaultSize || ''] || '';
  const cornerClasses = getCornerClass(corners);

  return [baseClasses, variantClasses, sizeClasses, cornerClasses, className]
    .filter(Boolean)
    .join(' ');
};

// Hook for using variants with React components
export const useVariant = (
  componentName: keyof typeof componentVariants,
  props: VariantProps
) => {
  const component = componentVariants[componentName];
  return combineVariants(
    component,
    props.variant,
    props.size,
    props.corners,
    props.className
  );
};