// Podświetlenie kart podążające za kursorem: ustawia `--glow-x`/`--glow-y` na
// `[data-glow]`, resztę (gradient, intensywność, wygaszanie) robi CSS.
//
// Jeden listener na `document` zamiast jednego na kartę — kart jest kilkanaście
// i przy `pointermove` liczy się każda niepotrzebna ramka. Pozycję zapisujemy
// w rAF, bo `pointermove` potrafi lecieć częściej niż odświeżanie ekranu.
import { onPageInit } from "./pageInit";

const hoverCapable = window.matchMedia("(hover: hover)");

let pending: { card: HTMLElement; x: number; y: number } | null = null;
let ticking = false;

function flush() {
	ticking = false;
	if (!pending) return;
	const { card, x, y } = pending;
	pending = null;
	card.style.setProperty("--glow-x", `${x}%`);
	card.style.setProperty("--glow-y", `${y}%`);
}

function onPointerMove(event: PointerEvent) {
	const target = event.target as Element | null;
	const card = target?.closest<HTMLElement>("[data-glow]");
	if (!card) return;

	const rect = card.getBoundingClientRect();
	pending = {
		card,
		x: ((event.clientX - rect.left) / rect.width) * 100,
		y: ((event.clientY - rect.top) / rect.height) * 100,
	};

	if (!ticking) {
		ticking = true;
		requestAnimationFrame(flush);
	}
}

if (hoverCapable.matches) {
	document.addEventListener("pointermove", onPointerMove, { passive: true });

	// Po nawigacji zostaje wskaźnik zapisany dla karty z poprzedniej strony —
	// bez wyczyszczenia pierwsza klatka na nowej stronie mrugnęłaby starą pozycją.
	onPageInit(() => {
		pending = null;
	});
}
