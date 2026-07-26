// Reveal-on-scroll: po wejściu w viewport dodaje `.is-visible` do
// `[data-reveal]`. Grupy `[data-reveal-group]` staggerują swoich potomków
// `[data-reveal]` przez `--reveal-delay`. Element NIE jest odłączany po
// pierwszym odpaleniu (w przeciwieństwie do BrandLockup.astro) — obserwujemy
// go cały czas, żeby kafelek mógł się też schować, gdy wyjeżdża z viewportu
// w trakcie scrolla w górę.
const STAGGER_STEP = 80; // ms między kolejnymi elementami grupy
const STAGGER_MAX = 8; // limit kroków, by ostatni element nie wchodził zbyt późno

const groups = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal-group]"));
const standalone = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
	(el) => !el.closest("[data-reveal-group]"),
);
const targets = [...groups, ...standalone];

if (targets.length) {
	// Nadaj potomkom grup indywidualne opóźnienie staggera.
	for (const group of groups) {
		const items = group.querySelectorAll<HTMLElement>("[data-reveal]");
		items.forEach((item, i) => {
			const step = Math.min(i, STAGGER_MAX);
			item.style.setProperty("--reveal-delay", `${step * STAGGER_STEP}ms`);
		});
	}

	// Kierunek scrolla decyduje, czy element znikający z viewportu ma się
	// schować. W dół: kafelek, który już się pokazał, zostaje widoczny nawet
	// gdy przewiniemy go poza ekran — inaczej treść "znikałaby" w trakcie
	// dalszego scrollowania do przodu, co wygląda na błąd, nie efekt. W górę:
	// kafelek wyjeżdżający z viewportu chowa się, więc cofanie scrolla
	// odtwarza animację od tyłu.
	let lastY = window.scrollY;
	let direction: "up" | "down" = "down";
	function updateDirection() {
		const y = window.scrollY;
		if (Math.abs(y - lastY) > 1) {
			direction = y > lastY ? "down" : "up";
			lastY = y;
		}
	}
	window.addEventListener("scroll", updateDirection, { passive: true });

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

	for (const target of targets) observer.observe(target);
}
