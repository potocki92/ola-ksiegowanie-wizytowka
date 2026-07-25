# Animacje strony — „Fundament + akcenty"

Data: 2026-07-25
Status: zaakceptowany design → do planu implementacji

## Cel

Ożywić jednostronicowy landing (Astro, Tailwind v4) spójnym, powściągliwym
zestawem animacji, bez wprowadzania frameworka JS ani biblioteki animacji.
Całość na waniliowym CSS (`@theme` keyframes) + małe moduły oparte o
`IntersectionObserver` i `requestAnimationFrame`, w duchu wzorca już obecnego
w [BrandLockup.astro](../../../src/components/ui/BrandLockup.astro).

Wybrany zakres to tier **„Fundament + akcenty"**: wspólny reveal-on-scroll we
wszystkich sekcjach, jeden gustowny parallax w Hero, płynne rozwijanie FAQ oraz
dwa mocne „momenty" — count-up statystyk i rysowany checkmark sukcesu kontaktu.

## Zakres

### W zakresie

1. Globalna obsługa `prefers-reduced-motion` (obejmuje też istniejące
   `riseIn`/`sheetUp`, dziś nieosłonięte).
2. Wspólny mechanizm reveal-on-scroll (`src/lib/scrollReveal.ts` + CSS) ze
   staggerem, wpięty raz z `Layout.astro`, użyty we wszystkich sekcjach poza Hero.
3. Parallax w Hero (`src/lib/parallax.ts` + CSS): portret **oraz** glow-blob tła,
   dwie warstwy o różnej prędkości. Aktywny na wszystkich urządzeniach, z
   **mniejszym zakresem na mobile**.
4. Płynne rozwijanie FAQ (`grid-template-rows: 0fr → 1fr`) zamiast skoku na
   atrybucie `hidden`.
5. Count-up liczb na **obu** dużych kartach statystyk w Services („od **250** zł"
   i „**100**%").
6. Rysowany checkmark (SVG `stroke-dasharray`/`dashoffset`) na ekranie sukcesu
   formularza kontaktowego.

### Poza zakresem (świadomie)

Mouse-parallax, marquee w ToolsStrip, animowany „mock faktury", `floaty` w pętli,
scroll-progress bar, rysowane linie łączące timeline/proces. `floaty` pozostaje
zdefiniowany, ale nieużywany. Nie wprowadzamy GSAP/Framer/AOS ani żadnego
`client:*`.

## Zasady ogólne

- **Wydajność:** animujemy wyłącznie `transform` i `opacity`. Parallax przez
  `translateY()` z `will-change: transform`. Listenery `scroll` jako `passive`,
  dławione `requestAnimationFrame`. Obserwatory (`reveal`, `count-up`) odłączają
  element po pierwszym odpaleniu (`once`).
- **`prefers-reduced-motion: reduce`:** wyłącza/skraca wszystkie animacje —
  parallax nie startuje, reveal pokazuje treść od razu, count-up ustawia wartość
  końcową bez odliczania, checkmark jest od razu narysowany, FAQ przełącza się
  bez przejścia wysokości.
- **Fallback bez JS:** stany „ukryte przed reveal" obowiązują **tylko** gdy JS
  jest aktywny. Mikro-skrypt w `<head>` dodaje `class="js"` do `<html>`; cały CSS
  chowający treść jest kwalifikowany `html.js …`. Bez JS strona renderuje się w
  pełni widoczna (bez ryzyka pustych sekcji, jeśli skrypt się nie wykona).
- **Dostępność:** żaden mechanizm nie może ukrywać treści przed czytnikiem
  ekranu w stanie, w którym jest ona logicznie dostępna (patrz FAQ i count-up).

## Architektura i nowe moduły

### 1. `src/layouts/Layout.astro` — wpięcie

- W `<head>`, przed treścią, blokujący mikro-skrypt inline:
  `document.documentElement.classList.add("js")`. Musi być inline i wcześnie,
  żeby uniknąć mignięcia (FOUC) ukrywanych elementów.
- Na końcu `<body>`: `<script>` typu module importujący oba moduły:
  `import "../lib/scrollReveal"; import "../lib/parallax";`. Astro zbundluje i
  zdeferuje je automatycznie.

### 2. `src/lib/scrollReveal.ts`

Odpowiedzialność: pojawianie się elementów przy wejściu w viewport, z opcjonalnym
staggerem grupowym. Jeden moduł, brak zależności.

Kontrakt DOM:

- **Element samodzielny:** `data-reveal` → obserwowany pojedynczo; po wejściu w
  viewport dostaje klasę `.is-visible`.
- **Grupa ze staggerem:** kontener `data-reveal-group`, a jego potomkowie z
  `data-reveal` to elementy staggerowane. Moduł ustawia każdemu potomkowi
  `--reveal-delay: <index * krok>ms` (krok domyślnie ~80 ms, górny limit np. 8
  elementów, by ostatni nie wchodził zbyt późno) i obserwuje **kontener**. Po
  wejściu kontenera w viewport kontener dostaje `.is-visible`, a CSS ujawnia
  potomków z ich indywidualnym `transition-delay`.

Zachowanie:

- Jeden wspólny `IntersectionObserver` (np. `rootMargin: "0px 0px -10% 0px"`,
  `threshold: 0`); po odpaleniu elementu `unobserve`.
- Jeśli `matchMedia("(prefers-reduced-motion: reduce)").matches` — moduł nie musi
  nic robić; widoczność zapewnia reguła CSS reduced-motion. (Może też od razu
  oznaczyć wszystko `.is-visible` — do wyboru w implementacji; efekt ten sam.)
- Idempotentny względem braku elementów (gdy brak `[data-reveal]`, nic nie robi).

### 3. `src/lib/parallax.ts`

Odpowiedzialność: przesuwanie elementów `[data-parallax]` wolniej/inaczej niż
scroll, dając wrażenie głębi. Wzorzec jak w `BrandLockup.astro` (rAF + `scroll`).

Kontrakt DOM:

- `data-parallax` na elemencie do przesuwania.
- Prędkość z CSS custom property `--parallax-speed` (na elemencie lub
  odziedziczona). CSS aplikuje transform:
  `transform: translate3d(0, calc(var(--parallax-y, 0px) * var(--parallax-speed, 0.18)), 0)`.

Zachowanie:

- Jeśli reduced-motion — moduł nie startuje (żadnego listenera; transform
  pozostaje `none`).
- Na `scroll` (passive) + `resize`: w `requestAnimationFrame` dla każdego
  elementu liczy przesunięcie na podstawie pozycji jego środka względem środka
  viewportu i zapisuje `--parallax-y` (w px) na elemencie. Dotyka DOM tylko przy
  realnej zmianie (jak w `BrandLockup`).
- **Mniejszy zakres na mobile:** `--parallax-speed` jest niższe na wąskich
  ekranach — realizowane w CSS media query (np. `@media (max-width: 48rem)`
  obniża mnożnik), nie w JS. Dzięki temu na telefonie ruch jest subtelny.
- `will-change: transform` ustawione na elementach parallax w CSS.

### 4. CSS w `src/styles/global.css`

Nowe reguły (poza `@layer base`, jak istniejący blok `.nav-underline`, żeby
wygrywały z utilities Tailwinda tam, gdzie trzeba):

```css
/* Reveal — aktywne tylko z JS; bez JS treść widoczna od razu */
html.js [data-reveal] {
	opacity: 0;
	transform: translateY(20px);
	transition: opacity 0.7s ease, transform 0.7s ease;
	transition-delay: var(--reveal-delay, 0ms);
}
html.js [data-reveal].is-visible,
html.js [data-reveal-group].is-visible [data-reveal] {
	opacity: 1;
	transform: none;
}

/* Parallax */
[data-parallax] {
	will-change: transform;
	transform: translate3d(0, calc(var(--parallax-y, 0px) * var(--parallax-speed, 0.18)), 0);
}
@media (max-width: 48rem) {
	[data-parallax] { --parallax-speed: 0.08; }
}

/* Reduced-motion — globalny wyłącznik (obejmuje też riseIn/sheetUp) */
@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after {
		animation-duration: 0.001ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.001ms !important;
	}
	html.js [data-reveal] { opacity: 1; transform: none; }
	[data-parallax] { transform: none; }
}
```

Wartości (0.18 / 0.08 / 20px / 0.7s) są punktem wyjścia do dostrojenia w
implementacji.

## Zmiany per sekcja / plik

### Hero — [Hero.astro](../../../src/components/sections/Hero.astro)

- **Zostaje** animacja ładowania (`animate-rise-in` / `animate-rise-in-delayed`).
  Hero nie dostaje `data-reveal` — nie chowamy treści nad linią zgięcia.
- Wrapper portretu (`div.relative.aspect-4/5…` wokół `<Image src="/portret.webp">`)
  dostaje `data-parallax` (prędkość domyślna).

### Section (glow) — [Section.astro](../../../src/components/ui/Section.astro)

- Div glow (renderowany, gdy `glow` przekazane) dostaje `data-parallax` i wyższą
  `--parallax-speed` (np. przez `data-parallax-speed`/klasę), by tło płynęło
  inaczej niż portret — druga warstwa głębi. Dotyczy to Hero, które jako jedyne
  przekazuje `glow`. Hook jest ogólny, ale aktywuje się tylko tam, gdzie `glow`
  istnieje.

### ToolsStrip — [ToolsStrip.astro](../../../src/components/sections/ToolsStrip.astro)

- `data-reveal` na pasku (fade/slide-in przy wejściu w viewport).

### Services — [Services.astro](../../../src/components/sections/Services.astro)

- `data-reveal-group` na kontenerze siatki bento; `data-reveal` na poszczególnych
  kartach → stagger.
- **Count-up:** w dwóch kartach statystyk liczba owinięta w span z `data-count-to`:
  - „od 250 zł" → `od <span data-count-to="250">250</span> zł`
  - „100%" → `<span data-count-to="100">100</span>%`
  Autorska treść zawiera **wartość końcową** (poprawna bez JS). Mały, samodzielny
  `<script>` inline w sekcji (zgodnie z konwencją „każda sekcja wozi swój skrypt"):
  `IntersectionObserver` na `[data-count-to]`; po wejściu w viewport animuje z 0 do
  wartości docelowej (~1.2 s, easing), aktualizując `textContent`; odłącza po
  odpaleniu. Reduced-motion → od razu wartość końcowa. Pozostałe liczby na kartach
  (ceny w mocku faktury) celowo pomijane.

### ValueProps — [ValueProps.astro](../../../src/components/sections/ValueProps.astro)

- `data-reveal-group` na kontenerze 3 kart; `data-reveal` na kartach → stagger
  (kontrast z ciemnym tłem `bg-ink`).

### About — [About.astro](../../../src/components/sections/About.astro)

- `data-reveal` na kolumnie z bio.
- `data-reveal-group` na karcie „Wykształcenie i certyfikaty"; `data-reveal` na
  każdym z 7 wpisów `timeline` → sekwencyjne pojawianie (stagger).

### Pricing — [Pricing.astro](../../../src/components/sections/Pricing.astro)

- `data-reveal` na karcie cennika i karcie JDG (fade/scale-in przy wejściu).

### Process — [Process.astro](../../../src/components/sections/Process.astro)

- `data-reveal-group` na liście kroków; `data-reveal` na każdym kroku → kroki
  pojawiają się kolejno.

### FAQ — [Faq.astro](../../../src/components/sections/Faq.astro)

Zamiana skoku na animowane rozwijanie:

- Odpowiedź `<p hidden>` opakowana w wrapper-siatkę:
  `<div data-faq-answer style="grid-template-rows:0fr" class="grid transition-[grid-template-rows] duration-300"><div class="overflow-hidden"><p …>{a}</p></div></div>`.
  Stan otwarty → `grid-template-rows:1fr` (przez klasę/inline).
- **Zachowane bez zmian:** pojedyncza otwarta pozycja (akordeon zamyka pozostałe),
  `aria-expanded` na przycisku, `aria-controls`, rotacja ikony `+`
  (`rotate(45deg)`), pierwsza pozycja otwarta domyślnie.
- **Dostępność:** zwinięta odpowiedź musi być usunięta z drzewa dostępności, żeby
  czytnik ekranu nie czytał ukrytych treści — po zwinięciu ustawiamy na wrapperze
  `visibility: hidden` (z opóźnieniem = czas trwania) lub `inert`; przy rozwijaniu
  zdejmujemy. Nie używamy już atrybutu `hidden` (kolidowałby z przejściem
  wysokości).
- Skrypt akordeonu adaptowany: przełącza klasę/`grid-template-rows` zamiast
  `hidden`; logika „zamknij pozostałe" i `aria-expanded` bez zmian.

### Kontakt — sukces — [ContactSuccess.astro](../../../src/components/sections/contact/ContactSuccess.astro)

- Statyczny `<Icon name="check">` zastąpiony inline SVG z pojedynczym `<path>`
  rysowanym przez `stroke-dasharray` = długość ścieżki i animację `stroke-dashoffset`
  → 0.
- **Trigger bez zmian w skrypcie formularza:** panel pokazuje się przez
  `success.hidden = false` (potwierdzone w
  [ContactForm.astro](../../../src/components/sections/contact/ContactForm.astro)).
  Animacja odpalana czystym CSS-em: `[data-contact-success]:not([hidden]) .check-draw { animation: drawCheck … forwards }`.
  Dopóki panel ma `hidden`, animacja nie istnieje; po zdjęciu `hidden` rysuje się raz.
- Reduced-motion → `stroke-dashoffset: 0` od razu (checkmark narysowany, bez animacji).
- Nowy `@keyframes drawCheck` w `@theme`/`global.css`.

## Dane / przepływ

Brak nowego stanu aplikacyjnego ani danych. Wszystkie mechanizmy są czysto
prezentacyjne, sterowane pozycją scrolla / wejściem w viewport / obecnością
atrybutu `hidden`. Moduły nie komunikują się między sobą.

## Dostępność — podsumowanie

- Pełne poszanowanie `prefers-reduced-motion` (globalnie).
- Reveal ma fallback bez JS (`html.js`) — treść nigdy nie znika, gdy JS nieaktywny.
- FAQ: `aria-expanded`/`aria-controls` zachowane; zwinięta odpowiedź usuwana z
  drzewa dostępności.
- Count-up: autorska treść to wartość końcowa (poprawna bez JS i dla czytnika przy
  braku skryptu); animacja jest wyłącznie wizualna.
- Fokus po sukcesie kontaktu (`success.focus()`) i `noscript` formularza — bez zmian.

## Wydajność

- Tylko `transform`/`opacity`; `will-change` na elementach parallax.
- Listenery `scroll` passive + rAF; DOM dotykany tylko przy realnej zmianie.
- Obserwatory reveal/count-up `once` (unobserve po odpaleniu).
- Brak nowych zależności w `package.json` — rozmiar bundla rośnie o dwa małe
  moduły TS.

## Weryfikacja

- `npm run check` — typy (astro check) przechodzą.
- `npm run build` — build przechodzi.
- Ręcznie (`npm run dev`):
  - reveal odpala się przy scrollu w każdej sekcji poza Hero; Hero animuje się przy
    ładowaniu jak dotychczas;
  - parallax portretu i glow reaguje na scroll (desktop) i jest subtelny na mobile;
  - FAQ rozwija/zwija się płynnie, akordeon nadal pojedynczy, ikona się obraca;
  - count-up odlicza obie statystyki raz, przy wejściu w viewport;
  - checkmark rysuje się po wysłaniu formularza;
  - w trybie `prefers-reduced-motion: reduce` (DevTools/OS) wszystkie animacje są
    wyłączone/natychmiastowe, a treść widoczna;
  - z wyłączonym JS strona jest w pełni widoczna (żadna sekcja nie znika).
