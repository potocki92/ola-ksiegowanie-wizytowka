import {
	COLOR,
	FONT_STACK,
	escapeHtml,
	escapeHtmlWithBreaks,
	renderEmailLayout,
	renderQuoteBlock,
} from "../../../lib/email/layout";
import type { ContactMessage } from "../contact.schema";
import type { BuiltEmail } from "./owner-notification";

/** Potwierdzenie dla osoby, która wypełniła formularz. */
export function buildConfirmation(message: ContactMessage): BuiltEmail {
	// Do maila wchodzi samo imię — „Dzień dobry, Janie Kowalski" brzmi jak
	// korespondencja urzędowa, a nie jak wiadomość od księgowej.
	const firstName = message.name.split(/\s+/)[0] ?? message.name;

	const content = `
<p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:16px;line-height:1.6;color:${COLOR.ink};">
Dzień dobry${firstName ? `, ${escapeHtml(firstName)}` : ""}!
</p>

<p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLOR.ink};">
Dziękuję za wiadomość — dotarła do mnie i już na nią patrzę. Odpowiadam najpóźniej
w następnym dniu roboczym, z konkretną wyceną i informacją o możliwym zakresie
współpracy.
</p>

<p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${COLOR.mutedLight};">
Treść Twojego zapytania
</p>
${renderQuoteBlock(escapeHtmlWithBreaks(message.message))}

<p style="margin:24px 0 0;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLOR.ink};">
Jeśli sprawa jest pilna, zadzwoń:
<a href="tel:+48533032455" style="color:${COLOR.accent};text-decoration:none;font-weight:700;">533 032 455</a>.
</p>

<p style="margin:24px 0 0;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLOR.ink};">
Do usłyszenia,<br />
<strong style="font-weight:700;">Aleksandra Potocka</strong>
</p>

<p style="margin:26px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${COLOR.mutedLight};">
Tę wiadomość wysłał automat, bo wypełniłeś formularz na stronie. Jeśli to nie Ty —
zignoruj ją, nie podejmiemy żadnych działań.
</p>`;

	const text = [
		`Dzień dobry${firstName ? `, ${firstName}` : ""}!`,
		"",
		"Dziękuję za wiadomość — dotarła do mnie i już na nią patrzę. Odpowiadam",
		"najpóźniej w następnym dniu roboczym.",
		"",
		"Treść Twojego zapytania:",
		message.message,
		"",
		"Jeśli sprawa jest pilna, zadzwoń: 533 032 455",
		"",
		"Do usłyszenia,",
		"Aleksandra Potocka — Księgowość",
		"",
		"Tę wiadomość wysłał automat, bo wypełniłeś formularz na stronie.",
		"Jeśli to nie Ty — zignoruj ją, nie podejmiemy żadnych działań.",
	].join("\n");

	return {
		subject: "Dziękuję za wiadomość — Aleksandra Potocka, Księgowość",
		html: renderEmailLayout({
			heading: "Dziękuję za wiadomość",
			subheading: "Potwierdzenie wysłania formularza",
			preheader: "Twoje zapytanie do mnie dotarło. Odpowiadam najpóźniej w następnym dniu roboczym.",
			content,
		}),
		text,
	};
}
