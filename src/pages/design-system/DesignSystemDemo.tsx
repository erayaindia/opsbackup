/**
 * Design System Demo Page
 * This page demonstrates all design system capabilities and allows real-time testing
 */

import React from 'react';
import { useDesignSystem, useThemeColors, useBreakpoints } from '@/providers/DesignSystemProvider';
import { useVariant } from '@/lib/design-system/variants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Palette,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  CornerUpLeft,
  CornerUpRight,
  Sun,
  Moon,
  RefreshCw,
  Zap
} from 'lucide-react';

export default function DesignSystemDemo() {
  const {
    tokens,
    theme,
    updateTokens,
    setTheme,
    applyPreset,
    resetToDefaults,
    setCornerStyle,
  } = useDesignSystem();

  const colors = useThemeColors();
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useBreakpoints();

  const buttonVariantClass = useVariant('button', {
    variant: 'default',
    size: 'default',
    corners: 'auto',
  });

  const cardVariantClass = useVariant('card', {
    variant: 'default',
    corners: 'auto',
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Design System Control Center</h1>
          <p className="text-lg text-muted-foreground">
            Real-time control over your entire application's design
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Monitor className="w-4 h-4" />
            Current breakpoint: <Badge variant="outline">{currentBreakpoint}</Badge>
            {isMobile && <Smartphone className="w-4 h-4" />}
            {isTablet && <Tablet className="w-4 h-4" />}
            {isDesktop && <Monitor className="w-4 h-4" />}
          </div>
        </div>

        {/* Quick Controls */}
        <Card className={cardVariantClass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Controls
            </CardTitle>
            <CardDescription>
              Instantly apply design changes across your entire application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <Label htmlFor="theme-switch">
                  {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                </Label>
              </div>
              <Switch
                id="theme-switch"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>

            <Separator />

            {/* Corner Style Controls */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Corner Style</Label>
              <div className="flex gap-2">
                <Button
                  variant={tokens.borderRadius.md === '0px' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCornerStyle('sharp')}
                  className="flex items-center gap-2"
                >
                  <CornerUpLeft className="w-4 h-4" />
                  Sharp Corners
                </Button>
                <Button
                  variant={tokens.borderRadius.md !== '0px' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCornerStyle('rounded')}
                  className="flex items-center gap-2"
                >
                  <CornerUpRight className="w-4 h-4" />
                  Rounded Corners
                </Button>
              </div>
            </div>

            <Separator />

            {/* Preset Controls */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Design Presets</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('sharp')}
                >
                  Sharp Preset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('rounded')}
                >
                  Rounded Preset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaults}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Buttons Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>All button styles with current design system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="default" className={buttonVariantClass}>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Button Sizes</h4>
                <div className="flex items-center gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Input fields and form components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="demo-input">Default Input</Label>
                <Input id="demo-input" placeholder="Type something..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo-input-error">Error State</Label>
                <Input
                  id="demo-input-error"
                  placeholder="Error state example"
                  className="border-red-500 focus-visible:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo-input-success">Success State</Label>
                <Input
                  id="demo-input-success"
                  placeholder="Success state example"
                  className="border-green-500 focus-visible:ring-green-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Badges Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>Badges & Status</CardTitle>
              <CardDescription>Status indicators and labels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Success</Badge>
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Warning</Badge>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Info</Badge>
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Custom</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Color Palette */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Color Palette
              </CardTitle>
              <CardDescription>Current theme colors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {Object.entries(colors).map(([name, value]) => (
                  <div key={name} className="space-y-1">
                    <div
                      className="w-full h-8 border border-border"
                      style={{ backgroundColor: `hsl(${value})` }}
                    />
                    <div className="text-center">
                      <div className="font-medium">{name}</div>
                      <div className="text-muted-foreground text-xs">hsl({value})</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Live Configuration
            </CardTitle>
            <CardDescription>
              View and modify current design system configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">

              {/* Border Radius */}
              <div>
                <h4 className="font-medium mb-2">Border Radius</h4>
                <div className="space-y-1">
                  {Object.entries(tokens.borderRadius).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div>
                <h4 className="font-medium mb-2">Spacing Scale</h4>
                <div className="space-y-1">
                  {Object.entries(tokens.spacing).slice(0, 8).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div>
                <h4 className="font-medium mb-2">Typography</h4>
                <div className="space-y-1">
                  {Object.entries(tokens.typography.fontSize).slice(0, 8).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use the Design System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <h4>1. Automatic Integration</h4>
              <p>Your entire application now uses this centralized design system. Any changes you make here will instantly apply across all pages.</p>

              <h4>2. Component Usage</h4>
              <p>Use design system classes in your components:</p>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`// Use CSS variables
<div className="bg-[var(--ds-color-primary)] text-[var(--ds-color-background)]">
  Content
</div>

// Use utility classes
<div className="ds-primary ds-corners ds-spacing-md">
  Content
</div>

// Use React hooks
const { setCornerStyle } = useDesignSystem();
setCornerStyle('sharp'); // Changes entire app`}
              </pre>

              <h4>3. Global Control</h4>
              <p>Change any design element from anywhere in your code:</p>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`// In any component
import { designSystem } from '@/lib/design-system/tokens';

// Apply sharp corners globally
designSystem.applyPreset('sharp');

// Custom color scheme
designSystem.updateTokens({
  colors: {
    light: { primary: 'hsl(200 100% 50%)' }
  }
});`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}