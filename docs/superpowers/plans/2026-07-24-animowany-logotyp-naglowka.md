# Animowany logotyp nagłówka — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zastąpić tekst „Potocka" w nagłówku pełnym logotypem z wizytówki, w którym litery nazwiska znikają od ostatniej do pierwszej wraz z przewijaniem strony, aż zostaje sam znaczek i złote `KSIĘGOWOŚĆ`.

**Architecture:** Nowy komponent `BrandLockup.astro` skupia całą wiedzę o logotypie — markup, style i skrypt scrolla. `Logo.astro` zostaje zredukowany do samego znaczka i staje się jego wewnętrznym budulcem. `Header.astro` i `Footer.astro` tylko konsumują `BrandLockup`. Animacja to listener `scroll` z `requestAnimationFrame`, dokładnie tym wzorcem, którego `Header.astro` już używa dla scrollspy.

**Tech Stack:** Astro 7, Tailwind CSS 4 (`@theme`), scoped styles Astro, TypeScript, self-hostowany Tenor Sans (woff2).

**Spec:** [`docs/superpowers/specs/2026-07-24-animowany-logotyp-naglowka-design.md`](../specs/2026-07-24-animowany-logotyp-naglowka-design.md)

## Global Constraints

- **Brak runnera testów.** `package.json` ma wyłącznie `astro check` i `astro build`. Nie instaluj vitest/playwright — Playwright jest jawnie poza zakresem specu. Cyklem weryfikacji każdego zadania jest `npm run check` + `npm run build` + ręczne sprawdzenie w `npm run dev`.
- **Zero nowych zależności runtime.** Projekt nie ma dziś żadnej poza Astro. Nie dodawaj GSAP-a ani innych bibliotek animacji.
- **Kolory dokładnie te:** granat `#16233a`, złoto `#8a6d2f`. Złoto jest przyciemnione względem wizytówki (`#b3924f`) świadomie — daje 4,78:1 zamiast 2,88:1. Nie „poprawiaj" go z powrotem.
- **Czcionka:** Tenor Sans, grubość 400 (jedyna dostępna). Token `--font-logo`.
- **Napis:** `ALEKSANDRA POTOCKA` (18 znaków ze spacją) i `KSIĘGOWOŚĆ`. Bez skrótów, także na mobile.
- **Kolejność znikania:** od ostatniej litery do pierwszej. Scroll w górę przywraca w odwrotnej kolejności.
- **Reszta strony bez zmian.** Indygo `#4f5bf2` zostaje wszędzie poza logotypem. Nie rozszerzaj granatu/złota na inne sekcje.
- **Konwencje kodu:** wcięcia tabami, komentarze po polsku (tak jak w `Header.astro` i `global.css`), `class:list` do warunkowych klas.

---

## File Structure

| Plik | Odpowiedzialność |
|---|---|
| `src/assets/fonts/tenor-sans-latin.woff2` | *(nowy)* Glify A–Z, spacja |
| `src/assets/fonts/tenor-sans-latin-ext.woff2` | *(nowy)* Glify Ę, Ś, Ć |
| `src/styles/global.css` | *(zmiana)* `@font-face` × 2, tokeny `--font-logo`, `--color-brand-navy`, `--color-brand-gold` |
| `src/components/ui/Logo.astro` | *(zmiana)* Sam znaczek w skalowalnym pudełku. Traci tryb tekstowy — po tej zmianie nikt go nie używa |
| `src/components/ui/BrandLockup.astro` | *(nowy)* Cały logotyp: markup, style, skrypt scrolla, dostępność |
| `src/components/layout/Header.astro` | *(zmiana)* `BrandLockup` w pasku i w overlayu menu; kurczenie paddingu paska |
| `src/components/layout/Footer.astro` | *(zmiana)* `BrandLockup` w wariancie statycznym |

**Kolejność zadań jest celowa:** layout walidujemy na statycznym lockupie (zadanie 3), *zanim* dojdzie animacja (zadanie 4). Najbardziej ryzykowny element to zmieszczenie 18 wersalików na 320 px — jeśli to nie wyjdzie, lepiej wiedzieć przed napisaniem skryptu.

---

### Task 1: Tenor Sans i tokeny marki

**Files:**
- Create: `src/assets/fonts/tenor-sans-latin.woff2`
- Create: `src/assets/fonts/tenor-sans-latin-ext.woff2`
- Modify: `src/styles/global.css:1-123`

**Interfaces:**
- Consumes: nic
- Produces: token `--font-logo` (rodzina `"Tenor Sans", serif`), `--color-brand-navy` (`#16233a`), `--color-brand-gold` (`#8a6d2f`). Tailwind wygeneruje z nich m.in. klasy `font-logo`, `text-brand-navy`, `text-brand-gold`.

- [ ] **Step 1: Pobrać pliki czcionki**

```bash
curl -o src/assets/fonts/tenor-sans-latin.woff2 \
  "https://fonts.gstatic.com/s/tenorsans/v21/bx6ANxqUneKx06UkIXISn3V4Cg.woff2"
curl -o src/assets/fonts/tenor-sans-latin-ext.woff2 \
  "https://fonts.gstatic.com/s/tenorsans/v21/bx6ANxqUneKx06UkIXISn3t4Cl2I.woff2"
```

- [ ] **Step 2: Sprawdzić, że pobrały się całe**

```bash
ls -l src/assets/fonts/tenor-sans-latin.woff2 src/assets/fonts/tenor-sans-latin-ext.woff2
```

Oczekiwane: `tenor-sans-latin.woff2` = **18588** bajtów, `tenor-sans-latin-ext.woff2` = **13900** bajtów.

Jeśli któryś ma kilkaset bajtów, to strona błędu zapisana jako plik — powtórz pobranie. Nie idź dalej z uszkodzonym plikiem, bo objawi się to dopiero jako brak glifów w przeglądarce.

- [ ] **Step 3: Dodać `@font-face` do `global.css`**

Wstaw **po** bloku Hanken Grotesk (po linii 51), przed `@theme`:

```css
@font-face {
	font-family: "Tenor Sans";
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url("../assets/fonts/tenor-sans-latin-ext.woff2") format("woff2");
	unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
	font-family: "Tenor Sans";
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url("../assets/fonts/tenor-sans-latin.woff2") format("woff2");
	unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

Zakresy są identyczne z tymi używanymi już przez Plus Jakarta Sans — to nie przypadek, Google dzieli wszystkie kroje tak samo. `Ę` (U+0118), `Ś` (U+015A) i `Ć` (U+0106) wpadają w `latin-ext`, wersaliki A–Z w `latin`, więc oba pliki są potrzebne.

Tenor Sans ma tylko jedną grubość, więc `font-weight: 400`, a nie zakres `400 700` jak przy pozostałych krojach.

- [ ] **Step 4: Dodać tokeny do `@theme`**

W bloku `@theme` (linia 53), zaraz po `--font-display`:

```css
	--font-logo: "Tenor Sans", serif;
```

A po `--color-ink`:

```css
	/* Kolory wyłącznie logotypu — reszta strony zostaje na indygo.
	   Złoto jest przyciemnione względem wizytówki (#b3924f): daje 4,78:1
	   zamiast 2,88:1, a z odległości wciąż czyta się jako złoto. */
	--color-brand-navy: #16233a;
	--color-brand-gold: #8a6d2f;
```

- [ ] **Step 5: Zweryfikować, że czcionka faktycznie się ładuje**

Tymczasowo dopisz na końcu `global.css`:

```css
.tenor-probe { font-family: var(--font-logo); font-size: 40px; }
```

Dodaj w `src/pages/index.astro` gdziekolwiek w `<body>`: `<p class="tenor-probe">ALEKSANDRA POTOCKA KSIĘGOWOŚĆ</p>`

Uruchom `npm run dev`, otwórz stronę i sprawdź w DevTools → Network, że **oba** pliki `tenor-sans-*.woff2` się pobrały, a napis renderuje się szeryfowo-humanistycznym krojem (nie domyślnym sans). Szczególnie sprawdź, że `Ę`, `Ś` i `Ć` mają ogonek i kreski, a nie są pustymi prostokątami.

Następnie **usuń** klasę `.tenor-probe` i akapit testowy.

- [ ] **Step 6: Weryfikacja i commit**

```bash
npm run check
npm run build
```

Oczekiwane: `astro check` bez błędów, build kończy się sukcesem.

```bash
git add src/assets/fonts/tenor-sans-latin.woff2 src/assets/fonts/tenor-sans-latin-ext.woff2 src/styles/global.css
git commit -m "Self-host Tenor Sans and add brand colour tokens"
```

---

### Task 2: `Logo.astro` na sam znaczek + `BrandLockup` w wariancie statycznym

**Files:**
- Modify: `src/components/ui/Logo.astro` (cały plik)
- Create: `src/components/ui/BrandLockup.astro`
- Modify: `src/components/layout/Footer.astro:1-11`

**Interfaces:**
- Consumes: `--font-logo`, `--color-brand-navy`, `--color-brand-gold` z zadania 1.
- Produces:
  - `Logo.astro` → `Props { size?: "sm" | "md" | "lg"; class?: string }`. Renderuje `<span class="logo-mark is-{size}">` o boku sterowanym zmienną `--logo-mark` (34 / 38 / 50 px).
  - `BrandLockup.astro` → `Props { href?: string; size?: "sm" | "lg"; animated?: boolean; class?: string }`. Element główny ma klasę `brand-lockup`; gdy `animated`, dostaje atrybut `data-brand-lockup`. Litery to `.bl-letter`, stan zwinięty to klasa `.is-collapsed` na elemencie głównym. Zadanie 4 opiera się na tych trzech nazwach.

- [ ] **Step 1: Przepisać `Logo.astro`**

Zastąp **całą** zawartość pliku:

```astro
---
import { Image } from "astro:assets";

interface Props {
	size?: "sm" | "md" | "lg";
	class?: string;
}

const { size = "md", class: className } = Astro.props;
---

<span class:list={["logo-mark", `is-${size}`, className]}>
	<Image src="/logo.svg" alt="" width={100} height={100} />
</span>

<style>
	/* Bok znaczka jedzie przez zmienną, żeby BrandLockup mógł go zmniejszyć
	   przy zwijaniu nagłówka. Wartość z klasy `is-*` przegrywa z regułą
	   potomka w BrandLockup — i o to chodzi. */
	.logo-mark {
		display: grid;
		place-items: center;
		flex: 0 0 auto;
		width: var(--logo-mark, 38px);
		height: var(--logo-mark, 38px);
		transition: width 0.25s ease, height 0.25s ease;
	}
	.logo-mark.is-sm { --logo-mark: 34px; }
	.logo-mark.is-md { --logo-mark: 38px; }
	.logo-mark.is-lg { --logo-mark: 50px; }

	.logo-mark img {
		width: 100%;
		height: 100%;
	}
</style>
```

Znikają propsy `showName`, `name`, `href` oraz mapa `nameSize`. Po tej zmianie nikt nie używa trybu tekstowego — nagłówek, menu mobilne i stopka przechodzą na `BrandLockup`. Znikają też martwe klasy `font-display font-extrabold text-white` i `text-sm`/`text-base`, które wisiały na `<span>` bez tekstu. `alt="Logo"` → `alt=""`, bo nazwę niesie `aria-label` w `BrandLockup`.

- [ ] **Step 2: Utworzyć `BrandLockup.astro`**

```astro
---
import Logo from "./Logo.astro";

interface Props {
	href?: string;
	size?: "sm" | "lg";
	animated?: boolean;
	class?: string;
}

const { href, size = "lg", animated = true, class: className } = Astro.props;

const NAME = "ALEKSANDRA POTOCKA";
const TAGLINE = "KSIĘGOWOŚĆ";

// Rozbicie na tablicę znaków. `.map()` w Astro nie wstawia białych znaków
// między elementami, ale `.bl-name` jest i tak flexem — a w kontenerze flex
// węzły z samych spacji nie tworzą anonimowych elementów. Dzięki temu
// formatowanie szablonu nie może przypadkiem dołożyć odstępu przed pierwszą
// literą.
const letters = [...NAME];

// Bez `href` (stopka, overlay menu) `<a>` byłoby niefokusowalne, więc
// renderujemy `<div role="img">` — nazwa dostępna ma się wtedy na czym oprzeć.
const Tag = href ? "a" : "div";
const label = href
	? "Aleksandra Potocka — Księgowość, strona główna"
	: "Aleksandra Potocka — Księgowość";
---

<Tag
	href={href}
	role={href ? undefined : "img"}
	aria-label={label}
	data-brand-lockup={animated ? "" : undefined}
	class:list={["brand-lockup", `is-${size}`, className]}
>
	<Logo size={size === "lg" ? "lg" : "sm"} />
	<span class="bl-stack">
		<span class="bl-name" aria-hidden="true">{
			letters.map((ch) => <span class="bl-letter" set:html={ch === " " ? "&nbsp;" : ch} />)
		}</span>
		<span class="bl-tagline" aria-hidden="true">
			<i></i><span class="bl-tagline-text">{TAGLINE}</span><i></i>
		</span>
	</span>
</Tag>

<style>
	.brand-lockup {
		display: flex;
		align-items: center;
		gap: 12px;
		text-decoration: none;
	}

	.bl-stack {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
		transition: gap 0.25s ease;
	}

	.bl-name {
		display: flex;
		align-items: baseline;
		font-family: var(--font-logo);
		font-size: clamp(10px, 2.6vw, 14px);
		letter-spacing: clamp(0.18em, 0.8vw, 0.28em);
		line-height: 1.25;
		color: var(--color-brand-navy);
		white-space: nowrap;
		overflow: hidden;
		max-height: 1.4em;
		transition: max-height 0.25s ease, opacity 0.2s ease;
	}

	.bl-letter {
		display: block;
		flex: 0 0 auto;
		overflow: hidden;
		max-width: 1.6em;
		opacity: 1;
		transition: max-width 0.22s ease, opacity 0.16s ease;
	}

	.bl-tagline {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-logo);
		font-size: clamp(7px, 1.8vw, 9px);
		letter-spacing: clamp(0.24em, 1.2vw, 0.4em);
		line-height: 1.25;
		color: var(--color-brand-gold);
		white-space: nowrap;
	}

	/* Tracking dokłada odstęp także po ostatniej literze — bez kompensaty
	   prawa kreska odjeżdża wyraźnie dalej niż lewa. */
	.bl-tagline-text {
		margin-right: calc(-1 * clamp(0.24em, 1.2vw, 0.4em));
	}

	.bl-tagline i {
		display: block;
		flex: 0 0 auto;
		width: clamp(10px, 2.5vw, 18px);
		height: 1px;
		background: currentColor;
	}

	/* Wariant stopki i menu mobilnego — stałe, mniejsze rozmiary. */
	.brand-lockup.is-sm .bl-name {
		font-size: 11px;
		letter-spacing: 0.22em;
	}
	.brand-lockup.is-sm .bl-tagline {
		font-size: 7.5px;
		letter-spacing: 0.32em;
	}
	.brand-lockup.is-sm .bl-tagline-text {
		margin-right: -0.32em;
	}
</style>
```

- [ ] **Step 3: Przełączyć stopkę na `BrandLockup`**

W `src/components/layout/Footer.astro` zamień import w linii 2:

```astro
import BrandLockup from "../ui/BrandLockup.astro";
```

i linię 11:

```astro
		<BrandLockup animated={false} size="sm" />
```

- [ ] **Step 4: Weryfikacja**

```bash
npm run check
```

Oczekiwane: brak błędów. Gdyby `astro check` zgłosił nieużywany import `Logo` albo brakujący props — popraw, zanim pójdziesz dalej.

```bash
npm run dev
```

W stopce sprawdź:
- `ALEKSANDRA POTOCKA` renderuje się w Tenor Sans, kolorem granatowym,
- `KSIĘGOWOŚĆ` jest złote, z **równymi** kreskami po obu stronach (jeśli prawa odstaje, kompensata `margin-right` nie zadziałała),
- `Ę`, `Ś`, `Ć` mają poprawne znaki diakrytyczne,
- brak poziomego przewijania na 360 px.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Logo.astro src/components/ui/BrandLockup.astro src/components/layout/Footer.astro
git commit -m "Add BrandLockup component and reduce Logo to the mark"
```

---

### Task 3: Logotyp w nagłówku i menu mobilnym (wciąż statycznie)

**Files:**
- Modify: `src/components/layout/Header.astro:1-4` (import), `:26` (pasek), `:60` (overlay)

**Interfaces:**
- Consumes: `BrandLockup` z zadania 2.
- Produces: `<nav>` zawierający `.brand-lockup` z `data-brand-lockup` — zadanie 4 podepnie się pod ten atrybut.

To zadanie celowo **nie** dodaje animacji. Jego jedynym celem jest udowodnienie, że lockup mieści się na każdej szerokości. Spec przewiduje przy 320 px 164 px logotypu na 170 px dostępnych — zapas jest zerowy i trzeba to zmierzyć, a nie założyć.

- [ ] **Step 1: Podmienić import**

W `src/components/layout/Header.astro` linia 3:

```astro
import BrandLockup from "../ui/BrandLockup.astro";
```

Import `Logo` znika — nagłówek nie używa już znaczka bezpośrednio.

- [ ] **Step 2: Podmienić logotyp w pasku**

Linia 26, było `<Logo href={isHome ? "#top" : "/"} size="lg" />`:

```astro
	<BrandLockup href={isHome ? "#top" : "/"} size="lg" />
```

- [ ] **Step 3: Podmienić hardkodowany napis w overlayu menu**

Linia 60, było `<span class="font-display text-lg font-extrabold">Potocka</span>`:

```astro
		<BrandLockup animated={false} size="sm" />
```

Dzięki temu w projekcie nie zostaje trzecia, ręcznie sklecona wersja marki.

- [ ] **Step 4: Zmierzyć szerokości — to jest sedno tego zadania**

```bash
npm run dev
```

W DevTools sprawdź kolejno **1440, 768, 360 i 320 px**. Na każdej z nich:
- brak poziomego paska przewijania (`document.documentElement.scrollWidth === window.innerWidth`),
- logotyp nie nachodzi na hamburgera ani na linki nawigacji,
- `ALEKSANDRA POTOCKA` mieści się w jednej linii i nie jest ucięte.

Na 320 px zmierz w konsoli:

```js
const l = document.querySelector('nav .brand-lockup');
const n = document.querySelector('nav .bl-name');
console.log('lockup:', l.getBoundingClientRect().width, 'nazwisko:', n.getBoundingClientRect().width);
```

Jeśli jest ciasno albo coś się nie mieści, **pierwszą rzeczą do zmniejszenia jest znaczek logo, nie tracking** — tracking jest tym, co nadaje logotypowi charakter. Zmniejsz w `Logo.astro` `.logo-mark.is-lg` z `50px` do `42px` i zmierz ponownie. Dopiero gdyby to nie wystarczyło, zejdź z dolną granicą `font-size` w `.bl-name` z `10px` na `9px`.

Zanotuj w commicie, jakie wartości ostatecznie weszły.

- [ ] **Step 5: Sprawdzić menu mobilne**

Na 360 px otwórz menu hamburgerem. Logotyp w nagłówku overlaya ma być czytelny i nie kolidować z przyciskiem zamykania. Zamknij menu — `document.body.style.overflow` musi wrócić do pustego (istniejąca logika w `Header.astro:98-108`, tylko upewnij się, że jej nie ruszyłeś).

- [ ] **Step 6: Weryfikacja i commit**

```bash
npm run check
npm run build
```

Oczekiwane: oba przechodzą bez błędów.

```bash
git add src/components/layout/Header.astro src/components/ui/Logo.astro
git commit -m "Use BrandLockup in header and mobile menu"
```

---

### Task 4: Animacja scroll-linked

**Files:**
- Modify: `src/components/ui/BrandLockup.astro` (blok `<style>` + nowy `<script>`)
- Modify: `src/components/layout/Header.astro` (nowy blok `<style>`)
- Modify: `src/styles/global.css:127` — tylko jeśli pomiar w kroku 6 tego wymaga

**Interfaces:**
- Consumes: `.brand-lockup`, `.bl-letter`, `data-brand-lockup` z zadania 2; nagłówek z zadania 3.
- Produces: klasa `.is-collapsed` na elemencie z `data-brand-lockup`, po której `Header.astro` rozpoznaje stan zwinięty.

- [ ] **Step 1: Dopisać style stanu zwiniętego do `BrandLockup.astro`**

Na końcu bloku `<style>`, przed zamknięciem:

```css
	.bl-letter.is-gone {
		max-width: 0;
		opacity: 0;
	}

	.brand-lockup.is-collapsed .bl-name {
		max-height: 0;
		opacity: 0;
	}
	.brand-lockup.is-collapsed .bl-stack {
		gap: 0;
	}

	/* Znaczek też musi zmaleć — inaczej pasek nie zrobi się niższy.
	   Jego wysokość, nie lockup, jest tym, co wyznacza wysokość nagłówka.
	   Reguła potomka wygrywa z `.logo-mark.is-lg` w Logo.astro. */
	.brand-lockup.is-collapsed :global(.logo-mark) {
		--logo-mark: 40px;
	}

	@media (prefers-reduced-motion: reduce) {
		.bl-letter,
		.bl-name,
		.bl-stack,
		.brand-lockup :global(.logo-mark) {
			transition: none;
		}
	}
```

- [ ] **Step 2: Dopisać skrypt do `BrandLockup.astro`**

Na końcu pliku, po bloku `<style>`:

```astro
<script>
	// Litery znikają od ostatniej do pierwszej, proporcjonalnie do pozycji
	// scrolla. Ten sam wzór odtwarza je przy przewijaniu w górę, więc nie ma
	// osobnej ścieżki dla obu kierunków.
	const lockups = document.querySelectorAll<HTMLElement>("[data-brand-lockup]");

	if (lockups.length) {
		const TRAVEL = 160; // px scrolla na pełne zwinięcie
		const COLLAPSE_AT = 160;
		const RELEASE_AT = 140; // histereza — patrz niżej

		const instances = Array.from(lockups).map((el) => ({
			el,
			letters: Array.from(el.querySelectorAll<HTMLElement>(".bl-letter")),
			visible: -1,
			collapsed: false,
		}));

		function update() {
			const y = window.scrollY;
			const p = Math.min(1, Math.max(0, y / TRAVEL));

			for (const inst of instances) {
				const total = inst.letters.length;
				const visible = Math.ceil((1 - p) * total);

				// Dotykamy DOM tylko przy faktycznej zmianie — typowy tick
				// scrolla nie robi nic.
				if (visible !== inst.visible) {
					for (let i = 0; i < total; i++) {
						inst.letters[i].classList.toggle("is-gone", i >= visible);
					}
					inst.visible = visible;
				}

				// Próg niesymetryczny: zwijamy przy 160, rozwijamy dopiero
				// przy 140. Bez tego zatrzymanie scrolla dokładnie na progu
				// powodowałoby migotanie wysokości paska.
				const collapsed = inst.collapsed ? y >= RELEASE_AT : y >= COLLAPSE_AT;
				if (collapsed !== inst.collapsed) {
					inst.el.classList.toggle("is-collapsed", collapsed);
					inst.collapsed = collapsed;
				}
			}
		}

		let ticking = false;
		function onScroll() {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				update();
				ticking = false;
			});
		}

		window.addEventListener("scroll", onScroll, { passive: true });
		update(); // stan początkowy — np. po przeładowaniu w połowie strony
	}
</script>
```

- [ ] **Step 3: Kurczenie paddingu paska w `Header.astro`**

Na końcu `src/components/layout/Header.astro` dodaj:

```astro
<style>
	/* Nagłówek reaguje na stan logotypu, nie odwrotnie — dzięki temu
	   BrandLockup nic nie wie o nawigacji.

	   `:global()` w środku `:has()` jest tu konieczne, nie kosmetyczne.
	   Scoped styles Astro dopisują `data-astro-cid-*` do każdego selektora
	   w bloku, a `.brand-lockup` należy do scope'u BrandLockup, nie Headera —
	   bez `:global()` reguła skompilowałaby się do selektora, który nigdy
	   niczego nie dopasuje, i padding po prostu by się nie zmieniał. */
	nav:has(:global(.brand-lockup.is-collapsed)) {
		padding-top: 0.625rem;
		padding-bottom: 0.625rem;
	}
</style>
```

Reguła bije utility `py-3.5`, bo Tailwind trzyma utilities w `@layer utilities`, a style spoza warstw mają nad nimi pierwszeństwo niezależnie od specyficzności.

Jeśli po tym kroku padding **nadal** się nie zmienia, sprawdź w DevTools, czy reguła w ogóle występuje w arkuszu — to najszybszy sposób odróżnienia problemu ze scope'em od problemu ze specyficznością.

- [ ] **Step 4: Sprawdzić działanie animacji**

```bash
npm run dev
```

Na 1440 px:
- przewiń powoli w dół — litery znikają **od `A` na końcu `POTOCKA` w stronę `A` na początku `ALEKSANDRA`**; gdyby znikały od początku, odwrócony jest warunek w `classList.toggle`,
- przewiń w górę — litery wracają w odwrotnej kolejności,
- po zniknięciu ostatniej litery pasek robi się niższy, a `KSIĘGOWOŚĆ` zostaje obok znaczka,
- linki nawigacji **nie przesuwają się w poziomie** w trakcie całej animacji.

- [ ] **Step 5: Sprawdzić histerezę**

Ustaw scroll dokładnie w okolicy 150–160 px i porusz kółkiem o jeden ząbek w przód i w tył. Wysokość paska **nie może migotać**. Jeśli miga, sprawdź, czy `RELEASE_AT` jest faktycznie mniejsze od `COLLAPSE_AT`.

- [ ] **Step 6: Zmierzyć wysokość zwiniętego paska i zsynchronizować `scroll-padding-top`**

W konsoli, po przewinięciu poniżej progu:

```js
console.log(document.querySelector('nav').getBoundingClientRect().height);
```

Wartość startowa powinna wyjść ok. **60 px** (znaczek 40 px + 2 × 10 px paddingu), wobec ok. 78 px w stanie rozwiniętym.

`global.css:127` ma dziś `scroll-padding-top: 70px`. Jeśli zmierzona wysokość zwiniętego paska jest **mniejsza niż 70 px**, zostaw wartość bez zmian — nagłówki sekcji i tak nie schowają się pod paskiem. Jeśli wyszła **większa**, podnieś `scroll-padding-top` do zmierzonej wysokości + 10 px.

Zweryfikuj praktycznie: kliknij „Usługi" w nawigacji i sprawdź, czy nagłówek sekcji jest w całości widoczny pod paskiem.

- [ ] **Step 7: Sprawdzić reduced-motion**

W DevTools → Rendering → *Emulate CSS prefers-reduced-motion: reduce*. Przewiń stronę. Litery mają **przeskakiwać** między stanami, bez płynnych przejść, ale kolejność i stan końcowy muszą być takie same.

- [ ] **Step 8: Sprawdzić dostępność**

- Tab na stronie: logotyp w nagłówku dostaje widoczny focus ring i jest jednym elementem fokusowalnym, nie osiemnastoma.
- DevTools → Accessibility: element ma nazwę „Aleksandra Potocka — Księgowość, strona główna", a pojedyncze litery **nie** pojawiają się w drzewie dostępności.
- Logotyp w stopce i w menu mobilnym ma rolę `img` i nazwę „Aleksandra Potocka — Księgowość".

- [ ] **Step 9: Weryfikacja końcowa i commit**

```bash
npm run check
npm run build
```

Oczekiwane: oba przechodzą bez błędów.

Przejdź jeszcze raz przez 1440 / 768 / 360 / 320 px z włączoną animacją i potwierdź brak poziomego przewijania na każdej.

```bash
git add src/components/ui/BrandLockup.astro src/components/layout/Header.astro src/styles/global.css
git commit -m "Animate header logotype letters on scroll"
```

---

## Weryfikacja całości

Po zadaniu 4 przejdź listę ze specu w całości:

- [ ] litery znikają od ostatniej do pierwszej
- [ ] scroll w górę przywraca je w odwrotnej kolejności
- [ ] brak poziomego przewijania na 1440 / 768 / 360 / 320 px
- [ ] linki nawigacji nie przesuwają się w poziomie
- [ ] zwinięta wysokość paska zgadza się ze `scroll-padding-top` (kotwica z menu nie chowa nagłówka sekcji)
- [ ] focus ring widoczny na logotypie
- [ ] `prefers-reduced-motion: reduce` — brak płynnych przejść, stan poprawny
- [ ] `npm run check` i `npm run build` bez błędów
- [ ] `git grep -n "Potocka" src/components` nie zwraca już hardkodowanego napisu w `Header.astro`
