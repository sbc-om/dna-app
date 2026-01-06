# Routing, i18n, and RTL/LTR

## Locale routing model

Routes are localized using the first path segment:

- `/${locale}/...` where locale ∈ `{ "en", "ar" }`

Supported locales are defined in:

- `src/config/i18n.ts`

The root `/` route redirects to `/${locale}` based on a cookie:

- `src/app/page.tsx`

Cookie key:

- `locale`

## Layout direction

RTL/LTR direction is computed from `localeDirections`:

- `src/config/i18n.ts`

The locale layout sets `dir`:

- `src/app/[locale]/layout.tsx`

That layout uses `LocaleHtmlAttributes` to apply locale/direction attributes to `<html>`.

## Dictionaries / translations

Translations live in:

- `src/locales/en.json`
- `src/locales/ar.json`

The dictionary loader:

- `src/lib/i18n/getDictionary.ts`

Usage pattern (server component):

- `const dictionary = await getDictionary(locale)`

### Rules for strings

- Avoid hard-coded user-facing strings inside components.
- Use dictionary keys and keep English-only strings in code for:
  - error logs
  - internal constants
  - developer messages

## Adding a new translation key

1. Add the key to `src/locales/en.json`
2. Add the same key to `src/locales/ar.json`
3. Use `dictionary.<section>.<key>` (or whichever structure already exists)

Tip: Keep keys stable. Use the translation files for text changes, not code.

## Direction-sensitive UI

When building layouts/components that change with `dir`:

- Prefer Tailwind logical utilities when possible
- When you must flip spacing/alignment manually:
  - Use the `direction` prop passed from layouts (where available)
  - Or read `dir` from DOM only in client components

