/**
 * Wspólny szkielet obu maili.
 *
 * Zasady, które wymusza format, a nie upodobania:
 * - układ na tabelach i style inline — Outlook ignoruje `<style>` w `<head>`
 *   i nie zna flexboksa ani grida,
 * - fonty systemowe — self-hostowane woff2 z `src/assets/fonts/` nie działają
 *   w Gmailu, więc `font-display`/`font-sans` ze strony zastępuje bezpieczny
 *   stack o zbliżonym charakterze (geometryczny grotesk),
 * - szerokość 600 px — historyczna szerokość panelu podglądu w Outlooku.
 *
 * Kolory pochodzą z tokenów `@theme` w `src/styles/global.css`.
 */

const COLOR = {
	bg: "#fbfbfd",
	ink: "#0b0b12",
	dark: "#171a2e",
	accent: "#2f4468",
	accent2: "#3c5686",
	accentSoft: "#aab4cc",
	muted: "#585e71",
	mutedLight: "#8a8fa3",
	border: "#ecedf3",
	surfaceTint: "#eef1f6",
} as const;

const FONT_STACK =
	"'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif";

/**
 * Dane z formularza trafiają wprost do HTML wiadomości. Bez tego nadawca mógłby
 * wstrzyknąć własne znaczniki do skrzynki właścicielki — łącznie z linkiem
 * podszywającym się pod treść maila.
 */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/** Zachowuje łamanie wierszy z pola tekstowego. Escapuje przed zamianą. */
export function escapeHtmlWithBreaks(value: string): string {
	return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

interface EmailLayoutOptions {
	/** Tekst w nagłówku ciemnego paska. */
	heading: string;
	/** Podpis pod nagłówkiem. */
	subheading: string;
	/** Podgląd w liście wiadomości, zanim użytkownik otworzy maila. */
	preheader: string;
	/** Gotowy HTML treści — wołający odpowiada za escapowanie. */
	content: string;
}

export function renderEmailLayout({
	heading,
	subheading,
	preheader,
	content,
}: EmailLayoutOptions): string {
	return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<!-- Bez tego Gmail na Androidzie sam inwertuje kolory i rozjeżdża ciemny nagłówek. -->
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLOR.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">${escapeHtml(preheader)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.bg};">
<tr>
<td align="center" style="padding:32px 16px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid ${COLOR.border};border-radius:20px;overflow:hidden;">

<tr>
<td style="background-color:${COLOR.dark};background-image:linear-gradient(135deg,${COLOR.dark} 0%,${COLOR.ink} 100%);padding:32px 36px;">
<h1 style="margin:0;font-family:${FONT_STACK};font-size:22px;line-height:1.25;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">${escapeHtml(heading)}</h1>
<p style="margin:8px 0 0;font-family:${FONT_STACK};font-size:14px;line-height:1.5;color:${COLOR.accentSoft};">${escapeHtml(subheading)}</p>
</td>
</tr>

<tr>
<td style="padding:32px 36px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${COLOR.ink};">
${content}
</td>
</tr>

<tr>
<td style="border-top:1px solid ${COLOR.border};padding:22px 36px;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${COLOR.mutedLight};">
Aleksandra Potocka — Księgowość · Jelenia Góra, Bolesławiec · online, cała Polska<br />
<a href="tel:+48533032455" style="color:${COLOR.muted};text-decoration:none;">533 032 455</a> ·
<a href="mailto:kontakt@potockaksiegowosc.pl" style="color:${COLOR.muted};text-decoration:none;">kontakt@potockaksiegowosc.pl</a>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
}

/** Wiersz „etykieta → wartość" w podsumowaniu zgłoszenia. */
export function renderDataRow(label: string, valueHtml: string): string {
	return `<tr>
<td style="padding:0 0 4px;font-family:${FONT_STACK};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${COLOR.mutedLight};">${escapeHtml(label)}</td>
</tr>
<tr>
<td style="padding:0 0 18px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${COLOR.ink};">${valueHtml}</td>
</tr>`;
}

/** Wyróżniony blok na treść wiadomości od klienta. */
export function renderQuoteBlock(contentHtml: string): string {
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.surfaceTint};border-left:3px solid ${COLOR.accent};border-radius:0 12px 12px 0;">
<tr>
<td style="padding:18px 20px;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLOR.ink};">${contentHtml}</td>
</tr>
</table>`;
}

/** Przycisk odporny na brak obsługi CSS — tło i padding na komórce tabeli. */
export function renderButton(href: string, label: string): string {
	return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="background-color:${COLOR.accent};background-image:linear-gradient(135deg,${COLOR.accent} 0%,${COLOR.accent2} 100%);border-radius:14px;">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
</td>
</tr>
</table>`;
}

export { COLOR, FONT_STACK };
