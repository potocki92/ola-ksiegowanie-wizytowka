# Animacje strony — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać spójny, powściągliwy zestaw animacji (reveal-on-scroll ze staggerem, parallax Hero portret+glow, płynne FAQ, count-up statystyk, rysowany checkmark sukcesu) bez frameworka JS i bez bibliotek animacji.

**Architecture:** Dwa małe waniliowe moduły TS (`scrollReveal.ts` — IntersectionObserver; `parallax.ts` — rAF + passive scroll) wpięte raz z `Layout.astro`, sterowane atrybutami `data-*` na elementach; cała warstwa wizualna w CSS (`global.css`). Wzorzec obserwatora/rAF jak w istniejącym `BrandLockup.astro`. Reveal jest aktywny tylko z JS (guard `html.js`), więc bez JS strona jest w pełni widoczna.

**Tech Stack:** Astro 7, Tailwind v4 (CSS-first `@theme`), TypeScript, `IntersectionObserver`, `requestAnimationFrame`. Brak nowych zależności.

## Global Constraints

- **Node** `>=22.12.0` (z `package.json`).
- **Bez frameworka klienckiego** i bez `client:*` — tylko inline `<script>` / importowane moduły TS (ARCHITECTURE.md).
- **Bez bibliotek animacji** (GSAP/Framer/AOS) i bez nowych zależności w `package.json`.
- **Animować wyłącznie `transform` i `opacity`**; parallax przez `translate3d` + `will-change: transform`.
- **`prefers-reduced-motion: reduce`** musi wyłączać/skracać wszystkie animacje (nowe i istniejące `riseIn`/`sheetUp`), pokazywać treść od razu, ustawiać count-up na wartość końcową, rysować checkmark od razu, przełączać FAQ bez przejścia.
- **Fallback bez JS:** stany ukrywające treść przed reveal obowiązują tylko pod `html.js`.
- **Listenery `scroll`/`resize` jako `passive`**, dławione `requestAnimationFrame`; obserwatory reveal/count-up odłączają element po pierwszym odpaleniu.
- **Dostępność:** żaden stan nie może zostawiać wizualnie ukrytej treści w drzewie dostępności (FAQ: `inert` na zwiniętej odpowiedzi).

## Uwaga o weryfikacji (TDD w tym projekcie)

Projekt **nie ma żadnego runnera testów** — `package.json` udostępnia tylko `astro check` (typy) i `astro build`. Zachowania są czysto prezentacyjne (scroll, IntersectionObserver, rAF, animacje CSS), których nie da się sensownie pokryć testem jednostkowym w tym stacku bez dokładania Playwrighta (poza zakresem). Dlatego bramką każdego zadania jest:

1. `npm run check` — typy przechodzą,
2. `npm run build` — build przechodzi,
3. **scenariuszowa weryfikacja ręczna** (konkretne kroki w `npm run dev`),

a następnie commit. To świadome odstępstwo od klasycznego TDD, podyktowane realiami stacku.

## Struktura plików

**Tworzone:**
- `src/lib/scrollReveal.ts` — reveal-on-scroll (IntersectionObserver, stagger grup).
- `src/lib/parallax.ts` — parallax `[data-parallax]` (rAF, bounded).

**Modyfikowane:**
- `src/styles/global.css` — reguły reveal/parallax/FAQ/checkmark + globalny wyłącznik reduced-motion + `@keyframes drawCheck`.
- `src/layouts/Layout.astro` — guard `html.js` w `<head>`, import obu modułów.
- `src/components/sections/Hero.astro` — `data-parallax` na wrapperze portretu.
- `src/components/ui/Section.astro` — `data-parallax` na glow.
- `src/components/sections/ToolsStrip.astro`, `ValueProps.astro`, `Process.astro`, `Pricing.astro`, `About.astro`, `Services.astro` — atrybuty `data-reveal`/`data-reveal-group`.
- `src/components/sections/Services.astro` — dodatkowo count-up (spany + inline `<script>`).
- `src/components/sections/Faq.astro` — przepisanie rozwijania na animowaną wysokość.
- `src/components/sections/contact/ContactSuccess.astro` — inline SVG rysowanego checkmarka.

---

### Task 1: Fundament reveal-on-scroll (moduł + CSS + wpięcie + pierwszy konsument: ToolsStrip)

**Files:**
- Create: `src/lib/scrollReveal.ts`
- Modify: `src/styles/global.css` (dopisanie na końcu pliku)
- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/sections/ToolsStrip.astro:8`, `:11`

**Interfaces:**
- Produces: kontrakt DOM — `[data-reveal]` (element samodzielny → dostaje `.is-visible`), `[data-reveal-group]` (kontener → dostaje `.is-visible`, potomkom `[data-reveal]` moduł ustawia `--reveal-delay`). Stałe: `STAGGER_STEP = 80` (ms), `STAGGER_MAX = 8`. Klasa `js` na `<html>`.
- Consumes: nic (pierwsze zadanie).

- [ ] **Step 1: Utwórz moduł `src/lib/scrollReveal.ts`**

```ts
// Reveal-on-scroll: po wejściu w viewport dodaje `.is-visible` do
// `[data-reveal]`. Grupy `[data-reveal-group]` staggerują swoich potomków
// `[data-reveal]` przez `--reveal-delay`. Obserwator „once" — po odpaleniu
// odłączamy element (wzorzec jak w BrandLockup.astro).
const STAGGER_STEP = 80; // ms między kolejnymi elementami grupy
const STAGGER_MAX = 8; // limit kroków, by ostatni element nie wchodził zbyt późno

const groups = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal-group]"));
const standalone = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
	(el) => !el.closest("[data-reveal-group]"),
);

if (groups.length || standalone.length) {
	// Nadaj potomkom grup indywidualne opóźnienie staggera.
	for (const group of groups) {
		const items = group.querySelectorAll<HTMLElement>("[data-reveal]");
		items.forEach((item, i) => {
			const step = Math.min(i, STAGGER_MAX);
			item.style.setProperty("--reveal-delay", `${step * STAGGER_STEP}ms`);
		});
	}

	const observer = new IntersectionObserver(
		(entries, obs) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add("is-visible");
				obs.unobserve(entry.target);
			}
		},
		{ rootMargin: "0px 0px -10% 0px", threshold: 0 },
	);

	for (const group of groups) observer.observe(group);
	for (const el of standalone) observer.observe(el);
}
```

- [ ] **Step 2: Dopisz reguły reveal + globalny wyłącznik reduced-motion na końcu `src/styles/global.css`**

Dopisz po bloku `.nav-underline` (koniec pliku). Blok reduced-motion MUSI być ostatni (wygrywa źródłowo przy równej specyficzności):

```css
/* --- Animacje: reveal-on-scroll (aktywne tylko z JS) --- */
html.js [data-reveal] {
	opacity: 0;
	transform: translateY(20px);
	transition:
		opacity 0.7s ease,
		transform 0.7s ease;
	transition-delay: var(--reveal-delay, 0ms);
}
html.js [data-reveal].is-visible,
html.js [data-reveal-group].is-visible [data-reveal] {
	opacity: 1;
	transform: none;
}

/* --- Globalny wyłącznik ruchu — MUSI zostać na końcu pliku --- */
@media (prefers-reduced-motion: reduce) {
	*,
	*::before,
	*::after {
		animation-duration: 0.001ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.001ms !important;
		scroll-behavior: auto !important;
	}
	html.js [data-reveal] {
		opacity: 1 !important;
		transform: none !important;
	}
}
```

- [ ] **Step 3: Dodaj guard `html.js` i import modułu w `src/layouts/Layout.astro`**

W `<head>`, zaraz po `<meta name="generator" .../>` (linia ~37), dodaj blokujący mikro-skrypt (musi być wcześnie, by uniknąć mignięcia ukrywanych elementów):

```astro
<script is:inline>
	document.documentElement.classList.add("js");
</script>
```

Przed zamknięciem `</body>` (po `<slot />`, linia ~60) dodaj:

```astro
<script>
	import "../lib/scrollReveal";
</script>
```

- [ ] **Step 4: Podłącz pierwszego konsumenta — `src/components/sections/ToolsStrip.astro`**

Linia 8 — dodaj `data-reveal` do etykiety:

```astro
<div data-reveal class="mb-4.5 text-center text-[12.5px] font-bold tracking-[1px] text-muted-100 uppercase">
	Pracuję w programach, które znasz z rynku
</div>
```

Linia 11 — dodaj `data-reveal` do rzędu narzędzi:

```astro
<div data-reveal class="flex flex-wrap items-center justify-center gap-[clamp(18px,3vw,48px)]">
```

- [ ] **Step 5: Bramka — typy i build**

Run: `npm run check`
Expected: brak błędów (`0 errors`).

Run: `npm run build`
Expected: build kończy się sukcesem (`Complete!` / kod wyjścia 0).

- [ ] **Step 6: Weryfikacja ręczna**

Run: `npm run dev`
Sprawdź:
- Otwórz stronę; sekcja ToolsStrip (pasek programów pod Hero) pojawia się z delikatnym fade+rise, gdy wchodzi w viewport (lub od razu, jeśli jest już widoczna przy załadowaniu).
- W DevTools → Rendering → „Emulate prefers-reduced-motion: reduce": ToolsStrip jest od razu widoczny, bez animacji.
- Wyłącz JS (DevTools → Settings → Disable JavaScript, reload): treść ToolsStrip jest normalnie widoczna (żadna sekcja nie znika).

- [ ] **Step 7: Commit**

```bash
git add src/lib/scrollReveal.ts src/styles/global.css src/layouts/Layout.astro src/components/sections/ToolsStrip.astro
git commit -m "$(cat <<'EOF'
feat(anim): reveal-on-scroll foundation + reduced-motion + ToolsStrip

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Rozłożenie reveal na pozostałe sekcje (ValueProps, Process, Pricing, About, Services)

**Files:**
- Modify: `src/components/sections/ValueProps.astro:47`, `:50`
- Modify: `src/components/sections/Process.astro:37`, `:40`
- Modify: `src/components/sections/Pricing.astro:34`, `:35`, `:116`, `:144`
- Modify: `src/components/sections/About.astro:54`, `:80`, `:86`
- Modify: `src/components/sections/Services.astro:15`, `:17`, `:68`, `:80`, `:92`, `:135`, `:172`, `:205`

**Interfaces:**
- Consumes: kontrakt `[data-reveal]` / `[data-reveal-group]` + `--reveal-delay` z Task 1.
- Produces: nic nowego.

- [ ] **Step 1: ValueProps — grupa 3 kart**

Linia 47 — dodaj `data-reveal-group`:

```astro
<div data-reveal-group class="grid gap-3.5 md:grid-cols-3 md:gap-5">
```

Linia 50 — dodaj `data-reveal` do karty:

```astro
<div data-reveal class="rounded-[22px] border border-white/9 bg-white/4.5 p-[clamp(24px,2.4vw,34px)] transition-all duration-250 hover:-translate-y-1 hover:bg-white/7">
```

- [ ] **Step 2: Process — grupa 4 kroków**

Linia 37 — dodaj `data-reveal-group`:

```astro
<div data-reveal-group class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4.5">
```

Linia 40 — dodaj `data-reveal` do kroku:

```astro
<div data-reveal class="rounded-[20px] border border-border-2 bg-white p-6.5">
```

- [ ] **Step 3: Pricing — dwie karty główne (grupa) + blok usług dodatkowych**

Linia 34 — `data-reveal-group` na siatce dwóch kart:

```astro
<div data-reveal-group class="grid gap-3.5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] md:gap-5">
```

Linia 35 — `data-reveal` na karcie cennika (ciemnej):

```astro
<div
	data-reveal
	class="relative overflow-hidden rounded-[26px] bg-linear-to-br from-muted-900 to-muted-800 p-[clamp(28px,3.2vw,44px)] text-white shadow-[0_30px_60px_-34px_rgba(11,11,18,0.5)]"
>
```

Linia 116 — `data-reveal` na karcie „Założenie JDG":

```astro
<div
	data-reveal
	class="flex flex-col rounded-[26px] border border-border-2 bg-white p-[clamp(26px,3vw,40px)] shadow-[0_16px_40px_-30px_rgba(11,11,18,0.25)]"
>
```

Linia 144 — `data-reveal` na bloku „Usługi dodatkowe":

```astro
<div data-reveal class="mt-3.5 md:mt-5">
```

- [ ] **Step 4: About — bio (samodzielny) + timeline (grupa 7 wpisów)**

Linia 54 — `data-reveal` na kolumnie bio (pierwsze dziecko siatki):

```astro
<div data-reveal>
	<SectionHeading
		eyebrow="O mnie"
```

Linia 80 — `data-reveal-group` na karcie timeline'u:

```astro
<div data-reveal-group class="rounded-3xl border border-border-2 bg-white p-[clamp(22px,2.4vw,36px)] shadow-[0_20px_44px_-30px_rgba(11,11,18,0.3)]">
```

Linia 86 — `data-reveal` na każdym wpisie timeline'u:

```astro
<div data-reveal class="grid grid-cols-[56px_1fr] gap-4.5 not-last:border-b not-last:border-border-4 py-4">
```

- [ ] **Step 5: Services — grupa kart bento (bez count-up, ten jest w Task 4)**

Linia 15 — `data-reveal-group` na kontenerze siatki:

```astro
<div data-reveal-group class="flex flex-col gap-3.5 md:grid md:grid-cols-4 md:auto-rows-[minmax(150px,auto)] md:gap-4 lg:auto-rows-[minmax(168px,auto)]">
```

Dodaj `data-reveal` do 7 bezpośrednich dzieci siatki (kolejno):
- Linia 17: `<div ... col-span-2 row-span-2 ...>` (BIG Prowadzenie JDG) → `<div data-reveal ...`
- Linia 68: `<div ...>` (stat „od 250 zł") → `<div data-reveal ...`
- Linia 80: `<div ...>` (stat „100%") → `<div data-reveal ...`
- Linia 92: `<div ... col-span-2 ...>` (Zakładanie JDG) → `<div data-reveal ...`
- Linia 135: `<div ... col-span-2 ...>` (Kadry i płace) → `<div data-reveal ...`
- Linia 172: `<div ... col-span-2 ...>` (Rozliczenia PIT) → `<div data-reveal ...`
- Linia 205: `<a ... col-span-4 ...>` (CTA) → `<a data-reveal ...`

- [ ] **Step 6: Bramka — typy i build**

Run: `npm run check`
Expected: `0 errors`.

Run: `npm run build`
Expected: build sukces.

- [ ] **Step 7: Weryfikacja ręczna**

Run: `npm run dev`
Przewiń całą stronę i sprawdź, że każda sekcja (ValueProps, Process, Pricing, About, Services) pojawia się z fade+rise, a karty w grupach wchodzą kolejno (stagger). W About wpisy timeline'u wchodzą sekwencyjnie. W trybie reduced-motion wszystko widoczne od razu.

- [ ] **Step 8: Commit**

```bash
git add src/components/sections/ValueProps.astro src/components/sections/Process.astro src/components/sections/Pricing.astro src/components/sections/About.astro src/components/sections/Services.astro
git commit -m "$(cat <<'EOF'
feat(anim): roll out reveal-on-scroll with stagger to all sections

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Parallax Hero (moduł + CSS + portret + glow)

**Files:**
- Create: `src/lib/parallax.ts`
- Modify: `src/styles/global.css` (dopisanie reguł parallax + override w bloku reduced-motion)
- Modify: `src/layouts/Layout.astro` (dodanie importu)
- Modify: `src/components/sections/Hero.astro:67-80`
- Modify: `src/components/ui/Section.astro:29`

**Interfaces:**
- Produces: kontrakt DOM — `[data-parallax]` z opcjonalną zmienną `--parallax-amp` (px, domyślnie 40px desktop / 20px mobile). Moduł ustawia unitless `--parallax-p` ∈ [-1, 1]; CSS liczy `translate3d(0, calc(var(--parallax-p) * var(--parallax-amp)), 0)`.
- Consumes: nic.

- [ ] **Step 1: Utwórz `src/lib/parallax.ts`**

```ts
// Parallax: dla `[data-parallax]` ustawia unitless `--parallax-p` ∈ [-1, 1]
// zależnie od pozycji środka elementu względem środka viewportu. Amplitudę
// (px) i kierunek trzyma CSS (`--parallax-amp`). rAF + passive scroll, wzorzec
// jak w BrandLockup.astro. Nie startuje przy reduced-motion.
//
// Pozycję bazową (środek elementu w układzie dokumentu) mierzymy przy zerowym
// transformie i cache'ujemy — inaczej getBoundingClientRect zwracałby pozycję
// już przesuniętą przez nasz własny transform (sprzężenie zwrotne).
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));

if (!reduce && elements.length) {
	const instances = elements.map((el) => ({ el, center: 0, p: NaN }));

	const measure = () => {
		for (const inst of instances) {
			inst.el.style.setProperty("--parallax-p", "0");
			inst.p = 0;
			// Odczyt rect wymusza recalc stylu (transform = 0), więc `center`
			// jest pozycją layoutową, nie przesuniętą.
			const rect = inst.el.getBoundingClientRect();
			inst.center = rect.top + rect.height / 2 + window.scrollY;
		}
	};

	const update = () => {
		const viewportMid = window.scrollY + window.innerHeight / 2;
		const range = window.innerHeight; // pełny zakres przejścia elementu
		for (const inst of instances) {
			let p = (viewportMid - inst.center) / range;
			p = Math.max(-1, Math.min(1, p));
			const rounded = Math.round(p * 1000) / 1000;
			if (rounded !== inst.p) {
				inst.el.style.setProperty("--parallax-p", String(rounded));
				inst.p = rounded;
			}
		}
	};

	let ticking = false;
	const onScroll = () => {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			update();
			ticking = false;
		});
	};

	let resizeTimer = 0;
	const onResize = () => {
		window.clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(() => {
			measure();
			update();
		}, 150);
	};

	measure();
	update();
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("resize", onResize, { passive: true });
}
```

- [ ] **Step 2: Dopisz reguły parallax w `src/styles/global.css`**

Dodaj reguły parallax **przed** blokiem `@media (prefers-reduced-motion: reduce)` (który musi zostać ostatni):

```css
/* --- Animacje: parallax --- */
[data-parallax] {
	will-change: transform;
	transform: translate3d(0, calc(var(--parallax-p, 0) * var(--parallax-amp, 40px)), 0);
}
@media (max-width: 48rem) {
	[data-parallax] {
		--parallax-amp: 20px;
	}
}
```

W istniejącym bloku `@media (prefers-reduced-motion: reduce)` dopisz (obok reguł reveal):

```css
	[data-parallax] {
		transform: none !important;
	}
```

- [ ] **Step 3: Dodaj import modułu w `src/layouts/Layout.astro`**

Rozszerz istniejący blok skryptu przed `</body>` (z Task 1):

```astro
<script>
	import "../lib/scrollReveal";
	import "../lib/parallax";
</script>
```

- [ ] **Step 4: Hero — parallax na portrecie (`src/components/sections/Hero.astro:67-80`)**

Owiń `<Image>` we własny, oversized wrapper z `data-parallax` (oversize + `overflow-hidden` na ramce zapobiegają odsłonięciu krawędzi przy przesuwaniu). Zamień blok:

```astro
<div class="relative order-2 w-full animate-rise-in-delayed md:order-0">
	<div
		class="relative aspect-4/5 overflow-hidden md:aspect-auto md:h-[clamp(440px,48vw,580px)]"
	>
		<div data-parallax class="absolute left-0 top-[-8%] h-[116%] w-full">
			<Image
				src="/portret.webp"
				alt="mgr Aleksandra Potocka – księgowa"
				width={1024}
				height={1536}
				loading="eager"
				fetchpriority="high"
				class="h-full w-full object-cover object-[center_22%]"
			/>
		</div>
	</div>
</div>
```

Uwaga: `data-parallax` jest na wewnętrznym wrapperze, NIE na elemencie z `animate-rise-in-delayed` — inaczej zakończona animacja `riseIn` (fill `both`, końcowo `transform: none`) nadpisywałaby transform parallaxu.

- [ ] **Step 5: Section — parallax na glow (`src/components/ui/Section.astro:29`)**

Zamień:

```astro
{glow && <div class:list={["pointer-events-none absolute inset-0", glow]} />}
```

na (glow płynie z inną, przeciwną amplitudą → druga warstwa głębi):

```astro
{glow && <div data-parallax style="--parallax-amp:-56px" class:list={["pointer-events-none absolute inset-0", glow]} />}
```

Uwaga: `glow` przekazują dwie sekcje — Hero i ValueProps — więc obie zyskają subtelny parallax tła. To zamierzone (spójna głębia); gradient jest `pointer-events-none` i zanika do przezroczystości, więc przesuwanie nie tworzy twardych krawędzi.

- [ ] **Step 6: Bramka — typy i build**

Run: `npm run check`
Expected: `0 errors`.

Run: `npm run build`
Expected: build sukces.

- [ ] **Step 7: Weryfikacja ręczna**

Run: `npm run dev`
- Przewijaj Hero: portret przesuwa się nieco wolniej/inaczej niż reszta (efekt głębi), bez odsłaniania krawędzi ramki. Glow tła Hero i ValueProps płynie subtelnie.
- Sprawdź, że twarz nie jest źle skadrowana po oversize — jeśli trzeba, dostrój `object-[center_22%]` / `top-[-8%]`/`h-[116%]` lub amplitudę (`--parallax-amp`).
- Na wąskim viewport (≤ 48rem, DevTools device toolbar) ruch jest wyraźnie mniejszy.
- reduced-motion: portret i glow statyczne.

- [ ] **Step 8: Commit**

```bash
git add src/lib/parallax.ts src/styles/global.css src/layouts/Layout.astro src/components/sections/Hero.astro src/components/ui/Section.astro
git commit -m "$(cat <<'EOF'
feat(anim): Hero parallax for portrait and glow layers

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Count-up statystyk w Services

**Files:**
- Modify: `src/components/sections/Services.astro:74`, `:86` (spany) + dopisanie `<script>` na końcu pliku

**Interfaces:**
- Consumes: nic.
- Produces: kontrakt DOM — `[data-count-to="<liczba całkowita>"]`; autorska treść spanu = wartość końcowa (poprawna bez JS).

- [ ] **Step 1: Owiń liczby w spany `data-count-to`**

Linia 74 (karta „od 250 zł") — zmień zawartość diva:

```astro
<div
	class="bg-linear-to-r from-accent to-accent-3 bg-clip-text font-display text-[clamp(30px,3.2vw,44px)] font-extrabold tracking-[-0.03em] text-transparent"
>
	od <span data-count-to="250">250</span> zł
</div>
```

Linia 86 (karta „100%") — zmień zawartość diva:

```astro
<div
	class="bg-linear-to-r from-accent to-accent-3 bg-clip-text font-display text-[clamp(30px,3.2vw,44px)] font-extrabold tracking-[-0.03em] text-transparent"
>
	<span data-count-to="100">100</span>%
</div>
```

- [ ] **Step 2: Dopisz inline `<script>` na końcu `Services.astro`** (po zamykającym `</Section>`)

```astro
<script>
	// Count-up: odlicza `[data-count-to]` od 0 do wartości docelowej przy
	// wejściu w viewport (raz). Reduced-motion → od razu wartość końcowa.
	const counters = document.querySelectorAll<HTMLElement>("[data-count-to]");

	if (counters.length) {
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		const run = (el: HTMLElement) => {
			const target = Number(el.dataset.countTo);
			if (!Number.isFinite(target)) return;
			if (reduce) {
				el.textContent = String(target);
				return;
			}
			const DURATION = 1200;
			const start = performance.now();
			el.textContent = "0";
			const tick = (now: number) => {
				const t = Math.min(1, (now - start) / DURATION);
				const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
				el.textContent = String(Math.round(eased * target));
				if (t < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		};

		const observer = new IntersectionObserver(
			(entries, obs) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					run(entry.target as HTMLElement);
					obs.unobserve(entry.target);
				}
			},
			{ threshold: 0.6 },
		);

		counters.forEach((el) => observer.observe(el));
	}
</script>
```

- [ ] **Step 3: Bramka — typy i build**

Run: `npm run check`
Expected: `0 errors`.

Run: `npm run build`
Expected: build sukces.

- [ ] **Step 4: Weryfikacja ręczna**

Run: `npm run dev`
- Przewiń do sekcji Usługi: liczby „250" i „100" odliczają od 0 do wartości docelowej raz, gdy karty wejdą w viewport. Gradient na liczbie nadal się renderuje (jeśli nie — sprawdź, czy span dziedziczy `text-transparent`).
- reduced-motion: liczby od razu na wartości końcowej (250 / 100).
- Bez JS: karty pokazują docelowe „od 250 zł" i „100%".

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Services.astro
git commit -m "$(cat <<'EOF'
feat(anim): count-up for Services stat cards

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Płynne rozwijanie FAQ

**Files:**
- Modify: `src/components/sections/Faq.astro:77-84` (markup odpowiedzi) + `:92-114` (skrypt)
- Modify: `src/styles/global.css` (reguły `[data-faq-answer]` + override reduced-motion)

**Interfaces:**
- Consumes: nic.
- Produces: kontrakt DOM — wrapper `[data-faq-answer]` (siatka), stan otwarty klasą `.is-open`, `inert` na zwiniętej odpowiedzi; przycisk `[data-faq-toggle]` z `aria-expanded`, ikona `[data-faq-icon]`.

- [ ] **Step 1: Dopisz reguły FAQ w `src/styles/global.css`** (przed blokiem reduced-motion)

```css
/* --- Animacje: rozwijanie FAQ --- */
[data-faq-answer] {
	display: grid;
	grid-template-rows: 0fr;
	transition: grid-template-rows 0.3s ease;
}
[data-faq-answer].is-open {
	grid-template-rows: 1fr;
}
[data-faq-answer] > div {
	overflow: hidden;
}
```

- [ ] **Step 2: Przepisz markup odpowiedzi w `Faq.astro`** (zamień `<p ... data-faq-answer ...>` z linii 77-84)

```astro
<div
	id={`faq-answer-${i}`}
	data-faq-answer
	class:list={[i === 0 && "is-open"]}
	inert={i !== 0 ? true : undefined}
>
	<div>
		<p class="max-w-[62ch] px-5.5 pb-5.5 text-[15px] leading-[1.65] text-muted-600">
			{faq.a}
		</p>
	</div>
</div>
```

- [ ] **Step 3: Przepisz skrypt akordeonu w `Faq.astro`** (zamień cały blok `<script>` z linii 92-114)

```astro
<script>
	const buttons = document.querySelectorAll<HTMLButtonElement>("[data-faq-toggle]");

	// Jedna funkcja ustawia stan pozycji: aria, rotacja ikony, wysokość i
	// obecność w drzewie dostępności (inert). Kierunek jest ten sam przy
	// otwieraniu i zamykaniu, więc nie ma osobnej ścieżki kodu.
	const setOpen = (button: HTMLButtonElement, open: boolean) => {
		const icon = button.querySelector<HTMLElement>("[data-faq-icon]");
		const answer = button.nextElementSibling as HTMLElement | null;
		button.setAttribute("aria-expanded", String(open));
		if (icon) icon.style.transform = open ? "rotate(45deg)" : "none";
		if (answer) {
			answer.classList.toggle("is-open", open);
			if (open) answer.removeAttribute("inert");
			else answer.setAttribute("inert", "");
		}
	};

	buttons.forEach((button) => {
		button.addEventListener("click", () => {
			const isOpen = button.getAttribute("aria-expanded") === "true";
			// Akordeon: zamknij pozostałe, przełącz bieżącą.
			buttons.forEach((other) => {
				if (other !== button) setOpen(other, false);
			});
			setOpen(button, !isOpen);
		});
	});
</script>
```

- [ ] **Step 4: Dodaj override FAQ w bloku reduced-motion `global.css`** (opcjonalny — globalny `*{transition-duration:.001ms}` już czyni przejście natychmiastowym; nic dodatkowego nie trzeba). Potwierdź jedynie, że blok reduced-motion nie wymaga zmian dla FAQ.

- [ ] **Step 5: Bramka — typy i build**

Run: `npm run check`
Expected: `0 errors`.

Run: `npm run build`
Expected: build sukces.

- [ ] **Step 6: Weryfikacja ręczna**

Run: `npm run dev`
- FAQ: kliknięcie pytania płynnie rozwija odpowiedź (animacja wysokości), ikona `+` obraca się o 45°. Otwarcie innego pytania zamyka poprzednie (pojedynczy akordeon). Pierwsze pytanie otwarte na starcie.
- Tab/czytnik ekranu: zwinięte odpowiedzi są pomijane (nie da się do nich wejść tabulatorem — `inert`).
- reduced-motion: rozwijanie działa, ale bez animowanego przejścia (natychmiast).

- [ ] **Step 7: Commit**

```bash
git add src/components/sections/Faq.astro src/styles/global.css
git commit -m "$(cat <<'EOF'
feat(anim): animate FAQ answer expand/collapse

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Rysowany checkmark sukcesu kontaktu

**Files:**
- Modify: `src/components/sections/contact/ContactSuccess.astro:20-22` (zamiana Icon na inline SVG)
- Modify: `src/styles/global.css` (`@keyframes drawCheck` + reguły `.check-draw` + override reduced-motion)

**Interfaces:**
- Consumes: mechanizm pokazania panelu z `ContactForm.astro` (`success.hidden = false`) — bez zmian w skrypcie formularza.
- Produces: nic.

- [ ] **Step 1: Zamień statyczny check na inline SVG w `ContactSuccess.astro`**

Zamień (linie 20-22):

```astro
<span
	class="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-accent to-accent-2 text-white shadow-[0_18px_34px_-14px_rgba(79,91,242,0.75)]"
>
	<Icon name="check" size={26} strokeWidth={2.4} />
</span>
```

na:

```astro
<span
	class="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-accent to-accent-2 text-white shadow-[0_18px_34px_-14px_rgba(79,91,242,0.75)]"
>
	<svg
		class="check-draw"
		width="26"
		height="26"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.4"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path pathLength="1" d="M5 12.5l4.2 4.3L19 7" />
	</svg>
</span>
```

Import `Icon` pozostaje potrzebny w innych miejscach? W `ContactSuccess.astro` `Icon` jest używany tylko tutaj — po zamianie usuń nieużywany import z frontmatter (linia 2: `import Icon from "../../ui/Icon.astro";`), inaczej `astro check` zgłosi ostrzeżenie/nieużywany import.

- [ ] **Step 2: Dopisz reguły checkmarka w `global.css`** (przed blokiem reduced-motion)

`pathLength="1"` normalizuje długość ścieżki do 1, więc dasharray/offset są niezależne od geometrii:

```css
/* --- Animacje: rysowany checkmark sukcesu kontaktu --- */
@keyframes drawCheck {
	from {
		stroke-dashoffset: 1;
	}
	to {
		stroke-dashoffset: 0;
	}
}
[data-contact-success] .check-draw path {
	stroke-dasharray: 1;
	stroke-dashoffset: 1;
}
[data-contact-success]:not([hidden]) .check-draw path {
	animation: drawCheck 0.5s ease 0.1s forwards;
}
```

W bloku reduced-motion dopisz (checkmark od razu narysowany):

```css
	[data-contact-success] .check-draw path {
		stroke-dashoffset: 0 !important;
	}
```

- [ ] **Step 3: Bramka — typy i build**

Run: `npm run check`
Expected: `0 errors` (w tym brak nieużywanego importu `Icon`).

Run: `npm run build`
Expected: build sukces.

- [ ] **Step 4: Weryfikacja ręczna**

Run: `npm run dev`
- Wypełnij i wyślij formularz kontaktowy (lub tymczasowo w DevTools zdejmij atrybut `hidden` z `[data-contact-success]`): checkmark rysuje się kreską (stroke) po pojawieniu się panelu.
- reduced-motion: checkmark od razu w pełni narysowany, bez animacji.
- Kształt „✓" wygląda poprawnie; jeśli trzeba, dostrój `d`/`viewBox`.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/contact/ContactSuccess.astro src/styles/global.css
git commit -m "$(cat <<'EOF'
feat(anim): draw contact success checkmark via SVG stroke

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Self-review (autor planu)

**Pokrycie spec:**
- Reduced-motion globalnie → Task 1 (blok `@media`, rozszerzany w Task 3/6). ✔
- Wspólny reveal + stagger → Task 1 (moduł+CSS+ToolsStrip), Task 2 (reszta). ✔
- Parallax Hero portret+glow, wszędzie/delikatnie na mobile → Task 3 (`--parallax-amp` 40/20px, glow `-56px`). ✔
- Płynne FAQ (`grid-template-rows`, a11y `inert`, akordeon, rotacja ikony) → Task 5. ✔
- Count-up obu statystyk (spany, wartość końcowa w treści) → Task 4. ✔
- Rysowany checkmark (SVG dashoffset, trigger `:not([hidden])`) → Task 6. ✔
- Fallback bez JS (`html.js`) → Task 1. ✔
- Poza zakresem (mouse-parallax, marquee, mock faktury, floaty, scroll-progress, rysowane linie) → nie ma zadań (celowo). ✔

**Skan placeholderów:** brak TBD/TODO; każdy krok zmieniający kod zawiera pełny kod. ✔

**Spójność typów/nazw:** `--parallax-p`/`--parallax-amp` (Task 3) spójne między `parallax.ts` a CSS. `--reveal-delay`, `[data-reveal]`, `[data-reveal-group]`, `.is-visible` (Task 1) spójne z użyciem w Task 2. `[data-count-to]`/`dataset.countTo` (Task 4) spójne. `[data-faq-answer]`/`.is-open`/`inert`, `[data-faq-toggle]`, `[data-faq-icon]` (Task 5) spójne z istniejącym markupem. `.check-draw path`/`pathLength="1"`/`drawCheck` (Task 6) spójne. ✔

**Kolejność CSS:** blok `@media (prefers-reduced-motion: reduce)` musi pozostać ostatni w `global.css`; reguły reveal/parallax/faq/checkmark dopisywane PRZED nim (Task 1 tworzy ten porządek, kolejne zadania go zachowują). ✔
