import {
	COLOR,
	FONT_STACK,
	escapeHtml,
	escapeHtmlWithBreaks,
	renderDataRow,
	renderEmailLayout,
	renderQuoteBlock,
} from "../../../lib/email/layout";
import {
	businessStatusOptions,
	currentAccountingOptions,
	employmentOptions,
	labelFor,
	legalFormOptions,
	preferredContactOptions,
	taxFormOptions,
	vatStatusOptions,
} from "../intake.options";
import type { IntakeMessage } from "../intake.schema";

export interface BuiltEmail {
	subject: string;
	html: string;
	text: string;
}

function sectionHeading(label: string): string {
	return `<p style="margin:26px 0 10px;font-family:${FONT_STACK};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${COLOR.mutedLight};">${escapeHtml(label)}</p>`;
}

/** Powiadomienie dla właścicielki o nowej ankiecie startowej wypełnionej przez klienta. */
export function buildIntakeOwnerNotification(message: IntakeMessage): BuiltEmail {
	const phoneHtml = message.phone
		? `<a href="tel:${escapeHtml(message.phone.replace(/\s/g, ""))}" style="color:${COLOR.accent};text-decoration:none;">${escapeHtml(message.phone)}</a>`
		: `<span style="color:${COLOR.mutedLight};">nie podano</span>`;

	const dash = `<span style="color:${COLOR.mutedLight};">nie podano</span>`;

	const content = `
<p style="margin:0 0 8px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${COLOR.muted};">
Ktoś wypełnił ankietę startową przed rozmową. Odpowiedz na tę wiadomość, żeby napisać prosto do klienta.
</p>

${sectionHeading("Dane kontaktowe")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${renderDataRow("Imię i nazwisko", escapeHtml(message.name))}
${renderDataRow(
	"E-mail",
	`<a href="mailto:${escapeHtml(message.email)}" style="color:${COLOR.accent};text-decoration:none;">${escapeHtml(message.email)}</a>`,
)}
${renderDataRow("Telefon", phoneHtml)}
</table>

${sectionHeading("O firmie")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${renderDataRow(
	"Status działalności",
	escapeHtml(labelFor(businessStatusOptions, message.businessStatus)),
)}
${renderDataRow("Planowany/faktyczny start", message.plannedStartDate ? escapeHtml(message.plannedStartDate) : dash)}
${renderDataRow("Forma prawna", escapeHtml(labelFor(legalFormOptions, message.legalForm)))}
</table>
${renderQuoteBlock(escapeHtmlWithBreaks(message.businessDescription))}

${sectionHeading("Rozliczenia")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${renderDataRow("Forma opodatkowania", escapeHtml(labelFor(taxFormOptions, message.taxForm)))}
${renderDataRow("Status VAT", escapeHtml(labelFor(vatStatusOptions, message.vatStatus)))}
${renderDataRow("Zatrudnienie", escapeHtml(labelFor(employmentOptions, message.employment)))}
${renderDataRow("Liczba osób", message.employeeCount ? escapeHtml(message.employeeCount) : dash)}
${renderDataRow("Skala działalności", message.estimatedScale ? escapeHtml(message.estimatedScale) : dash)}
</table>

${sectionHeading("Obecna sytuacja i uwagi")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${renderDataRow(
	"Obecna obsługa księgowa",
	escapeHtml(labelFor(currentAccountingOptions, message.currentAccounting)),
)}
${renderDataRow(
	"Preferowany kontakt",
	escapeHtml(labelFor(preferredContactOptions, message.preferredContact)),
)}
</table>
${message.notes ? renderQuoteBlock(escapeHtmlWithBreaks(message.notes)) : ""}`;

	const textLines = [
		"Nowa ankieta startowa wypełniona przed rozmową.",
		"",
		"Dane kontaktowe",
		`Imię i nazwisko: ${message.name}`,
		`E-mail: ${message.email}`,
		`Telefon: ${message.phone ?? "nie podano"}`,
		"",
		"O firmie",
		`Status działalności: ${labelFor(businessStatusOptions, message.businessStatus)}`,
		`Planowany/faktyczny start: ${message.plannedStartDate ?? "nie podano"}`,
		`Forma prawna: ${labelFor(legalFormOptions, message.legalForm)}`,
		`Opis działalności: ${message.businessDescription}`,
		"",
		"Rozliczenia",
		`Forma opodatkowania: ${labelFor(taxFormOptions, message.taxForm)}`,
		`Status VAT: ${labelFor(vatStatusOptions, message.vatStatus)}`,
		`Zatrudnienie: ${labelFor(employmentOptions, message.employment)}`,
		`Liczba osób: ${message.employeeCount ?? "nie podano"}`,
		`Skala działalności: ${message.estimatedScale ?? "nie podano"}`,
		"",
		"Obecna sytuacja i uwagi",
		`Obecna obsługa księgowa: ${labelFor(currentAccountingOptions, message.currentAccounting)}`,
		`Preferowany kontakt: ${labelFor(preferredContactOptions, message.preferredContact)}`,
		`Uwagi: ${message.notes ?? "brak"}`,
		"",
		"Odpowiedz na tę wiadomość, żeby napisać prosto do klienta.",
	];

	return {
		subject: `Ankieta startowa: ${message.name}`,
		html: renderEmailLayout({
			heading: "Nowa ankieta startowa",
			subheading: "Formularz przed rozmową z klientem",
			preheader: `${message.name} — ${message.businessDescription.slice(0, 90)}`,
			content,
		}),
		text: textLines.join("\n"),
	};
}
