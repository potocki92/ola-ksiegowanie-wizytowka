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
