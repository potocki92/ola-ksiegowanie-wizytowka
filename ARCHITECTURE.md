# Architecture

Mostly-static Astro site; per [AGENTS.md](./AGENTS.md) it's meant to grow into
a larger platform (customer accounts, invoices, PocketBase-backed data,
dashboard). Only what's actually used is set up so far — PocketBase is
intentionally not installed until a feature needs it. Zod arrived with the
contact form, which needed validation at a trust boundary.

Every page is prerendered at build time. The two exceptions are the contact
and intake endpoints, which opt out via `export const prerender = false` and
ship as serverless functions through `@astrojs/vercel`.

## Structure

```
src/
├── assets/fonts/     self-hosted woff2 files (Plus Jakarta Sans, Hanken Grotesk)
├── components/
│   ├── ui/           generic presentational pieces (Icon, Button, form/*)
│   ├── layout/        page chrome: Header, Footer, MobileStickyCta
│   └── sections/      one component per homepage section (Hero, Services, Faq, ...),
│                      plus contact/ and intake/ for the two standalone form pages
├── features/
│   ├── contact/       contact form: schema, service, email content
│   └── intake/        intake questionnaire: schema, service, email content
├── layouts/           Layout.astro — head/meta/SEO/JSON-LD, imports global.css
├── lib/
│   └── email/         shared Brevo transport, HTML email shell, env config —
│                      used by both contact and intake
├── pages/             file-based routes; index.astro composes the sections
│   └── api/           on-demand endpoints (the only non-static routes):
│                      contact.ts, intake.ts
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

## Shared email infrastructure (`lib/email/`)

Both forms below send mail the same way, so the transport lives once in
`lib/email/`, not inside either feature:

- `provider.ts` — the only module aware of Brevo. Plain `fetch`, no SDK.
  Swapping in Resend once a custom domain exists means rewriting this file
  alone; `EmailMessage` stays put.
- `layout.ts` — table-based HTML shell plus `escapeHtml`. Submitted text is
  interpolated into email HTML, so escaping is a security boundary, not
  formatting.
- `email.config.ts` — reads and validates env vars. Reads both `process.env`
  and `import.meta.env`, because `astro dev` populates the latter while Vercel
  populates the former at runtime. One sender identity and one notification
  inbox serve the whole site, so both forms read the same variables.

Environment variables are documented in [.env.example](./.env.example).

## Contact form

The first vertical slice through the layering AGENTS.md prescribes. Flow:

```
ContactForm.astro  →  POST /api/contact  →  contact.service  →  lib/email/provider  →  Brevo
```

`contact.schema.ts` is the Zod schema; the endpoint trusts nothing from the
browser and revalidates every field server-side.

Two emails go out per submission and they are not equal in weight. The owner
notification is the only channel by which a lead actually arrives, so its
failure surfaces to the user as an error. The sender's confirmation is a
courtesy — it is sent afterwards and its failure is logged but never fails the
request, otherwise a client would refill a form whose message already landed.

Anti-spam is a honeypot field, a minimum fill time, and a per-IP counter. The
counter lives in serverless memory, so it is a guard against crude floods
rather than real rate limiting; a durable one would need Vercel KV.

## Intake questionnaire ("ankieta startowa")

A longer, ~15-field brief that Ola sends directly to a prospective client
before their call — not a form visitors find on their own, so
`ankieta-startowa.astro` carries `noindex` and isn't linked from the header or
footer. Same layering and anti-spam pattern as the contact form:

```
IntakeForm.astro  →  POST /api/intake  →  intake.service  →  lib/email/provider  →  Brevo
```

`intake.options.ts` centralizes the label text for every `select` field's
options so the form markup and the owner-notification email summary don't
duplicate the same Polish copy in two places.

## Future phases

When PocketBase-backed features (accounts, invoices, dashboard) are added,
follow AGENTS.md's data-flow rule: `Component → Feature Service → PocketBase
Client → Database`, with each feature living under `src/features/<name>/`
(`*.service.ts`, `*.types.ts`, `*.mapper.ts`) and Zod validating anything
crossing a trust boundary (form submissions, PocketBase responses).
