# Architecture

Mostly-static Astro site; per [AGENTS.md](./AGENTS.md) it's meant to grow into
a larger platform (customer accounts, invoices, PocketBase-backed data,
dashboard). Only what's actually used is set up so far — PocketBase is
intentionally not installed until a feature needs it. Zod arrived with the
contact form, which needed validation at a trust boundary.

Every page is prerendered at build time. The one exception is the contact
endpoint, which opts out via `export const prerender = false` and ships as a
serverless function through `@astrojs/vercel`.

## Structure

```
src/
├── assets/fonts/     self-hosted woff2 files (Fraunces, Hanken Grotesk, Tenor Sans)
├── components/
│   ├── ui/           generic presentational pieces (Icon, Button, form/*)
│   ├── layout/        page chrome: Header, Footer, MobileStickyCta
│   └── sections/      one component per homepage section (Hero, Services, Faq, ...)
├── features/
│   └── contact/       form validation, email templates, Brevo transport
├── layouts/           Layout.astro — head/meta/SEO/JSON-LD, imports global.css
├── pages/             file-based routes; index.astro composes the sections
│   └── api/contact.ts on-demand endpoint (the only non-static route)
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

## Contact form

The first vertical slice through the layering AGENTS.md prescribes. Flow:

```
ContactForm.astro  →  POST /api/contact  →  contact.service  →  email/provider  →  Brevo
```

- `contact.schema.ts` — Zod schema; the endpoint trusts nothing from the browser
  and revalidates every field server-side.
- `contact.config.ts` — reads and validates env vars. Reads both `process.env`
  and `import.meta.env`, because `astro dev` populates the latter while Vercel
  populates the former at runtime.
- `email/provider.ts` — the only module aware of Brevo. Plain `fetch`, no SDK.
  Swapping in Resend once a custom domain exists means rewriting this file
  alone; `EmailMessage` stays put.
- `email/layout.ts` — table-based HTML shell plus `escapeHtml`. Submitted text
  is interpolated into email HTML, so escaping is a security boundary, not
  formatting.

Two emails go out per submission and they are not equal in weight. The owner
notification is the only channel by which a lead actually arrives, so its
failure surfaces to the user as an error. The sender's confirmation is a
courtesy — it is sent afterwards and its failure is logged but never fails the
request, otherwise a client would refill a form whose message already landed.

Anti-spam is a honeypot field, a minimum fill time, and a per-IP counter. The
counter lives in serverless memory, so it is a guard against crude floods
rather than real rate limiting; a durable one would need Vercel KV.

Environment variables are documented in [.env.example](./.env.example).

## Future phases

When PocketBase-backed features (accounts, invoices, dashboard) are added,
follow AGENTS.md's data-flow rule: `Component → Feature Service → PocketBase
Client → Database`, with each feature living under `src/features/<name>/`
(`*.service.ts`, `*.types.ts`, `*.mapper.ts`) and Zod validating anything
crossing a trust boundary (form submissions, PocketBase responses).
