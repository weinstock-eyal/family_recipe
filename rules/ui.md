# UI Coding Standards

## Component Library

This project uses **shadcn/ui** as its sole component library. All UI must be built using shadcn/ui components exclusively.

### Rules

- **ONLY** use shadcn/ui components for all UI elements (buttons, inputs, cards, dialogs, etc.).
- **DO NOT** create custom components. If a shadcn/ui component doesn't exist for your use case, install it via `npx shadcn@latest add <component>`.
- Compose pages and features by combining shadcn/ui primitives — never build bespoke replacements.
- Use the `cn()` utility from `src/lib/utils.ts` for conditional class merging on shadcn/ui components.

## Date Formatting

All dates must be formatted using **date-fns**.

- Format: `dd/MM/yyyy`
- Example: `25/03/2026`

```ts
import { format } from "date-fns";

format(new Date(), "dd/MM/yyyy"); // "25/03/2026"
```

- Do not use `Intl.DateTimeFormat`, `toLocaleDateString()`, or manual string concatenation for date display.

## Color Palette

### Primary Colors (סגול-כחול-ורוד)

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | כחול (Blue) | `#6366F1` | Buttons, links, active states |
| Secondary | סגול (Purple) | `#8B5CF6` | Accents, hover states, badges |
| Accent | ורוד (Pink) | `#EC4899` | Highlights, notifications, decorative elements |

### Contrast / Complementary

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Contrast | כתום (Orange) | `#F97316` | CTA buttons, warnings, important callouts |

### Neutral & Semantic Colors

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | לבן | `#FFFFFF` | Page background |
| Surface | אפור בהיר | `#F8FAFC` | Cards, panels |
| Border | אפור | `#E2E8F0` | Borders, dividers |
| Text Primary | כהה | `#1E293B` | Headings, body text |
| Text Secondary | אפור כהה | `#64748B` | Captions, placeholders |
| Success | ירוק | `#22C55E` | Success messages, confirmations |
| Error | אדום | `#EF4444` | Errors, destructive actions |

### Rules

- Use CSS variables (via Tailwind config / shadcn theming) to define these colors — never hardcode hex values in components.
- Orange (`contrast`) is reserved for high-emphasis elements that need to stand out against the blue/purple palette.
- Ensure all text/background combinations meet **WCAG AA** contrast ratio (4.5:1 minimum).

## Dark Mode

This project supports **manual dark mode** via a toggle button in the UI. The user chooses light or dark — no automatic OS detection.

- Use shadcn/ui's built-in dark mode support with CSS variables.
- Define all colors as CSS variables with both light and dark values.
- Store the user's preference in `localStorage`.
- The toggle component should use shadcn/ui's `Button` with a sun/moon icon from `lucide-react`.

## Border Radius

Global border radius: **`8px`** (medium).

- Define as `--radius: 8px` in CSS variables.
- shadcn/ui components inherit this value automatically.
- Do not override radius on individual components unless explicitly required by design.

## Shadows (Elevation)

Three shadow levels for visual depth:

| Level | Token | Value | Usage |
|-------|-------|-------|-------|
| Small | `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards, list items |
| Medium | `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Dropdowns, popovers, tooltips |
| Large | `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dialogs, sheets |

- Use Tailwind's built-in shadow utilities (`shadow-sm`, `shadow-md`, `shadow-lg`).
- Do not create custom box-shadow values.

## Typography

Font: **Heebo** (defined in root layout).

### Scale

| Token | Size | Usage |
|-------|------|-------|
| `text-sm` | `14px` | Captions, helper text, timestamps |
| `text-base` | `16px` | Body text, form inputs |
| `text-lg` | `20px` | Section subheadings |
| `text-xl` | `24px` | Page subheadings |
| `text-2xl` | `32px` | Page titles |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | `400` | Body text, descriptions |
| Semibold | `600` | Subheadings, labels, emphasis |
| Bold | `700` | Page titles, primary headings |

- Use Tailwind's `font-normal`, `font-semibold`, `font-bold` utilities.
- Do not use `font-light` (300) or `font-black` (900).

## Spacing

Standard spacing values for consistent layout:

| Context | Padding / Gap | Tailwind Class |
|---------|--------------|----------------|
| Card padding | `24px` | `p-6` |
| List / grid gap | `16px` | `gap-4` |
| Form field gap | `16px` | `space-y-4` |
| Section gap | `32px` | `space-y-8` |
| Page padding (mobile) | `16px` | `px-4` |
| Page padding (desktop) | `32px` | `px-8` |

- Use Tailwind's spacing scale exclusively. Do not use arbitrary values like `p-[13px]`.
