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
│   ├── ui/           generic presentational pieces (Icon, Button, form/ —
│   │                  fields, and the shared anti-spam inputs)
│   ├── layout/        page chrome: Header, Footer, MobileStickyCta
│   └── sections/      one component per homepage section (Hero, Services, Faq, ...),
│                      plus contact/ and intake/ for the two standalone form pages
│                      and error/ for the shared 404 / 500 error state
├── features/
│   ├── contact/       contact form: schema, service, email content
│   └── intake/        intake questionnaire: schema, service, email content
├── layouts/           Layout.astro — head/meta/SEO/JSON-LD, imports global.css;
│                      ErrorLayout.astro — minimal shell for 404 / 500
├── lib/
│   ├── email/         shared Brevo transport, HTML email shell, env config —
│   │                  used by both contact and intake
│   └── forms/         form-submission.ts — the browser-side submit flow both
│                      forms run (fetch, errors, success state)
├── pages/             file-based routes; index.astro composes the sections,
│                      404.astro and 500.astro are Astro's error pages
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
  logic reused elsewhere yet. The exception is `src/data/` — pricing and
  `company.ts` (brand + registered-business details), which several
  unrelated places read at once.
- **SEO**: title/description/canonical/OG/Twitter meta and a
  `AccountingService` JSON-LD block live in `Layout.astro`. `astro.config.mjs`
  has a `site` TODO — set it once a production domain exists so canonical
  URLs and the sitemap resolve to absolute URLs.

## Dane firmy

Marka i podmiot prowadzący działalność to dwie różne rzeczy, więc obie mieszkają
w jednym pliku — `src/data/company.ts`. Każde miejsce, które pokazuje nazwę,
NIP, adres, telefon czy e-mail, importuje je stamtąd, zamiast trzymać własną
kopię stringa.

| Co zmieniasz | Gdzie w `src/data/company.ts` | Gdzie się pojawi |
|---|---|---|
| Nazwa marki | `brand.name` | logo, `<title>`, JSON-LD `name`, stopka maili |
| Księgowa | `brand.accountant` | podpisy w mailach, sekcja „O mnie" |
| Nazwa podmiotu | `legal.name` | klauzula RODO |
| NIP i adres | `legal.nip`, `legal.address` | stopka strony, klauzula RODO, stopka maili, JSON-LD |
| E-mail, telefon | `contact` | klauzula RODO, stopka maili, JSON-LD |

Gdy Aleksandra zarejestruje własną działalność, zmienia się wyłącznie obiekt
`legal` — reszta pliku i pozostałe komponenty bez zmian. Ulicę dodaje się przez
opcjonalne pole `legal.address.street`: wchodzi wtedy sama do
`companyAddressLine` i do `streetAddress` w JSON-LD.

Placeholder `{{...}}` zostawiony w `legal` wysypuje build produkcyjny — dane
rejestrowe idą do klauzuli RODO i stopki, więc nie mogą wyjechać na produkcję
niewypełnione. W dev to samo sprawdzenie daje tylko ostrzeżenie w konsoli.

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
rather than real rate limiting; a durable one would need Vercel KV. The
honeypot and fill-time checks are currently commented out in
`api/contact.ts` — see the TODO there.

Both forms render the two technical fields from
`components/ui/form/SpamProtectionFields.astro` and run the same browser-side
submit flow from `lib/forms/form-submission.ts`; the honeypot is named
`website` in both, deliberately unlike any real field a password manager would
autofill.

## Intake questionnaire (`/ankieta`)

A ~15-field brief that Ola sends straight to a prospective client before their
call (SMS, WhatsApp, e-mail) — not a form visitors find on their own, so
`ankieta.astro` carries `noindex` and isn't linked from the header or footer.
Same layering and anti-spam pattern as the contact form:

```
IntakeForm.astro  →  POST /api/intake  →  intake.service  →  lib/email/provider  →  Brevo
```

**Gdzie czego szukać** (i co ruszyć, dodając kolejne pytanie):

| Warstwa | Plik | Odpowiedzialność |
|---|---|---|
| Strona | `pages/ankieta.astro` | tylko kompozycja: `Layout` + nagłówek + `IntakeForm` |
| Formularz | `components/sections/intake/IntakeForm.astro` | składa sekcje, przycisk, błąd, kartę sukcesu |
| Sekcja pytań | `components/sections/intake/sections/Intake*Section.astro` | pola jednej grupy tematycznej |
| Ramka sekcji | `components/sections/intake/IntakeFormSection.astro` | nagłówek + separator jednej grupy |
| Pola warunkowe | `components/sections/intake/intake-conditional-fields.ts` | pokazywanie/chowanie pól zależnych |
| Karta sukcesu | `components/sections/intake/IntakeSuccess.astro` | dwa warianty (z kopią / bez kopii) |
| Walidacja i typy | `features/intake/intake.schema.ts` | Zod, granica zaufania |
| Opcje selectów | `features/intake/intake.options.ts` | wartości + etykiety + skróty do tematu maila |
| Prezentacja danych | `features/intake/intake.summary.ts` | sekcje/pola/etykiety wspólne dla obu maili |
| Wysyłka | `features/intake/intake.service.ts` | kolejność maili i ich waga |
| Maile | `features/intake/email/` | `owner-notification.ts`, `confirmation.ts`, `summary-sections.ts` |
| HTTP | `pages/api/intake.ts` | odczyt, walidacja, antyspam, rate limit, JSON |

Dodanie pytania to zwykle trzy pliki: pole w odpowiednim `Intake*Section.astro`,
reguła w `intake.schema.ts` i — dla selecta — opcje w `intake.options.ts`. Oba
maile podchwycą je same, o ile pole trafi do `intake.summary.ts`.

**Jedno źródło prezentacji.** `intake.summary.ts` zamienia surowe odpowiedzi
(`ryczalt`, `existing`) na czytelne sekcje z etykietami. Powiadomienie dla Oli
i kopia dla klienta renderują tę samą strukturę przez
`email/summary-sections.ts` — różnią się tematem, wstępem i tym, czy puste pola
są widoczne (Ola widzi „nie podano", klient nie widzi pustych wierszy wcale).
Bez tego każda zmiana słownictwa wymagałaby poprawki w dwóch szablonach.

**Częściowa porażka wysyłki.** Powiadomienie do Oli jest krytyczne — jego błąd
kończy zgłoszenie błędem. Kopia dla klienta jest dodatkiem, więc jej porażka
nie unieważnia przyjętej ankiety; zamiast tego `intake.service` zwraca
`clientCopySent: false`, endpoint przekazuje tę flagę w JSON-ie, a karta
sukcesu wybiera wariant komunikatu. Dzięki temu interfejs nigdy nie obiecuje
maila, którego nie wysłaliśmy, i nigdy nie prosi o ponowne wypełnienie danych,
które już dotarły.

## Strony błędów (404, 500)

`src/pages/404.astro` obsługuje nieistniejące adresy, `src/pages/500.astro` —
nieobsłużone błędy tras renderowanych on-demand. Obie to natywny mechanizm
Astro, bez własnego routingu i bez przekierowań: kod pochodzi z nazwy pliku.

- **Status HTTP.** Astro buduje te dwie strony płasko do `404.html` i
  `500.html` (`STATUS_CODE_PAGES` — omijają `build.format: "directory"`).
  Adapter Vercela dokłada wtedy do `config.json` catch-all
  `{ src: "/.*", dest: "/404.html", status: 404 }` — ale **tylko jeśli trasa
  `/404` istnieje**. Bez tego pliku Vercel pokazuje własny, generyczny ekran.
- **Zakres 500.** Custom 500 dotyczy wyłącznie tras renderowanych on-demand.
  Tutaj `output` jest statyczny, więc wszystkie strony są prerenderowane i ta
  strona nie zastąpi błędu builda — build po prostu się wysypie. Realnie jest
  siatką bezpieczeństwa dla nieoczekiwanego wyjątku w trasach on-demand (dziś
  tylko `api/*`, które łapią własne błędy i zawsze odpowiadają JSON-em) oraz
  gotową stroną, gdy któraś trasa dostanie `prerender = false`. Kontrakt API
  zostaje JSON-owy: nie ma tu middleware ani przekierowań na `/500`.
- **Brak wycieku szczegółów.** Astro przekazuje do `500.astro` prop `error`.
  Celowo go nie czytamy — niesie komunikat, stos i ścieżki serwera. Szczegóły
  zostają w logach Vercela, użytkownik dostaje ogólny komunikat. Nie
  generujemy też sztucznego „Error ID": nie ma dziś czego z nim skorelować.
- **Wspólna prezentacja.** Cały markup ekranu błędu żyje w
  `components/sections/error/ErrorState.astro` (kod, nagłówek, opis, dwa CTA
  na `Button.astro`). Strony wnoszą wyłącznie treść i metadane.
- **`ErrorLayout.astro`, nie `Layout.astro`.** Zwykły layout wysyła rzeczy,
  które na ekranie błędu są zbędne albo wprost błędne: `canonical`, JSON-LD
  `AccountingService`, meta OG/Twitter, Speed Insights i bundle animacji.
  Alternatywa — trzy flagi wyłączające na layoucie używanym przez trzy realne
  strony — byłaby konfigurowalnością na zapas. `ErrorLayout` ma ~50 linii,
  `noindex` na stałe i nie ładuje żadnego skryptu strony.
- **SEO.** Obie strony są `noindex, nofollow`, bez `canonical` i bez danych
  strukturalnych. Nie ma ich w nawigacji ani stopce.

## Future phases

When PocketBase-backed features (accounts, invoices, dashboard) are added,
follow AGENTS.md's data-flow rule: `Component → Feature Service → PocketBase
Client → Database`, with each feature living under `src/features/<name>/`
(`*.service.ts`, `*.types.ts`, `*.mapper.ts`) and Zod validating anything
crossing a trust boundary (form submissions, PocketBase responses).
