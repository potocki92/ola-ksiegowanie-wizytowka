import {
	COLOR,
	FONT_STACK,
	escapeHtml,
	renderEmailLayout,
} from "../../../lib/email/layout";
import type { BuiltEmail } from "../../../lib/email/provider";
import { company } from "../../../data/company";
import { buildIntakeSummary } from "../intake.summary";
import type { IntakeMessage } from "../intake.schema";
import { renderSummaryHtml, renderSummaryText } from "./summary-sections";

/**
 * Kopia ankiety dla osoby, która ją wypełniła.
 *
 * Klient dostaje dokładnie to, co zostało wysłane — bez pól technicznych
 * (honeypot, czas wypełniania) i bez pustych wierszy, które niczego nie wnoszą
 * do wiadomości „oto co przesłałeś".
 */
export function buildIntakeConfirmation(message: IntakeMessage): BuiltEmail {
	// Do maila wchodzi samo imię — patrz uzasadnienie w potwierdzeniu kontaktowym.
	const firstName = message.name.split(/\s+/)[0] ?? message.name;
	const sections = buildIntakeSummary(message);

	const content = `
<p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:16px;line-height:1.6;color:${COLOR.ink};">
Dzień dobry${firstName ? `, ${escapeHtml(firstName)}` : ""}!
</p>

<p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLOR.ink};">
Dziękuję za wypełnienie ankiety. Poniżej znajdziesz kopię informacji, które
zostały do mnie przesłane. Odezwę się najszybciej, jak to możliwe, zwykle
w ciągu jednego dnia roboczego.
</p>

${renderSummaryHtml(sections)}

<p style="margin:28px 0 0;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLOR.ink};">
Jeżeli chcesz coś poprawić lub dopisać, po prostu odpowiedz na tę wiadomość.
</p>

<p style="margin:18px 0 0;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLOR.ink};">
Jeśli sprawa jest pilna, zadzwoń:
<a href="tel:${company.contact.phone.href}" style="color:${COLOR.accent};text-decoration:none;font-weight:700;">${escapeHtml(company.contact.phone.display)}</a>.
</p>

<p style="margin:24px 0 0;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLOR.ink};">
Do usłyszenia,<br />
<strong style="font-weight:700;">${company.brand.accountant}</strong>
</p>

<p style="margin:26px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${COLOR.mutedLight};">
Tę wiadomość wysłał automat, bo wypełniłeś ankietę na stronie. Jeśli to nie Ty —
zignoruj ją, nie podejmiemy żadnych działań.
</p>`;

	const text = [
		`Dzień dobry${firstName ? `, ${firstName}` : ""}!`,
		"",
		"Dziękuję za wypełnienie ankiety. Poniżej znajdziesz kopię informacji,",
		"które zostały do mnie przesłane. Odezwę się najszybciej, jak to możliwe,",
		"zwykle w ciągu jednego dnia roboczego.",
		"",
		renderSummaryText(sections),
		"",
		"Jeżeli chcesz coś poprawić lub dopisać, po prostu odpowiedz na tę wiadomość.",
		"",
		`Jeśli sprawa jest pilna, zadzwoń: ${company.contact.phone.display}`,
		"",
		"Do usłyszenia,",
		company.brand.name,
		"",
		"Tę wiadomość wysłał automat, bo wypełniłeś ankietę na stronie.",
		"Jeśli to nie Ty — zignoruj ją, nie podejmiemy żadnych działań.",
	].join("\n");

	return {
		subject: `Kopia Twojej ankiety — ${company.brand.accountant}, Księgowość`,
		html: renderEmailLayout({
			heading: "Kopia Twojej ankiety",
			subheading: "Dziękuję za wypełnienie formularza",
			preheader: "Poniżej kopia informacji, które do mnie przesłałeś.",
			content,
		}),
		text,
	};
}
