# Centralized Design System

This design system provides centralized control over your entire application's appearance through a single configuration point.

## 🚀 Quick Start

### 1. Wrap your app with the Design System Provider

```tsx
// In your App.tsx or main.tsx
import { DesignSystemProvider } from '@/providers/DesignSystemProvider';
import '@/styles/design-system.css'; // Import CSS variables

function App() {
  return (
    <DesignSystemProvider initialTheme="light">
      {/* Your app content */}
    </DesignSystemProvider>
  );
}
```

### 2. Import CSS variables in your main CSS file

```css
/* In your index.css or globals.css */
@import './styles/design-system.css';
```

### 3. Start using the design system

```tsx
import { useDesignSystem } from '@/providers/DesignSystemProvider';

function MyComponent() {
  const { setCornerStyle, setTheme } = useDesignSystem();

  return (
    <div>
      <button onClick={() => setCornerStyle('sharp')}>
        Make Everything Sharp
      </button>
      <button onClick={() => setTheme('dark')}>
        Enable Dark Mode
      </button>
    </div>
  );
}
```

## 🎯 Global Control Examples

### Apply Sharp Corners Everywhere

```tsx
import { designSystem } from '@/lib/design-system';

// This instantly applies sharp corners to your entire app
designSystem.applyPreset('sharp');
```

### Change Colors Globally

```tsx
import { useDesignSystem } from '@/providers/DesignSystemProvider';

function ColorChanger() {
  const { updateTokens } = useDesignSystem();

  const changeToBlueTheme = () => {
    updateTokens({
      colors: {
        light: {
          ...currentColors,
          primary: 'hsl(210 100% 50%)',
          primaryHover: 'hsl(210 100% 45%)',
        }
      }
    });
  };

  return <button onClick={changeToBlueTheme}>Blue Theme</button>;
}
```

### Control Spacing

```tsx
import { useDesignSystem } from '@/providers/DesignSystemProvider';

function SpacingController() {
  const { setSpacing } = useDesignSystem();

  const makeTight = () => {
    setSpacing({
      4: '0.5rem',  // Reduce standard spacing
      6: '1rem',    // Reduce card padding
      8: '1.5rem',  // Reduce large spacing
    });
  };

  return <button onClick={makeTight}>Tight Spacing</button>;
}
```

## 🛠️ Usage Patterns

### 1. CSS Variables (Recommended)

```css
.my-component {
  background-color: var(--ds-color-primary);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-spacing-4);
  box-shadow: var(--ds-shadow-md);
}
```

### 2. Utility Classes

```tsx
<div className="ds-primary ds-corners ds-spacing-md ds-shadow-sm">
  Content
</div>
```

### 3. Component Variants

```tsx
import { useVariant } from '@/lib/design-system';

function MyButton({ variant, size, corners, ...props }) {
  const className = useVariant('button', { variant, size, corners });

  return <button className={className} {...props} />;
}

// Usage
<MyButton variant="primary" size="lg" corners="sharp">
  Click me
</MyButton>
```

### 4. React Hooks

```tsx
import { useDesignSystem, useThemeColors } from '@/providers/DesignSystemProvider';

function MyComponent() {
  const { tokens, theme, setCornerStyle } = useDesignSystem();
  const colors = useThemeColors();

  return (
    <div style={{
      backgroundColor: `hsl(${colors.primary})`,
      borderRadius: tokens.borderRadius.md
    }}>
      Current theme: {theme}
      <button onClick={() => setCornerStyle('sharp')}>
        Sharp Corners
      </button>
    </div>
  );
}
```

## 🎨 Available Controls

### Theme Controls
- `setTheme('light' | 'dark')` - Switch themes
- `updateTokens(newTokens)` - Update any design token
- `resetToDefaults()` - Reset to original design

### Corner Controls
- `setCornerStyle('sharp')` - Apply sharp corners globally
- `setCornerStyle('rounded')` - Apply rounded corners globally

### Preset Controls
- `applyPreset('sharp')` - Sharp corners preset
- `applyPreset('rounded')` - Rounded corners preset

### Color Controls
- `setColorScheme(colors)` - Update color palette
- Access colors via `useThemeColors()` hook

### Spacing Controls
- `setSpacing(spacingValues)` - Update spacing scale
- Use `var(--ds-spacing-*)` in CSS

## 📱 Responsive Design

```tsx
import { useBreakpoints } from '@/providers/DesignSystemProvider';

function ResponsiveComponent() {
  const { isMobile, isTablet, isDesktop, currentBreakpoint } = useBreakpoints();

  if (isMobile) {
    return <MobileView />;
  }

  if (isTablet) {
    return <TabletView />;
  }

  return <DesktopView />;
}
```

## 🔧 Advanced Usage

### Custom Component Integration

```tsx
// Create your own design-system aware component
import { combineVariants, componentVariants } from '@/lib/design-system';

const MyCustomButton = ({ variant = 'default', corners = 'auto', ...props }) => {
  const className = combineVariants(
    componentVariants.button,
    variant,
    undefined, // size
    corners,
    'my-custom-styles' // additional classes
  );

  return <button className={className} {...props} />;
};
```

### Runtime Theme Switching

```tsx
function ThemeControls() {
  const { theme, setTheme, tokens } = useDesignSystem();

  return (
    <div>
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        Toggle Theme
      </button>

      <div>
        Current corner style: {tokens.borderRadius.md === '0px' ? 'Sharp' : 'Rounded'}
      </div>
    </div>
  );
}
```

## 🎭 Demo Page

Visit `/design-system/demo` to see the full interactive demo where you can:
- Toggle between themes
- Switch corner styles
- View all component variants
- See live configuration
- Test changes in real-time

## ⚡ Performance

- **CSS Variables**: Highly optimized, browser-native
- **No Build Step**: Changes apply instantly
- **Tree Shaking**: Import only what you need
- **Type Safe**: Full TypeScript support
- **SSR Compatible**: Works with server-side rendering

## 🛡️ Safety Guarantees

- **Backwards Compatible**: Existing code continues to work
- **Graceful Fallbacks**: Default values if design system fails
- **Incremental Adoption**: Migrate components one at a time
- **No Breaking Changes**: Your current features remain intact

## 📝 Migration Guide

### From Tailwind Classes

**Before:**
```tsx
<button className="bg-blue-500 hover:bg-blue-600 rounded-lg px-4 py-2">
  Click me
</button>
```

**After:**
```tsx
<button className="ds-primary ds-corners ds-spacing-md">
  Click me
</button>
```

### From Inline Styles

**Before:**
```tsx
<div style={{ backgroundColor: '#3b82f6', borderRadius: '8px' }}>
  Content
</div>
```

**After:**
```tsx
<div style={{
  backgroundColor: 'var(--ds-color-primary)',
  borderRadius: 'var(--ds-radius-md)'
}}>
  Content
</div>
```

This design system gives you complete control over your application's appearance from a single, centralized location while maintaining full compatibility with your existing code.