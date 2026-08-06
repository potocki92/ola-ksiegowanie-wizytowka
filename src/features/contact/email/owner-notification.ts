import {
	COLOR,
	FONT_STACK,
	escapeHtml,
	escapeHtmlWithBreaks,
	renderDataRow,
	renderEmailLayout,
	renderQuoteBlock,
} from "../../../lib/email/layout";
import type { ContactMessage } from "../contact.schema";

export interface BuiltEmail {
	subject: string;
	html: string;
	text: string;
}

/** Powiadomienie dla właścicielki o nowym zgłoszeniu z formularza. */
export function buildOwnerNotification(message: ContactMessage): BuiltEmail {
	const phoneHtml = message.phone
		? `<a href="tel:${escapeHtml(message.phone.replace(/\s/g, ""))}" style="color:${COLOR.accent};text-decoration:none;">${escapeHtml(message.phone)}</a>`
		: `<span style="color:${COLOR.mutedLight};">nie podano</span>`;

	const content = `
<p style="margin:0 0 24px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${COLOR.muted};">
Ktoś wypełnił formularz na stronie. Odpowiedz na tę wiadomość, żeby napisać prosto do klienta.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${renderDataRow("Imię i nazwisko", escapeHtml(message.name))}
${renderDataRow(
	"E-mail",
	`<a href="mailto:${escapeHtml(message.email)}" style="color:${COLOR.accent};text-decoration:none;">${escapeHtml(message.email)}</a>`,
)}
${renderDataRow("Telefon", phoneHtml)}
${message.inquiryType ? renderDataRow("Rodzaj zapytania", escapeHtml(message.inquiryType)) : ""}
${message.monthlyDocuments ? renderDataRow("Liczba dokumentów miesięcznie", escapeHtml(message.monthlyDocuments)) : ""}
</table>

<p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${COLOR.mutedLight};">
Wiadomość
</p>
${renderQuoteBlock(escapeHtmlWithBreaks(message.message))}`;

	const text = [
		"Nowe zgłoszenie z formularza na stronie.",
		"",
		`Imię i nazwisko: ${message.name}`,
		`E-mail: ${message.email}`,
		`Telefon: ${message.phone ?? "nie podano"}`,
		...(message.inquiryType ? [`Rodzaj zapytania: ${message.inquiryType}`] : []),
		...(message.monthlyDocuments ? [`Liczba dokumentów miesięcznie: ${message.monthlyDocuments}`] : []),
		"",
		"Wiadomość:",
		message.message,
		"",
		"Odpowiedz na tę wiadomość, żeby napisać prosto do klienta.",
	].join("\n");

	return {
		// Imię w temacie pozwala rozpoznać zgłoszenie bez otwierania maila.
		subject: `Nowe zapytanie: ${message.name}`,
		html: renderEmailLayout({
			heading: "Nowe zapytanie ze strony",
			subheading: "Formularz kontaktowy",
			preheader: `${message.name} — ${message.message.slice(0, 90)}`,
			content,
		}),
		text,
	};
}
