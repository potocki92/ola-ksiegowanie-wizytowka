import { getEmailConfig } from "../../lib/email/email.config";
import { sendEmail } from "../../lib/email/provider";
import { buildIntakeConfirmation } from "./email/confirmation";
import { buildIntakeOwnerNotification } from "./email/owner-notification";
import type { IntakeMessage } from "./intake.schema";

/**
 * Wysyła dwie wiadomości: powiadomienie do właścicielki z pełną ankietą i
 * potwierdzenie do osoby, która ją wypełniła.
 *
 * Te dwie wysyłki nie są równorzędne — patrz `submitContactMessage`, ten sam
 * podział odpowiedzialności. Rzuca wyjątek tylko wtedy, gdy nie udało się
 * dostarczyć powiadomienia.
 */
export async function submitIntakeMessage(message: IntakeMessage): Promise<void> {
	const config = getEmailConfig();

	const notification = buildIntakeOwnerNotification(message);

	await sendEmail({
		to: { email: config.notificationEmail },
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
	} catch (error) {
		console.error("[intake] Nie udało się wysłać potwierdzenia do nadawcy:", error);
	}
}
