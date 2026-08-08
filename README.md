<p align="center">
  <img src="src/assets/logo.png" alt="Logo — Aleksandra Potocka, Księgowość" width="96" />
</p>

<h1 align="center">Aleksandra Potocka — Księgowość</h1>

<p align="center">
  Strona-wizytówka biura księgowego, zbudowana w Astro + TypeScript + Tailwind CSS.
</p>

Jednostronicowa witryna marketingowa dla jednoosobowego biura księgowego
(Jelenia Góra / Bolesławiec, obsługa zdalna w całej Polsce). Prezentuje ofertę,
cennik i doświadczenie księgowej, a odwiedzający mogą od razu zapytać o
bezpłatną konsultację przez formularz kontaktowy.

## Zrzuty ekranu

### Desktop

| Hero | Usługi | Cennik | Kontakt |
|---|---|---|---|
| ![Hero — desktop](docs/screenshots/desktop-hero.png) | ![Usługi — desktop](docs/screenshots/desktop-uslugi.png) | ![Cennik — desktop](docs/screenshots/desktop-cennik.png) | ![Kontakt — desktop](docs/screenshots/desktop-kontakt.png) |

### Mobile

| Hero | Usługi | Cennik | Kontakt |
|---|---|---|---|
| <img src="docs/screenshots/mobile-hero.png" width="200" alt="Hero — mobile" /> | <img src="docs/screenshots/mobile-uslugi.png" width="200" alt="Usługi — mobile" /> | <img src="docs/screenshots/mobile-cennik.png" width="200" alt="Cennik — mobile" /> | <img src="docs/screenshots/mobile-kontakt.png" width="200" alt="Kontakt — mobile" /> |

## Sekcje strony

Strona (`src/pages/index.astro`) składa się z jednej długiej strony głównej,
podzielonej na następujące sekcje — każda to osobny komponent w
`src/components/`:

| Sekcja | Komponent | Opis |
|---|---|---|
| Nawigacja | `layout/Header.astro` | Sticky nagłówek z linkami do sekcji (scrollspy podświetla aktywny link), mobilne menu rozsuwane, przycisk „Bezpłatna konsultacja”. |
| Hero | `sections/Hero.astro` | Nagłówek strony, krótki opis oferty, dwa CTA („Umów konsultację” / „Zobacz cennik”), znaczki zaufania (UE Wrocław, 6 lat praktyki, 100% online) i portretowe zdjęcie z efektem paralaksy. |
| Używane programy | `sections/ToolsStrip.astro` | Pasek z logotypami/nazwami programów księgowych, z których korzysta biuro (Comarch Optima, Symfonia, Płatnik, Subiekt GT, Rachmistrz GT). |
| Usługi | `sections/Services.astro` | Siatka kafli z ofertą: prowadzenie JDG (zasady ogólne/liniowy/ryczałt), zakładanie JDG (CEIDG, ZUS), kadry i płace, roczne rozliczenia PIT — wraz z kaflami statystyk (cena od, % obsługi zdalnej). |
| Jak pracuję | `sections/ValueProps.astro` | Trzy karty na temat sposobu współpracy: stały kontakt, indywidualne podejście, księgowość w pełni online. |
| O mnie | `sections/About.astro` | Bio Aleksandry Potockiej (studia UE Wrocław, doradztwo podatkowe) i osobista linia czasu certyfikatów/kwalifikacji. |
| Cennik | `sections/Pricing.astro` | Widełki cenowe prowadzenia JDG (z VAT / bez VAT), co wchodzi w cenę, koszt założenia firmy oraz usługi dodatkowe (kadry i płace, PIT roczny). |
| Jak zaczynamy | `sections/process/ProcessSection.astro` | Cztery kroki onboardingu: bezpłatna konsultacja → umowa i pełnomocnictwo → przekazanie dokumentów → spokój i terminy. Kroki stoją na „sznurku”, który dorysowuje się przy scrollu — pionowo na mobile, poziomo od `lg`. |
| FAQ | `sections/Faq.astro` | Rozwijana lista najczęściej zadawanych pytań (akordeon). |
| Kontakt | `sections/contact/ContactSection.astro` | Dane kontaktowe (telefon, e-mail, zasięg działania) oraz formularz kontaktowy z ochroną antyspamową, wysyłający zapytanie na e-mail biura. |
| Stopka | `layout/Footer.astro` | Stopka z danymi firmy i linkiem do polityki prywatności. |
| Mobilne CTA | `layout/MobileStickyCta.astro` | Przypięty do dołu ekranu pasek z przyciskiem kontaktu, widoczny tylko na urządzeniach mobilnych. |

Osobnymi podstronami są `src/pages/polityka-prywatnosci.astro` — polityka
prywatności wymagana przy przetwarzaniu danych z formularza kontaktowego —
oraz `src/pages/ankieta-startowa.astro` — rozbudowana ankieta o działalności
klienta, wysyłana ręcznie (bez linku w menu/stopce) potencjalnym klientom
przed rozmową, żeby Ola mogła się do niej lepiej przygotować.

## Funkcjonalności

- **Formularz kontaktowy** (`features/contact/`) — walidacja danych po stronie
  serwera (Zod), ochrona przed spamem (honeypot + minimalny czas wypełnienia +
  licznik zgłoszeń per IP), wysyłka e-maila powiadomienia do biura oraz
  potwierdzenia dla klienta przez Brevo.
- **Ankieta startowa** (`features/intake/`, strona `/ankieta-startowa`) —
  rozbudowany, kilkunastopolowy formularz (dane kontaktowe, opis działalności,
  forma prawna i opodatkowania, VAT, zatrudnienie, obecna sytuacja) wysyłany
  bezpośrednio potencjalnym klientom przed rozmową. Ta sama ochrona
  antyspamowa i wysyłka e-mail co formularz kontaktowy — dzielą wspólną
  infrastrukturę mailową z `lib/email/`.
- **SEO** — tytuł, opis, meta Open Graph/Twitter oraz dane strukturalne
  `AccountingService` (JSON-LD) w `layouts/Layout.astro`.
- **Animacje** — subtelny efekt paralaksy na zdjęciu w hero, odkrywanie
  sekcji podczas scrollowania, animowane liczniki w statystykach — bez
  frameworka JS po stronie klienta, każda sekcja ma własny, mały inline
  `<script>`.
- **Responsywność** — pełne wsparcie mobile/desktop, mobilne menu i przypięte
  CTA na małych ekranach.

## Stack technologiczny

- [Astro 7](https://astro.build) — statyczne generowanie stron, plikowy
  routing
- TypeScript (strict)
- Tailwind CSS v4 (konfiguracja CSS-first przez `@theme`)
- [Zod](https://zod.dev) — walidacja danych z formularza
- [Brevo](https://www.brevo.com) — wysyłka e-maili transakcyjnych
- `@astrojs/vercel` — adapter wdrożenia (strona statyczna + jeden endpoint
  serverless dla formularza kontaktowego)

Więcej szczegółów architektonicznych: [ARCHITECTURE.md](./ARCHITECTURE.md).
Konwencje dla agentów AI pracujących w tym repo: [AGENTS.md](./AGENTS.md).

## Uruchomienie lokalnie

Wymagany Node.js `>=22.12.0`.

```bash
npm install
npm run dev       # serwer deweloperski na http://localhost:4321
npm run check     # sprawdzenie typów .astro/.ts
npm run build     # build produkcyjny do dist/
npm run preview   # podgląd builda produkcyjnego lokalnie
```

Aby formularz kontaktowy działał lokalnie, skopiuj `.env.example` do `.env`
i uzupełnij zmienne (klucz API Brevo, adresy e-mail nadawcy/odbiorcy
zgłoszeń) — szczegóły w samym pliku `.env.example`.

## Struktura projektu

```
src/
├── assets/            logo, self-hostowane fonty (.woff2)
├── components/
│   ├── ui/             elementy wielokrotnego użytku (Button, Icon, form/*)
│   ├── layout/          Header, Footer, MobileStickyCta
│   └── sections/        po jednym komponencie na sekcję strony głównej
├── features/
│   ├── contact/         walidacja formularza kontaktowego, szablony e-maili
│   └── intake/          walidacja ankiety startowej, szablony e-maili
├── layouts/             Layout.astro — head/meta/SEO/JSON-LD
├── lib/
│   ├── email/           wspólna wysyłka przez Brevo (provider, layout maila, config)
│   └── ...               drobne helpery (paralaksa, scroll-reveal, typografia)
├── pages/               routing plikowy; index.astro składa sekcje w jedną stronę
│   └── api/             endpointy serverless: contact.ts, intake.ts
└── styles/              global.css — import Tailwind + tokeny @theme
```

Pełny opis architektury i konwencji: [ARCHITECTURE.md](./ARCHITECTURE.md).

## Wdrożenie

Strona jest wdrażana na [Vercel](https://vercel.com) przez adapter
`@astrojs/vercel` — większość stron jest prerenderowana statycznie, a
formularz kontaktowy działa jako pojedyncza funkcja serverless. Domena
produkcyjna nie jest jeszcze skonfigurowana w `astro.config.mjs` (zobacz TODO
w tym pliku).
