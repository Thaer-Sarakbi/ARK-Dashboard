# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured yet.

## Stack

- **Next.js 16** with App Router (`src/app/`)
- **React 19**
- **TypeScript** (strict mode, `@/*` maps to `src/*`)
- **Tailwind CSS v4** — configured via `@import "tailwindcss"` in `globals.css` using the new `@theme` inline API (no `tailwind.config.js`)
- **ESLint v9** flat config (`eslint.config.mjs`) with `eslint-config-next` core-web-vitals + TypeScript rules

## Architecture

This is an early-stage dashboard project. The only application code so far is the default Next.js App Router scaffold:

- `src/app/layout.tsx` — root layout with Geist Sans/Mono fonts and full-height flex body
- `src/app/globals.css` — global styles with CSS custom properties for `--background`/`--foreground` and dark mode via `prefers-color-scheme`
- `src/app/page.tsx` — placeholder home page

All new routes go under `src/app/` following App Router conventions (folders become routes, `page.tsx` is the route entry, `layout.tsx` wraps children).
