import { getEmailConfig } from "../../lib/email/email.config";
import { sendEmail } from "../../lib/email/provider";
import { buildIntakeConfirmation } from "./email/confirmation";
import { buildIntakeOwnerNotification } from "./email/owner-notification";
import type { IntakeMessage } from "./intake.schema";

export interface IntakeSubmissionResult {
	/**
	 * Czy klient dostał kopię swoich odpowiedzi. Interfejs nie może obiecać
	 * „wysłaliśmy kopię na e-mail", jeśli druga wysyłka nie doszła do skutku.
	 */
	clientCopySent: boolean;
}

/**
 * Wysyła dwie wiadomości: powiadomienie do właścicielki z pełną ankietą i
 * kopię odpowiedzi do osoby, która ją wypełniła.
 *
 * Te dwie wysyłki nie są równorzędne. Powiadomienie jest jedynym kanałem,
 * przez który ankieta w ogóle dociera do adresatki — jego porażka musi zostać
 * zgłoszona użytkownikowi (rzucamy wyjątek). Kopia dla klienta jest dodatkiem:
 * skoro dane już leżą w skrzynce, jej porażka nie może kasować przyjętego
 * zgłoszenia, bo klient wypełniłby ankietę drugi raz zupełnie niepotrzebnie.
 */
export async function submitIntakeMessage(
	message: IntakeMessage,
): Promise<IntakeSubmissionResult> {
	const config = getEmailConfig();

	const notification = buildIntakeOwnerNotification(message);

	await sendEmail({
		to: { email: config.notificationEmail },
		// Dzięki temu „Odpowiedz" w skrzynce pisze prosto do klienta,
		// a nie do adresu technicznego dostawcy.
		replyTo: { email: message.email, name: message.name },
		subject: notification.subject,
		html: notification.html,
		text: notification.text,
	});

	const confirmation = buildIntakeConfirmation(message);

	try {
		await sendEmail({
			to: { email: message.email, name: message.name },
			subject: confirmation.subject,
			html: confirmation.html,
			text: confirmation.text,
		});

		return { clientCopySent: true };
	} catch (error) {
		console.error("[intake] Nie udało się wysłać kopii ankiety do klienta:", error);
		return { clientCopySent: false };
	}
}
