import { getContactConfig } from "./contact.config";
import type { ContactMessage } from "./contact.schema";
import { buildConfirmation } from "./email/confirmation";
import { buildOwnerNotification } from "./email/owner-notification";
import { sendEmail } from "./email/provider";

/**
 * Wysyła dwie wiadomości: powiadomienie do właścicielki i potwierdzenie do
 * osoby, która wypełniła formularz.
 *
 * Te dwie wysyłki nie są równorzędne. Powiadomienie jest jedynym kanałem, przez
 * który zgłoszenie w ogóle dociera do adresata — jego porażka musi zostać
 * zgłoszona użytkownikowi. Potwierdzenie jest wyłącznie grzecznościowe, więc
 * jego porażka nie może unieważnić przyjętego zgłoszenia: klient wypełniałby
 * formularz drugi raz, mimo że wiadomość już leży w skrzynce.
 *
 * Rzuca wyjątek tylko wtedy, gdy nie udało się dostarczyć powiadomienia.
 */
export async function submitContactMessage(message: ContactMessage): Promise<void> {
	const config = getContactConfig();

	const notification = buildOwnerNotification(message);

	await sendEmail({
		to: { email: config.notificationEmail },
		// Dzięki temu „Odpowiedz" w skrzynce pisze prosto do klienta,
		// a nie do adresu technicznego dostawcy.
		replyTo: { email: message.email, name: message.name },
		subject: notification.subject,
		html: notification.html,
		text: notification.text,
	});

	const confirmation = buildConfirmation(message);

	try {
		await sendEmail({
			to: { email: message.email, name: message.name },
			subject: confirmation.subject,
			html: confirmation.html,
			text: confirmation.text,
		});
	} catch (error) {
		console.error("[contact] Nie udało się wysłać potwierdzenia do nadawcy:", error);
	}
}
