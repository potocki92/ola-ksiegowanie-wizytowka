import { getContactConfig } from "../contact.config";

export interface EmailAddress {
	email: string;
	name?: string;
}

export interface EmailMessage {
	to: EmailAddress;
	replyTo?: EmailAddress;
	subject: string;
	html: string;
	text: string;
}

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

/**
 * Jedyne miejsce w projekcie, które wie, przez kogo lecą maile.
 *
 * Świadomie bez SDK — jedno wywołanie `fetch` nie uzasadnia zależności, która
 * wydłużyłaby zimny start funkcji serverless.
 *
 * Po podpięciu własnej domeny wystarczy podmienić ciało tej funkcji na Resend;
 * `EmailMessage` i reszta modułu zostają bez zmian.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
	const config = getContactConfig();

	// Bez limitu czasu zawieszony dostawca trzymałby użytkownika na kręcącym się
	// spinnerze aż do timeoutu całej funkcji.
	const response = await fetch(BREVO_ENDPOINT, {
		method: "POST",
		headers: {
			"api-key": config.brevoApiKey,
			"content-type": "application/json",
			accept: "application/json",
		},
		body: JSON.stringify({
			sender: { email: config.senderEmail, name: config.senderName },
			to: [message.to],
			...(message.replyTo ? { replyTo: message.replyTo } : {}),
			subject: message.subject,
			htmlContent: message.html,
			// Wersja tekstowa nie jest opcjonalna: maile bez `text/plain`
			// dostają wyższą ocenę spamową.
			textContent: message.text,
		}),
		signal: AbortSignal.timeout(10_000),
	});

	if (!response.ok) {
		// Treść błędu Brevo trafia wyłącznie do logów serwera — użytkownik
		// zobaczy ogólny komunikat, bo odpowiedź może zawierać fragmenty klucza.
		const details = await response.text().catch(() => "");
		throw new Error(`Brevo odrzuciło wiadomość (HTTP ${response.status}): ${details}`);
	}
}
