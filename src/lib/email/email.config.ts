import { z } from "zod";

/**
 * `astro dev` ładuje `.env` do `import.meta.env`, natomiast na Vercelu zmienne
 * środowiskowe są dostępne w runtime przez `process.env`. Czytamy oba, żeby ten
 * sam kod działał lokalnie i po deployu — bez tego klucz API bywa `undefined`
 * dokładnie w jednym z tych dwóch środowisk.
 */
function readEnv(key: string): string | undefined {
	return process.env[key] ?? (import.meta.env as Record<string, string | undefined>)[key];
}

const configSchema = z.object({
	brevoApiKey: z.string().min(1, { error: "Brak BREVO_API_KEY" }),
	notificationEmail: z.email({ error: "CONTACT_NOTIFICATION_EMAIL nie jest adresem e-mail" }),
	senderEmail: z.email({ error: "CONTACT_SENDER_EMAIL nie jest adresem e-mail" }),
	senderName: z.string().min(1, { error: "Brak CONTACT_SENDER_NAME" }),
});

export type EmailConfig = z.infer<typeof configSchema>;

/**
 * Współdzielone przez wszystkie formularze wysyłające maile (kontakt, ankieta
 * startowa) — to jedna skrzynka i jeden nadawca dla całej strony.
 *
 * Celowo czytane przy każdym wywołaniu, nie na poziomie modułu: brakująca
 * zmienna ma zwrócić błąd 502 z jednego zapytania, a nie wysadzić cały import
 * i zabrać ze sobą całą funkcję serverless.
 */
export function getEmailConfig(): EmailConfig {
	const result = configSchema.safeParse({
		brevoApiKey: readEnv("BREVO_API_KEY"),
		notificationEmail: readEnv("CONTACT_NOTIFICATION_EMAIL"),
		senderEmail: readEnv("CONTACT_SENDER_EMAIL"),
		senderName: readEnv("CONTACT_SENDER_NAME"),
	});

	if (!result.success) {
		const problems = result.error.issues.map((issue) => issue.message).join("; ");
		throw new Error(`Niepoprawna konfiguracja wysyłki e-mail: ${problems}`);
	}

	return result.data;
}
