import {
	COLOR,
	FONT_STACK,
	escapeHtml,
	renderEmailLayout,
} from "../../../lib/email/layout";
import type { IntakeMessage } from "../intake.schema";
import type { BuiltEmail } from "./owner-notification";

/** Potwierdzenie dla osoby, która wypełniła ankietę startową. */
export function buildIntakeConfirmation(message: IntakeMessage): BuiltEmail {
	// Do maila wchodzi samo imię — patrz uzasadnienie w potwierdzeniu kontaktowym.
	const firstName = message.name.split(/\s+/)[0] ?? message.name;

	const content = `
<p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:16px;line-height:1.6;color:${COLOR.ink};">
Dzień dobry${firstName ? `, ${escapeHtml(firstName)}` : ""}!
</p>

<p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLOR.ink};">
Dziękuję za wypełnienie ankiety — dzięki niej lepiej przygotuję się do naszej
rozmowy i od razu porozmawiamy o konkretach, zamiast tracić czas na pytania
wstępne. Odezwę się najszybciej, jak to możliwe, zwykle w ciągu jednego dnia
roboczego.
</p>

<p style="margin:24px 0 0;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLOR.ink};">
Jeśli sprawa jest pilna, zadzwoń:
<a href="tel:+48533032455" style="color:${COLOR.accent};text-decoration:none;font-weight:700;">533 032 455</a>.
</p>

<p style="margin:24px 0 0;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLOR.ink};">
Do usłyszenia,<br />
<strong style="font-weight:700;">Aleksandra Potocka</strong>
</p>

<p style="margin:26px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${COLOR.mutedLight};">
Tę wiadomość wysłał automat, bo wypełniłeś ankietę startową na stronie. Jeśli
to nie Ty — zignoruj ją, nie podejmiemy żadnych działań.
</p>`;

	const text = [
		`Dzień dobry${firstName ? `, ${firstName}` : ""}!`,
		"",
		"Dziękuję za wypełnienie ankiety — dzięki niej lepiej przygotuję się do",
		"naszej rozmowy. Odezwę się najszybciej, jak to możliwe, zwykle w ciągu",
		"jednego dnia roboczego.",
		"",
		"Jeśli sprawa jest pilna, zadzwoń: 533 032 455",
		"",
		"Do usłyszenia,",
		"Aleksandra Potocka — Księgowość",
		"",
		"Tę wiadomość wysłał automat, bo wypełniłeś ankietę startową na stronie.",
		"Jeśli to nie Ty — zignoruj ją, nie podejmiemy żadnych działań.",
	].join("\n");

	return {
		subject: "Dziękuję za wypełnienie ankiety — Aleksandra Potocka, Księgowość",
		html: renderEmailLayout({
			heading: "Dziękuję za wypełnienie ankiety",
			subheading: "Potwierdzenie ankiety startowej",
			preheader: "Twoja ankieta do mnie dotarła. Odezwę się w ciągu jednego dnia roboczego.",
			content,
		}),
		text,
	};
}
