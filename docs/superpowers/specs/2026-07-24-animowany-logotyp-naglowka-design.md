# Animowany logotyp nagłówka — design

Data: 2026-07-24

## Cel

Zastąpić tekst „Potocka" w nagłówku pełnym logotypem z wizytówki: granatowe
`ALEKSANDRA POTOCKA` nad złotym `KSIĘGOWOŚĆ` w kreskach. Podczas przewijania
litery nazwiska znikają **od ostatniej do pierwszej**, aż zostaje sam znaczek
logo i `KSIĘGOWOŚĆ`.

## Ustalenia

- **Czcionka: Tenor Sans** (SIL OFL, self-hosting). Wybrana wzrokowo z sześciu
  kandydatek renderowanych w tym samym lockupie. Ma `latin-ext`, więc Ę/Ś/Ć
  działają — zweryfikowane w API Google Fonts, nie założone.
- **Animacja powiązana z pozycją scrolla**, nie progiem. Przewijanie w górę
  przywraca litery w odwrotnej kolejności.
- **Wariant zwijania: kurczący się pasek.** Po zniknięciu ostatniej litery linia
  nazwiska zapada się do zera i nagłówek robi się niższy.
- **Kolorystyka 1:1 z wizytówki, złoto tylko w logotypie.** Reszta strony
  zostaje na indygo `#4f5bf2`. Logotyp jest świadomą wyspą stylistyczną.
- **Pełny lockup także na mobile** (nie skrócony, nie ukryty).
- **Złoto przyciemnione do `#8a6d2f`** — patrz „Kontrast złota".
- **Footer przechodzi na statyczny lockup**, żeby marka nie miała trzech różnych
  wersji w jednym projekcie.

## Podejście techniczne

Vanilla JS: listener `scroll` z `{ passive: true }`, guardem `ticking` i
`requestAnimationFrame` — dokładnie wzorzec, który `Header.astro` już stosuje dla
scrollspy (linie 135–149).

Odrzucone:

- **CSS `animation-timeline: scroll()`** — w Firefoksie wciąż za flagą
  (`layout.css.scroll-driven-animations.enabled`), więc i tak potrzebny byłby
  JS-owy fallback. Podwójna implementacja bez zysku przy 18 spanach.
- **GSAP ScrollTrigger** — ~50 kB do projektu, który nie ma dziś żadnej
  zależności runtime poza Astro.

## Zakres zmian

### 1. `src/assets/fonts/` + `src/styles/global.css`

Pobrać `woff2` Tenor Sans dla `latin` i `latin-ext`, zapisać jako
`tenor-sans-latin.woff2` i `tenor-sans-latin-ext.woff2`. Dodać dwa bloki
`@font-face` z tymi samymi `unicode-range`, których używają istniejące kroje,
oraz token w `@theme`:

```css
--font-logo: "Tenor Sans", serif;
```

Tenor Sans ma jedną grubość (400) — bez zakresu `font-weight`.

Świadomie **nie** stosujemy mikro-subsetu przez `&text=`: oszczędza ~28 kB, ale
po zmianie napisu brakujące glify wyświetliłyby się jako puste prostokąty bez
żadnego sygnału, skąd problem.

Nowe tokeny kolorów w `@theme`:

```css
--color-brand-navy: #16233a;
--color-brand-gold: #8a6d2f;
```

### 2. `src/components/ui/Logo.astro`

Zostaje jako znaczek + opcjonalny zwykły tekst. Zmiany porządkowe w kodzie,
który i tak dotykamy:

- usunąć martwe `font-display font-extrabold text-white` ze `<span>`
  otaczającego `<Image>` — nie ma tam tekstu, na który mogłyby działać,
- usunąć `text-sm` / `text-base` z mapy `badgeSize` z tego samego powodu,
- `alt="Logo"` → `alt=""` (obrazek jest dekoracyjny; nazwę niesie `aria-label`
  linku w `BrandLockup`).

### 3. `src/components/ui/BrandLockup.astro` — nowy

Jedna odpowiedzialność: animowany logotyp. Składa `<Logo showName={false} />`
z dwuliniowym lockupem i zawiera własny `<script>` ze scrollem. Nie wie nic
o nawigacji.

```ts
interface Props {
  href?: string;
  size?: "sm" | "lg";      // sm → footer, lg → nagłówek
  animated?: boolean;      // domyślnie true
  class?: string;
}
```

Struktura — `Tag = href ? "a" : "div"`, tak jak robi to dziś `Logo.astro`
(w overlayu menu mobilnego i w footerze logotyp nie jest linkiem, a `<a>` bez
`href` nie jest fokusowalne):

```astro
<Tag href={href} role={href ? undefined : "img"}
     aria-label="Aleksandra Potocka — Księgowość, strona główna">
  <Logo showName={false} size={size} />
  <span class="lockup">
    <span class="name" aria-hidden="true"><!-- 18 × <span class="l"> --></span>
    <span class="tagline" aria-hidden="true">
      <i></i>KSIĘGOWOŚĆ<i></i>
    </span>
  </span>
</Tag>
```

Kreski wokół `KSIĘGOWOŚĆ` to puste `<i>` stylowane na `1px` tło, nie znaki
myślnika — daje to kontrolę nad długością i pozwala im skalować się razem
z lockupem. W wariancie nie-linku `aria-label` niesie `role="img"`, żeby nazwa
dostępna miała się na czym zaczepić.

Litery generowane przez `{[..."ALEKSANDRA POTOCKA"].map(...)}` — `.map()` w Astro
nie wstawia białych znaków między elementami, co jest tu istotne, bo spany są
`inline-block`. Spacja renderowana jako własny span z `&nbsp;`, żeby zwijała się
razem z literami.

### 4. `src/components/layout/Header.astro`

- `<Logo href={...} size="lg" />` → `<BrandLockup href={...} size="lg" />`
- linia 60: hardkodowane `<span>Potocka</span>` w overlayu menu mobilnego →
  `<BrandLockup animated={false} size="sm" />`

### 5. `src/components/layout/Footer.astro`

`<Logo size="sm" name="Aleksandra Potocka · Księgowość" />` →
`<BrandLockup animated={false} size="sm" />`

## Mechanika animacji

Wejście: `window.scrollY`. Droga pełnego zwinięcia: **160 px** (wartość startowa
do dostrojenia).

```
p       = min(1, max(0, scrollY / 160))
visible = ceil((1 - p) * 18)          // "ALEKSANDRA POTOCKA" = 18 znaków
```

Litery o indeksie `>= visible` dostają `.is-gone`:

```css
.l { display: inline-block; overflow: hidden; max-width: 1.6em; opacity: 1;
     transition: max-width .22s ease, opacity .16s ease; }
.l.is-gone { max-width: 0; opacity: 0; }
```

`max-width: 0` przy `overflow: hidden` zabiera także tracking, więc litery
faktycznie oddają szerokość, a nie zostawiają dziur.

Przy `visible === 0` nagłówek dostaje `.is-collapsed`: `max-height: 0` na linii
nazwiska, `gap: 0` w lockupie, mniejszy padding pionowy paska.

Nawigacja nie drga — nagłówek jest na `justify-between`, więc linki są dociśnięte
do prawej niezależnie od szerokości logotypu.

Klasy przełączane tylko przy faktycznej zmianie `visible`, więc typowy tick to
zero operacji na DOM.

### Histereza

Sticky element leży w normalnym flow, więc skurczenie paska skraca dokument
o ~14 px i treść pod spodem podskakuje. **Nie powstaje przez to pętla zwrotna** —
wejściem jest `scrollY`, która przy tym się nie zmienia. Jest to jednorazowe
drgnięcie, nieusuwalne bez rezygnacji z odzyskiwania miejsca (czyli z wybranego
wariantu).

Usuwalny jest natomiast gorszy objaw: zatrzymanie scrolla dokładnie na progu
powodowałoby migotanie tych 14 px. Dlatego próg jest niesymetryczny:

- zwinięcie przy `scrollY >= 160`
- rozwinięcie dopiero przy `scrollY < 140`

### Rozmiary

`font-size` i `letter-spacing` przez `clamp()`, żeby lockup schodził płynnie
zamiast łamać się skokowo. Wartości startowe:

- nazwisko: `clamp(10px, 2.6vw, 14px)` / tracking `clamp(.18em, .8vw, .28em)`
- `KSIĘGOWOŚĆ`: `clamp(7px, 1.8vw, 9px)` / tracking `clamp(.24em, 1.2vw, .40em)`

Rachunek dla najgorszego przypadku (320 px): nazwisko schodzi do dolnej granicy
**10 px**, przy trackingu `.28em` daje to 18 × 0,91em × 10px ≈ **164 px**.
Dostępne miejsce przy paddingu 18 px, znaczku 50 px, hamburgerze 44 px
i odstępach ≈ **170 px**. Mieści się, ale bez zapasu — jeśli pomiar na żywo tego
nie potwierdzi, pierwszą rzeczą do zmniejszenia jest znaczek logo na mobile,
nie tracking.

10 px wersalików to granica czytelności i świadomy koszt decyzji o pełnym
lockupie na mobile.

### `scroll-padding-top`

`global.css` linia 127 ma dziś `70px`. Kotwice z menu odpalają się zawsze
w stanie zwiniętym, więc wartość trzeba zsynchronizować ze **zwiniętą** wysokością
paska — zmierzyć po implementacji, nie zgadywać.

## Kontrast złota

`#b3924f` na tle `#fbfbfd` daje **2,88:1**. WCAG 1.4.3 wprost wyłącza logotypy
i nazwy marek z wymogu kontrastu, więc formalnie jest to zgodne. Mimo to
`KSIĘGOWOŚĆ` jest jedynym miejscem w nagłówku mówiącym, czym firma się zajmuje,
i przy ~9 px czyta się to źle.

Przyjęte: **`#8a6d2f` → 4,78:1**, powyżej progu 4,5:1, nadal czytelne jako złoto.

Dla porównania granat `#16233a` na tym samym tle: 15,4:1.

## Dostępność

- Kontener liter i tagline: `aria-hidden="true"` — bez tego część czytników
  przeliteruje „A-L-E-K-S…".
- `<a>` niesie `aria-label="Aleksandra Potocka — Księgowość, strona główna"`.
- `<Image>` znaczka: `alt=""` (dekoracyjny, nazwę niesie `aria-label`).
- `prefers-reduced-motion: reduce` → `transition: none` na literach i zwijanej
  linii. Stan nadal podąża za scrollem, tylko przeskakuje zamiast płynąć.

## Weryfikacja

Projekt nie ma runnera testów — `package.json` zawiera wyłącznie `astro check`
i `astro build`. Nie powstanie więc automatyczny test kolejności znikania liter.

- `npm run check` — bez błędów
- `npm run build` — przechodzi
- ręcznie w `npm run dev`, na 1440 / 768 / 360 / 320 px:
  - litery znikają od ostatniej do pierwszej,
  - scroll w górę przywraca je w odwrotnej kolejności,
  - brak poziomego przewijania na żadnej szerokości,
  - linki nawigacji nie przesuwają się w poziomie,
  - zwinięta wysokość paska zgadza się ze `scroll-padding-top` (kotwica z menu
    nie chowa nagłówka sekcji pod paskiem),
  - focus ring widoczny na linku logotypu,
  - `prefers-reduced-motion: reduce` — brak płynnych przejść, stan poprawny.

## Poza zakresem

- **Waga assetów logo.** `public/logo.svg` waży 129 kB (to PNG opakowany w SVG),
  `public/logo.png` — 1,4 MB, a trafia do znaczka 50×50 px na każdej podstronie.
  Wyświetla się poprawnie, więc to nie błąd, ale wart osobnego zadania.
- **Playwright** pod test animacji.
- **Rozszerzenie granatu i złota na całą stronę** (mini-rebranding Hero, About,
  Footer, przycisków) — świadomie odrzucone na rzecz logotypu jako wyspy.
