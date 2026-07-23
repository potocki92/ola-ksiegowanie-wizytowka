# Architecture

Static Astro site today; per [AGENTS.md](./AGENTS.md) it's meant to grow into
a larger platform (customer accounts, invoices, PocketBase-backed data,
dashboard). Only what's actually used is set up so far — PocketBase and Zod
are intentionally not installed until a feature needs them.

## Structure

```
src/
├── assets/fonts/     self-hosted woff2 files (Bricolage Grotesque, Hanken Grotesk)
├── components/
│   ├── ui/           generic presentational pieces (e.g. Icon.astro)
│   ├── layout/        page chrome: Header, Footer, MobileStickyCta
│   └── sections/      one component per homepage section (Hero, Services, Faq, ...)
├── layouts/           Layout.astro — head/meta/SEO/JSON-LD, imports global.css
├── pages/             file-based routes; index.astro composes the sections
└── styles/            global.css — Tailwind import, @theme design tokens, @font-face
```

## Conventions

- **Styling**: Tailwind CSS v4, configured CSS-first via `@theme` in
  `src/styles/global.css` (colors, fonts, keyframes become named utilities
  like `bg-accent`, `font-display`). Fluid sizes use Tailwind arbitrary
  values (`text-[clamp(...)]`) since Tailwind has no native `clamp()`
  utility. Custom base-layer CSS (the `a`, `body`, `h1`–`h3` defaults) is
  wrapped in `@layer base` — Tailwind v4 ships its own utilities inside
  cascade layers, and unlayered plain CSS would otherwise always beat them
  regardless of selector specificity.
- **Interactivity**: no client-side framework. Each section that needs
  behavior (mobile menu, FAQ accordion, contact form) ships its own small
  inline `<script>` — per AGENTS.md, `client:*` directives are avoided
  unless a real interaction requires a framework island, and none of this
  page's interactivity does.
- **Data**: page copy that repeats (FAQ items, the About timeline) is a
  typed local array in its section component's frontmatter, not a shared
  `lib`/`features` module — it's one-page marketing content, not business
  logic reused elsewhere yet.
- **SEO**: title/description/canonical/OG/Twitter meta and a
  `AccountingService` JSON-LD block live in `Layout.astro`. `astro.config.mjs`
  has a `site` TODO — set it once a production domain exists so canonical
  URLs and the sitemap resolve to absolute URLs.

## Future phases

When PocketBase-backed features (accounts, invoices, dashboard) are added,
follow AGENTS.md's data-flow rule: `Component → Feature Service → PocketBase
Client → Database`, with each feature living under `src/features/<name>/`
(`*.service.ts`, `*.types.ts`, `*.mapper.ts`) and Zod validating anything
crossing a trust boundary (form submissions, PocketBase responses).
