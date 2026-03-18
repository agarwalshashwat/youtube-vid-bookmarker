# 🎨 Clipmark Design System

Single source of truth for all design tokens used across the Clipmark ecosystem.

## 📦 What's Included

- **colors.css**: Brand colors, semantic colors, theme colors
- **typography.css**: Font families, sizes, weights
- **spacing.css**: Margin, padding, gap values
- **shadows.css**: Elevation system
- **radius.css**: Border radius tokens

All tokens are consolidated into `tokens.css` for easy importing.

## 🚀 Usage

### In the Chrome Extension

```css
/* extension/styles/popup.css */
@import url('../../packages/design-system/tokens.css');

.my-component {
  background: var(--accent);
  color: var(--text);
  border-radius: var(--radius);
}
```

### In the Web App

```css
/* webapp/app/globals.css */
@import url('../../packages/design-system/tokens.css');
```

Or copy during build (recommended for Next.js):

```javascript
// Run before webapp build
fs.copyFileSync(
  'packages/design-system/tokens.css',
  'webapp/app/design-tokens.css'
);
```

## 🎨 Design Tokens

### Brand Colors

```css
--accent:          #14B8A6  /* Teal - Primary brand color */
--accent-hover:    #0d9488  /* Darker teal */
--accent-light:    rgba(20, 184, 166, 0.12)  /* Teal background tint */

--secondary:       #8B5CF6  /* Purple - AI features */
--secondary-hover: #A78BFA  /* Lighter purple */

--cta:             #22C55E  /* Green - Calls to action */
--cta-hover:       #16a34a  /* Darker green */
```

### Typography

```css
--font: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif
```

Primary typeface is **Inter**, with system font fallbacks.

### Shadows (Elevation System)

```css
--shadow-sm:    0 1px 3px rgba(0, 0, 0, 0.08)   /* Minimal elevation */
--shadow:       0 2px 8px rgba(0, 0, 0, 0.1)    /* Cards */
--shadow-lg:    0 4px 16px rgba(0, 0, 0, 0.12)  /* Modals */
--shadow-hover: 0 6px 20px rgba(0, 0, 0, 0.15)  /* Interactive hover */
```

### Border Radius

```css
--radius:    10px  /* Default */
--radius-sm: 6px   /* Smaller elements */
```

### Theme Colors

#### Light Theme (Default)

```css
--text:      #111827  /* Primary text */
--text-sub:  #6b7280  /* Secondary text */
--bg:        #f9fafb  /* Background */
--bg-sub:    #ffffff  /* Cards, panels */
--border:    #e5e7eb  /* Borders */
```

#### Dark Theme

```css
--text:      #f9fafb  /* Light text */
--bg:        #0a0a0f  /* Dark background */
--bg-sub:    #1f2937  /* Elevated surfaces */
--border:    #1f2937  /* Subtle borders */
```

Toggle with `<html data-theme="dark">` or `<html data-theme="light">`.

## ✏️ Making Changes

### 1. Edit this file

```bash
vim packages/design-system/tokens.css
```

### 2. Run sync script (if you've set up automation)

```bash
npm run sync-tokens
```

### 3. Test in both platforms

```bash
# Test extension
cd extension && open in Chrome

# Test webapp
cd webapp && npm run dev
```

## 📏 Design Principles

1. **Consistency**: Use tokens, not hardcoded values
2. **Accessibility**: Maintain WCAG AA contrast ratios
3. **Theming**: Support both light and dark modes
4. **Scalability**: Easy to add new tokens without breaking existing code

## 🔄 Sync Process

When you update tokens:

1. Extension automatically references this file via relative path
2. Webapp copies this file during build (Next.js can't import from outside)
3. Both platforms stay synchronized automatically

## 📝 Version History

- **v1.0.0** (2024-03-18): Initial design system with core tokens
  - Brand colors (teal, purple, green)
  - Light/dark theme support
  - Shadow elevation system
  - Typography tokens

---

**Note**: This is the single source of truth. Never edit design tokens directly in the extension or webapp files. Always edit here and sync.
