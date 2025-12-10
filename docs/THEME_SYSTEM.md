# Modern Theme System

## Overview

The DNA app now features a professional, modern theme system with both Light and Dark modes, smooth transitions, and beautiful animations inspired by modern design trends.

## Features

### ✨ Theme Switching
- **Light Mode**: Clean, bright interface with white backgrounds
- **Dark Mode**: Elegant dark interface with deep blacks and subtle grays
- **Smooth Transitions**: All elements transition smoothly between themes
- **System Preference Detection**: Automatically detects user's system preference
- **Persistent**: Theme preference is saved in localStorage

### 🎨 Design Elements

#### Colors
- **Primary**: #FF5F02 (Orange) - Brand color
- **Light Background**: #FFFFFF (White)
- **Dark Background**: #000000 (Black)
- **Light Cards**: #FFFFFF with subtle shadows
- **Dark Cards**: #262626 with enhanced shadows

#### Gradients
- `gradient-orange`: Orange gradient for CTAs
- `gradient-dark`: Dark gradient backgrounds
- `gradient-light`: Light gradient backgrounds
- `gradient-orange-soft`: Subtle orange tint

#### Glass Morphism
- `.glass`: Light glass effect
- `.glass-dark`: Dark glass effect
- Perfect for modern, layered interfaces

### 🚀 Animations

#### Built-in Animations
- `animate-fade-in`: Smooth fade in effect
- `animate-scale-in`: Scale and fade in
- `animate-slide-in-left`: Slide from left
- `animate-slide-in-right`: Slide from right
- `animate-shimmer`: Shimmer loading effect
- `animate-bounce-slow`: Slow bounce
- `animate-float`: Floating effect
- `animate-wiggle`: Wiggle animation
- `animate-shake`: Shake animation

#### Hover Effects
- `hover-scale`: Scales up on hover
- `hover-lift`: Lifts up on hover
- `transition-smooth`: Smooth transitions for all properties

#### Shadows
- `shadow-soft`: Subtle shadow
- `shadow-medium`: Medium shadow
- `shadow-strong`: Strong shadow
- Automatically adapts to dark mode

## Usage

### Theme Toggle Button

The theme toggle button is available in:
- Public header (top right)
- Dashboard header (top right)

Click to switch between light and dark modes.

### Using Theme Classes

```tsx
// Gradient backgrounds
<div className="gradient-orange text-white p-6 rounded-xl">
  Content
</div>

// Glass morphism
<div className="glass p-4 rounded-lg">
  Glass card
</div>

// Modern card
<div className="card-modern p-6">
  Modern styled card
</div>

// Animations
<div className="animate-fade-in">
  Fades in smoothly
</div>

<button className="hover-scale transition-smooth">
  Hover me!
</button>

// Shadows
<div className="shadow-medium rounded-lg p-4">
  Card with shadow
</div>
```

### Using Theme in Components

```tsx
import { useTheme } from '@/components/ThemeProvider';

export function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
    </div>
  );
}
```

### Dark Mode Specific Styles

Use Tailwind's `dark:` variant:

```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Adapts to theme
</div>
```

## Components with Theme Support

- ✅ Header
- ✅ DashboardHeader
- ✅ DashboardSidebar
- ✅ All UI components (Cards, Buttons, etc.)
- ✅ Forms and inputs
- ✅ Modals and dialogs

## Best Practices

1. **Always use theme colors**: Use CSS variables or Tailwind classes
2. **Add dark: variants**: Ensure all custom styles work in dark mode
3. **Use transitions**: Add `transition-smooth` for smooth changes
4. **Test both modes**: Always test your components in both light and dark modes
5. **Respect user preference**: The theme system automatically detects system preference

## CSS Variables

### Light Mode
```css
--background: #FFFFFF
--foreground: #000000
--card: #FFFFFF
--primary: #FF5F02
--border: #DDDDDD
```

### Dark Mode
```css
--background: #000000
--foreground: #FFFFFF
--card: #262626
--primary: #FF5F02
--border: #262626
```

## Advanced Features

### Gradient Text
```tsx
<h1 className="bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent">
  Gradient Text
</h1>
```

### Animated Buttons
```tsx
<button className="gradient-orange hover-scale transition-smooth shadow-medium rounded-lg px-6 py-3">
  Animated CTA
</button>
```

### Loading States
```tsx
<div className="animate-shimmer h-4 rounded bg-gray-200 dark:bg-gray-700" />
```

## Browser Support

- ✅ All modern browsers
- ✅ Safari (iOS & macOS)
- ✅ Chrome
- ✅ Firefox
- ✅ Edge

## Performance

- Lightweight CSS (no external dependencies)
- Smooth transitions with hardware acceleration
- Efficient theme switching (< 16ms)
- LocalStorage caching for instant load

## Accessibility

- High contrast in both modes
- Respects `prefers-color-scheme`
- ARIA labels on theme toggle
- Keyboard navigation support
