// Obsługa wysyłki formularza po stronie przeglądarki: walidacja natywna, POST
// na endpoint, komunikat błędu i przejście do panelu podziękowania.
//
// Kontakt i ankieta robiły to wcześniej dwoma niemal identycznymi skryptami
// inline. Rozjechałyby się przy pierwszej zmianie stanu wysyłki, a właśnie taką
// zmianę tu wprowadzamy (spinner + wycofanie formularza), więc logika przenosi
// się w jedno miejsce. Różnice zostają w opcjach: selektory i treść komunikatu
// awaryjnego.
import { onPageInit } from "./pageInit";

export interface FormFlowOptions {
	/** Kontener obejmujący formularz i panel sukcesu. */
	block: string;
	form: string;
	success: string;
	/** Komunikat, gdy serwer nie poda własnego (padła sieć albo endpoint). */
	fallbackError: string;
	loadingLabel?: string;
}

interface FormResponse {
	ok?: boolean;
	error?: string;
	fields?: Record<string, string[] | undefined>;
}

// Musi się zgadzać z czasem przejścia `[data-form-leaving]` w global.css —
// dopiero po nim formularz znika na dobre i pojawia się podziękowanie.
const LEAVE_MS = 220;

function setup(block: HTMLElement, options: FormFlowOptions) {
	const form = block.querySelector<HTMLFormElement>(options.form);
	const success = block.querySelector<HTMLElement>(options.success);
	const errorBox = block.querySelector<HTMLElement>("[data-form-error]");
	const submit = block.querySelector<HTMLButtonElement>("[data-submit]");
	const elapsed = block.querySelector<HTMLInputElement>("[data-elapsed]");

	if (!form || !success || !errorBox || !submit) {
		return;
	}

	// Etykieta ma własny element, żeby podmiana tekstu nie kasowała spinnera.
	// Gdyby go zabrakło (zmiana w szablonie), spada z powrotem na przycisk.
	const label = submit.querySelector<HTMLElement>("[data-submit-label]") ?? submit;
	const defaultLabel = label.textContent ?? "";
	const mountedAt = Date.now();

	const showError = (message?: string) => {
		errorBox.textContent = message || options.fallbackError;
		errorBox.hidden = false;
	};

	const setLoading = (loading: boolean) => {
		submit.disabled = loading;
		submit.toggleAttribute("data-loading", loading);
		label.textContent = loading ? (options.loadingLabel ?? "Wysyłam…") : defaultLabel;
	};

	const showSuccess = () => {
		// Formularz najpierw się wycofuje, a dopiero potem znika — podmiana
		// skokiem wyglądała, jakby strona się przeładowała.
		form.setAttribute("data-form-leaving", "");

		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		window.setTimeout(
			() => {
				// `form.hidden` by nie zadziałało: Form.astro nakłada `flex`,
				// które wygrywa z `[hidden]` z preflightu Tailwinda.
				form.style.display = "none";
				success.hidden = false;

				// Bez przeniesienia fokusu użytkownik czytnika ekranu nie
				// dowiedziałby się, że formularz zniknął.
				success.focus();
			},
			reduce ? 0 : LEAVE_MS,
		);
	};

	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		// Natywna walidacja HTML zdejmuje z serwera oczywiste przypadki
		// i pokazuje błąd przy właściwym polu.
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		errorBox.hidden = true;
		setLoading(true);

		if (elapsed) {
			elapsed.value = String(Date.now() - mountedAt);
		}

		try {
			const response = await fetch(form.action, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(Object.fromEntries(new FormData(form))),
			});

			const data: FormResponse | null = await response.json().catch(() => null);

			if (!response.ok || !data?.ok) {
				const fieldError = Object.values(data?.fields ?? {})
					.flat()
					.find(Boolean);

				showError(fieldError ?? data?.error);
				return;
			}

			showSuccess();
		} catch {
			showError();
		} finally {
			setLoading(false);
		}
	});
}

export function initFormFlow(options: FormFlowOptions): void {
	onPageInit(() => {
		document
			.querySelectorAll<HTMLElement>(options.block)
			.forEach((block) => setup(block, options));
	});
}
