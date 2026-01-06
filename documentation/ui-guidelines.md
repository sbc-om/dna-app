# UI Guidelines (Game-like UX)

This repo intentionally uses a “game-like”, motion-rich UI style.

## Core rules

- Use **shadcn/ui** components when possible.
- Use Tailwind for styling.
- Use **Framer Motion** (`framer-motion`) for:
  - page entrance transitions
  - hover/tap states on buttons/links
  - animated cards, modals, lists

## Where UI lives

- App-level layouts: `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`
- Shared components: `src/components/*`
- shadcn/ui primitives: `src/components/ui/*`

## Dark theme

The root layout forces dark theme:

- `ThemeProvider forcedTheme="dark"` in `src/app/layout.tsx`

## Scrollbars

OverlayScrollbars is used:

- `OverlayScrollbarsProvider` in `src/app/layout.tsx`
- Styles in `src/app/overlayscrollbars.css` and `src/app/globals.css`

## Motion patterns

Prefer these patterns:

- Page wrapper entrance:
  - `initial={{ opacity: 0, y: 20 }}`
  - `animate={{ opacity: 1, y: 0 }}`
  - spring transitions

- Interactive buttons:
  - `whileHover={{ scale: 1.05 }}`
  - `whileTap={{ scale: 0.95 }}`

- Lists:
  - stagger items via index delay

## i18n UI discipline

- Keep user-facing text in dictionaries (`src/locales/*.json`).
- Components should receive `dictionary` (or specific strings) from server pages/layouts.

## Adding a new page component

1. Add route under `src/app/[locale]/.../page.tsx`
2. Load dictionary server-side (`getDictionary(locale)`)
3. Pass strings into a client component for animation/interactions

