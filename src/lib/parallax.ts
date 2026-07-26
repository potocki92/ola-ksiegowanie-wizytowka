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
