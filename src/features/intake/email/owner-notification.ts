import {
	COLOR,
	FONT_STACK,
	escapeHtml,
	renderEmailLayout,
} from "../../../lib/email/layout";
import type { BuiltEmail } from "../../../lib/email/provider";
import {
	buildIntakeHighlights,
	buildIntakeSubject,
	buildIntakeSummary,
	type IntakeSummaryField,
} from "../intake.summary";
import type { IntakeMessage } from "../intake.schema";
import { renderSummaryHtml, renderSummaryText } from "./summary-sections";

/** Puste pola zostają widoczne — właścicielka ma wiedzieć, o co dopytać. */
const EMPTY_VALUE = "nie podano";

/** Powiadomienie dla właścicielki o nowej ankiecie wypełnionej przez klienta. */
export function buildIntakeOwnerNotification(message: IntakeMessage): BuiltEmail {
	const highlights = buildIntakeHighlights(message);
	const sections = buildIntakeSummary(message);

	const content = `
<p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${COLOR.muted};">
Ktoś wypełnił ankietę przed rozmową. Odpowiedz na tę wiadomość, żeby napisać prosto do klienta.
</p>

${renderHighlightsHtml(highlights)}

${renderSummaryHtml(sections, { emptyValue: EMPTY_VALUE })}`;

	const text = [
		"Nowa ankieta wypełniona przed rozmową.",
		"",
		...highlights
			.filter((field) => field.value)
			.map((field) => `${field.label}: ${field.value}`),
		"",
		renderSummaryText(sections, { emptyValue: EMPTY_VALUE }),
		"",
		"Odpowiedz na tę wiadomość, żeby napisać prosto do klienta.",
	].join("\n");

	return {
		subject: buildIntakeSubject(message),
		html: renderEmailLayout({
			heading: "Nowa ankieta",
			subheading: "Formularz przed rozmową z klientem",
			preheader: `${message.name} — ${message.businessDescription.slice(0, 90)}`,
			content,
		}),
		text,
	};
}

/**
 * Skrót zgłoszenia w jednym bloku: po jego przeczytaniu wiadomo, z kim i o
 * czym będzie rozmowa, bez przewijania do pełnych sekcji niżej.
 */
function renderHighlightsHtml(fields: IntakeSummaryField[]): string {
	const rows = fields
		.filter((field) => field.value)
		.map((field) => {
			const value = escapeHtml(field.value ?? "");
			const valueHtml = field.href
				? `<a href="${escapeHtml(field.href)}" style="color:${COLOR.accent};text-decoration:none;font-weight:700;">${value}</a>`
				: `<strong style="font-weight:700;">${value}</strong>`;

			return `<tr>
<td style="padding:3px 12px 3px 0;font-family:${FONT_STACK};font-size:13px;line-height:1.5;color:${COLOR.muted};white-space:nowrap;vertical-align:top;">${escapeHtml(field.label)}</td>
<td style="padding:3px 0;font-family:${FONT_STACK};font-size:14px;line-height:1.5;color:${COLOR.ink};">${valueHtml}</td>
</tr>`;
		})
		.join("\n");

	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.surfaceTint};border-radius:14px;">
<tr>
<td style="padding:18px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
${rows}
</table>
</td>
</tr>
</table>`;
}
