/**
 * Dwa pytania w ankiecie zmieniają sens pól położonych niżej. Zamiast
 * frameworka wystarczy nasłuch `change` na dwóch selectach.
 *
 * Wszystkie treści przychodzą z `data-*` w komponentach sekcji — tu zostaje
 * samo zachowanie, żeby copy dało się zmienić bez zaglądania do JavaScriptu.
 */
export function initIntakeConditionalFields(block: HTMLElement): void {
	syncStartDateHint(block);
	syncEmployeeCount(block);
}

/** „Data rozpoczęcia" znaczy co innego dla firmy istniejącej i planowanej. */
function syncStartDateHint(block: HTMLElement): void {
	const status = block.querySelector<HTMLSelectElement>('[name="businessStatus"]');
	const wrapper = block.querySelector<HTMLElement>("[data-intake-start-date]");
	const hint = wrapper?.querySelector<HTMLElement>("[data-form-hint]");

	if (!status || !wrapper || !hint) {
		return;
	}

	const hints: Record<string, string | undefined> = {
		existing: wrapper.dataset.hintExisting,
		planned: wrapper.dataset.hintPlanned,
	};

	const apply = () => {
		const next = hints[status.value];

		if (next) {
			// Podpowiedź jest powiązana z polem przez `aria-describedby`, więc
			// czytnik ekranu odczyta nową treść przy wejściu w pole.
			hint.textContent = next;
		}
	};

	status.addEventListener("change", apply);
	apply();
}

/** Liczba osób jest pytaniem tylko wtedy, gdy ktoś w ogóle zatrudnia. */
function syncEmployeeCount(block: HTMLElement): void {
	const employment = block.querySelector<HTMLSelectElement>('[name="employment"]');
	const wrapper = block.querySelector<HTMLElement>("[data-intake-employee-count]");
	const hiddenFor = wrapper?.dataset.hiddenFor;

	if (!employment || !wrapper || !hiddenFor) {
		return;
	}

	const apply = () => {
		// Wartość zostaje w polu: po powrocie do odpowiedzi „tak" użytkownik
		// widzi to, co wpisał wcześniej. Ukryte pole nie jest fokusowalne, więc
		// nie wypada z nawigacji klawiaturą w połowie formularza.
		wrapper.hidden = employment.value === "" || employment.value === hiddenFor;
	};

	employment.addEventListener("change", apply);
	apply();
}
