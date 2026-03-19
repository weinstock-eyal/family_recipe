# Mobile-First & PWA Coding Standards

## 1. Mobile-First Design (Tailwind CSS)

- **Base classes are mobile.** Always design for mobile screens FIRST. Default Tailwind classes must target mobile devices (e.g., `flex-col`, `p-4`, `w-full`).
- **Progressive enhancement.** Use responsive prefixes (`sm:`, `md:`, `lg:`) ONLY to adjust layout for larger tablet/desktop screens (e.g., `md:flex-row`, `md:grid-cols-2`). Never start with a desktop design and try to shrink it down.
- **Single-column by default.** Mobile layouts should be a single stacked column. Multi-column grids (`grid-cols-2`, `grid-cols-3`) are only allowed behind `sm:` or `md:` prefixes.
- **Full-width elements.** Buttons, inputs, and cards should be `w-full` on mobile. Constrain widths only on larger breakpoints.
- **No horizontal scroll.** Ensure no component causes horizontal overflow on a 320px-wide viewport. Use `overflow-x-hidden` on the body/main wrapper if needed, but fix the root cause.

## 2. Touch-Friendly UX (Ergonomics)

- **Touch targets.** ALL clickable elements (buttons, links, inputs, checkboxes, icon buttons) MUST have a minimum physical size of 44x44 pixels. Use `min-h-[44px] min-w-[44px]` or sufficient padding (e.g., `p-3`) to achieve this. This is a WCAG 2.5.5 requirement.
- **Thumb zone navigation.** Prefer bottom navigation bars or bottom-anchored action buttons for primary mobile interactions. Keep primary CTAs (like "Save Recipe", "Add to Grocery List") easily reachable at the bottom of the screen using `fixed bottom-0` or `sticky bottom-0` positioning.
- **Adequate spacing between targets.** Maintain at least `8px` (`gap-2`) between adjacent interactive elements to prevent mis-taps.
- **No hover-only interactions.** Never gate functionality behind `:hover` states. Hover effects are enhancements only — all actions must be accessible via tap. Use `hover:` classes only alongside equivalent focus/active states.
- **Swipe-friendly patterns.** For lists of items (e.g., recipes, grocery items), consider swipe-to-delete or swipe-to-action patterns where appropriate. Use `touch-action: pan-y` on scrollable lists to avoid conflicts.

## 3. Progressive Web App (PWA) Standards

### Manifest

- The project must maintain a valid `manifest.json` (or Next.js metadata manifest) configured with:
  - `name` and `short_name` (Hebrew)
  - `theme_color` and `background_color` matching the app's color palette
  - `display: "standalone"` for native app feel
  - `dir: "rtl"` and `lang: "he"`
  - `start_url: "/"`
  - `scope: "/"`
  - Icon arrays: at minimum 192x192 and 512x512 PNG icons, plus a maskable icon variant
- The manifest enables the browser's "Add to Home Screen" prompt on supported devices.

### Service Worker & Offline Support

- The app must implement a Service Worker (via `next-pwa` or `@serwist/next`) to:
  - **Pre-cache** the App Shell (layout, navigation, fonts, icons, CSS/JS bundles).
  - **Cache API responses** with a stale-while-revalidate strategy for recipe data, so recently viewed recipes are available offline.
  - **Serve a custom offline page** (`/offline`) when the network is unavailable. Users should never see the browser's default "No Internet" page.
- Static assets (images, fonts) should use a cache-first strategy with a reasonable TTL.

### App-Like Behavior

- When running in standalone mode, hide browser-specific UI hints (e.g., "share" buttons that only work in-browser).
- Detect standalone mode via `window.matchMedia('(display-mode: standalone)')` and adjust UI accordingly.
- Support pull-to-refresh patterns on recipe lists (native behavior in standalone mode).

## 4. Mobile Viewport & Safe Areas

- **Viewport meta.** The root layout must include proper viewport configuration: `width=device-width, initial-scale=1, viewport-fit=cover`. In Next.js, set this via the `viewport` export in the root layout.
- **Disable accidental zoom.** Apply `touch-action: manipulation` globally to buttons, links, and inputs to prevent accidental double-tap zoom. Add this to `globals.css`:
  ```css
  button, a, input, select, textarea {
    touch-action: manipulation;
  }
  ```
- **Notch & safe areas.** Account for modern smartphone notches and home indicator bars. Use `env(safe-area-inset-*)` CSS variables:
  - Bottom navigation / sticky footers: `pb-[env(safe-area-inset-bottom)]`
  - Top headers in standalone mode: `pt-[env(safe-area-inset-top)]`
  - Side padding: consider `pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]` for landscape
- **Status bar styling.** Set `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` for iOS standalone mode so the app content flows under the status bar.

## 5. Mobile Performance

- **Image optimization.** Always use Next.js `<Image>` with responsive `sizes` attribute. Serve appropriately sized images — do not send desktop-sized images to mobile. Example:
  ```tsx
  <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
  ```
- **Lazy loading.** Images below the fold must use `loading="lazy"` (default in Next.js `<Image>`). Only the first visible recipe card image should be `priority`.
- **Minimal JavaScript.** Prefer Server Components by default. Client Components should be leaf nodes with minimal JS. Every KB matters on mobile networks.
- **Font subsetting.** The Heebo font is already subsetted to `hebrew` and `latin`. Do not add unnecessary font weights or subsets.
- **Avoid layout shifts (CLS).** Always set explicit `width` and `height` (or aspect-ratio) on images and media. Use skeleton loaders with fixed dimensions matching the expected content size.

## 6. Mobile-Specific UI Patterns

- **Bottom sheets over modals.** On mobile, prefer bottom sheets (slide-up from bottom) over centered modals. Bottom sheets are easier to reach and dismiss.
- **Sticky action bars.** For forms and detail pages, use a sticky bottom bar for the primary action button instead of placing it at the end of a long scroll.
- **Collapsible sections.** Long content (like ingredient lists or instructions) should be collapsible/expandable on mobile to reduce scroll fatigue.
- **Input types.** Use appropriate HTML input types for mobile keyboards: `type="email"` for email, `type="tel"` for phone, `inputmode="numeric"` for quantities, `inputmode="search"` for search fields.
- **Avoid fixed headers + fixed footers simultaneously** stealing too much vertical space. If both exist, keep their combined height under 120px on mobile.

## 7. Testing & Validation

- Always test layouts at these viewport widths: **320px** (small phone), **375px** (iPhone SE/standard), **390px** (iPhone 14), **768px** (tablet).
- Use Chrome DevTools device emulation as a baseline, but verify on real devices when possible.
- Run Lighthouse PWA audit (`lighthouse --preset=desktop,mobile`) and ensure a score of 90+ on PWA and Performance categories.
- Validate the manifest at `manifest.json` using Chrome DevTools > Application > Manifest.
