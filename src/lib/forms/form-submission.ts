/**
 * Klient wysyłki formularzy — jedyna kopia logiki, z której korzystają
 * formularz kontaktowy i ankieta.
 *
 * Oba formularze robią dokładnie to samo: walidacja natywna, POST z JSON-em,
 * blokada przycisku, wyciągnięcie błędu z odpowiedzi API, podmiana formularza
 * na kartę sukcesu. Różnią się wyłącznie treścią i tym, co robią z danymi
 * zwróconymi przez API po sukcesie (`onSuccess`).
 *
 * Wymagane atrybuty w markupie (renderują je `Form.astro`,
 * `SpamProtectionFields.astro` i komponent sukcesu):
 * `[data-form]`, `[data-form-success]`, `[data-form-error]`,
 * `[data-form-submit]`, opcjonalnie `[data-form-elapsed]`.
 */

export interface FormApiResponse {
	ok?: boolean;
	error?: string;
	/** Błędy per pole z `z.flattenError` — pokazujemy pierwszy z brzegu. */
	fields?: Record<string, string[] | undefined>;
	[key: string]: unknown;
}

interface FormSubmissionOptions {
	/** Selektor kontenera obejmującego formularz i kartę sukcesu. */
	block: string;
	/** Komunikat, gdy API nie odpowiedziało albo nie podało własnego. */
	fallbackError: string;
	/** Etykieta przycisku w trakcie wysyłki. */
	pendingLabel?: string;
	/** Wołane po sukcesie, zanim karta sukcesu stanie się widoczna. */
	onSuccess?: (data: FormApiResponse, success: HTMLElement) => void;
}

export function initFormSubmission({
	block,
	fallbackError,
	pendingLabel = "Wysyłam…",
	onSuccess,
}: FormSubmissionOptions): void {
	document.querySelectorAll<HTMLElement>(block).forEach((root) => {
		const form = root.querySelector<HTMLFormElement>("[data-form]");
		const success = root.querySelector<HTMLElement>("[data-form-success]");
		const errorBox = root.querySelector<HTMLElement>("[data-form-error]");
		const submit = root.querySelector<HTMLButtonElement>("[data-form-submit]");
		const elapsed = root.querySelector<HTMLInputElement>("[data-form-elapsed]");

		if (!form || !success || !errorBox || !submit) {
			return;
		}

		const mountedAt = Date.now();
		const defaultLabel = submit.textContent ?? "";

		const showError = (message?: string) => {
			errorBox.textContent = message || fallbackError;
			errorBox.hidden = false;
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
			submit.disabled = true;
			submit.textContent = pendingLabel;

			if (elapsed) {
				elapsed.value = String(Date.now() - mountedAt);
			}

			try {
				const response = await fetch(form.action, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(Object.fromEntries(new FormData(form))),
				});

				const data: FormApiResponse | null = await response
					.json()
					.catch(() => null);

				if (!response.ok || !data?.ok) {
					const fieldError = Object.values(data?.fields ?? {})
						.flat()
						.find(Boolean);

					showError(fieldError ?? data?.error);
					return;
				}

				onSuccess?.(data, success);

				// `form.hidden` by nie zadziałało: Form.astro nakłada `flex`,
				// które wygrywa z `[hidden]` z preflightu Tailwinda.
				form.style.display = "none";
				success.hidden = false;

				// Bez przeniesienia fokusu użytkownik czytnika ekranu nie
				// dowiedziałby się, że formularz zniknął.
				success.focus();
			} catch {
				showError();
			} finally {
				submit.disabled = false;
				submit.textContent = defaultLabel;
			}
		});
	});
}
