// Reveal-on-scroll: po wejściu w viewport dodaje `.is-visible` do
// `[data-reveal]`. Grupy `[data-reveal-group]` staggerują swoich potomków
// `[data-reveal]` przez `--reveal-delay`. Element NIE jest odłączany po
// pierwszym odpaleniu (w przeciwieństwie do BrandLockup.astro) — obserwujemy
// go cały czas, żeby kafelek mógł się też schować, gdy wyjeżdża z viewportu
// w trakcie scrolla w górę.
//
// Kierunek wejścia (z dołu / z lewej / z prawej / ze skali) wybiera WARTOŚĆ
// atrybutu `data-reveal` i obsługuje go wyłącznie CSS — tutaj interesuje nas
// tylko obecność atrybutu, więc selektor pozostaje ten sam dla każdej wersji.
import { onPageInit } from "./pageInit";

const STAGGER_STEP = 60; // ms między kolejnymi elementami grupy
const STAGGER_MAX = 8; // limit kroków, by ostatni element nie wchodził zbyt późno

// Kierunek scrolla decyduje, czy element znikający z viewportu ma się schować.
// W dół: kafelek, który już się pokazał, zostaje widoczny nawet gdy przewiniemy
// go poza ekran — inaczej treść "znikałaby" w trakcie dalszego scrollowania do
// przodu, co wygląda na błąd, nie efekt. W górę: kafelek wyjeżdżający z
// viewportu chowa się, więc cofanie scrolla odtwarza animację od tyłu.
let lastY = window.scrollY;
let direction: "up" | "down" = "down";

window.addEventListener(
	"scroll",
	() => {
		const y = window.scrollY;
		if (Math.abs(y - lastY) > 1) {
			direction = y > lastY ? "down" : "up";
			lastY = y;
		}
	},
	{ passive: true },
);

const observer = new IntersectionObserver(
	(entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				entry.target.classList.add("is-visible");
			} else if (direction === "up") {
				entry.target.classList.remove("is-visible");
			}
		}
	},
	{ rootMargin: "0px 0px -10% 0px", threshold: 0 },
);

onPageInit(() => {
	// Po podmianie strony obserwowane węzły są już poza drzewem — obserwator
	// jest jeden na cały dokument, więc zaczynamy od czystej listy.
	observer.disconnect();

	const groups = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal-group]"));
	const standalone = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
		(el) => !el.closest("[data-reveal-group]"),
	);

	// Nadaj potomkom grup indywidualne opóźnienie staggera.
	for (const group of groups) {
		const items = group.querySelectorAll<HTMLElement>("[data-reveal]");
		items.forEach((item, i) => {
			const step = Math.min(i, STAGGER_MAX);
			item.style.setProperty("--reveal-delay", `${step * STAGGER_STEP}ms`);
		});
	}

	lastY = window.scrollY;
	direction = "down";

	for (const target of [...groups, ...standalone]) observer.observe(target);
});
