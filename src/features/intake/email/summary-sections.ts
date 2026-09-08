/**
 * Renderowanie struktury z `intake.summary.ts` do HTML-a i wersji tekstowej.
 *
 * Wspólne dla obu maili ankiety, bo to samo podsumowanie widzi właścicielka
 * i klient. Różnicę robi jedynie `emptyValue`: właścicielka ma widzieć, że
 * pole zostało puste, a w kopii dla klienta puste wiersze tylko zaśmiecałyby
 * wiadomość, więc znikają.
 */

import {
	COLOR,
	escapeHtml,
	escapeHtmlWithBreaks,
	renderDataRow,
	renderFieldLabel,
	renderQuoteBlock,
	renderSectionHeading,
} from "../../../lib/email/layout";
import type {
	IntakeSummaryField,
	IntakeSummarySection,
} from "../intake.summary";

interface RenderOptions {
	/** Tekst zamiast pustej wartości. Bez niego puste pola są pomijane. */
	emptyValue?: string;
}

export function renderSummaryHtml(
	sections: IntakeSummarySection[],
	{ emptyValue }: RenderOptions = {},
): string {
	return sections
		.map((section) => {
			const fields = visibleFields(section.fields, emptyValue);

			if (fields.length === 0) {
				return "";
			}

			return `${renderSectionHeading(section.title)}${renderFieldsHtml(fields, emptyValue)}`;
		})
		.filter(Boolean)
		.join("\n");
}

export function renderSummaryText(
	sections: IntakeSummarySection[],
	{ emptyValue }: RenderOptions = {},
): string {
	return sections
		.map((section) => {
			const fields = visibleFields(section.fields, emptyValue);

			if (fields.length === 0) {
				return "";
			}

			const lines = fields.map((field) => {
				const value = field.value ?? emptyValue ?? "";

				// Wielolinijkowy tekst po dwukropku byłby nieczytelny — etykieta
				// zostaje w osobnym wierszu, treść pod nią.
				return field.multiline
					? `${field.label}:\n${value}`
					: `${field.label}: ${value}`;
			});

			return [section.title.toUpperCase(), ...lines].join("\n");
		})
		.filter(Boolean)
		.join("\n\n");
}

function visibleFields(
	fields: IntakeSummaryField[],
	emptyValue: string | undefined,
): IntakeSummaryField[] {
	return emptyValue ? fields : fields.filter((field) => field.value);
}

/**
 * Wiersze „etykieta → wartość" idą do jednej tabeli, a dłuższe wypowiedzi
 * (opis działalności, uwagi) muszą ją przerwać, bo renderują się blokiem
 * cytatu poza tabelą.
 */
function renderFieldsHtml(
	fields: IntakeSummaryField[],
	emptyValue: string | undefined,
): string {
	const blocks: string[] = [];
	let rows: string[] = [];

	const flushRows = () => {
		if (rows.length > 0) {
			blocks.push(
				`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">\n${rows.join("\n")}\n</table>`,
			);
			rows = [];
		}
	};

	for (const field of fields) {
		if (field.multiline) {
			flushRows();
			blocks.push(
				`${renderFieldLabel(field.label)}${renderQuoteBlock(
					field.value
						? escapeHtmlWithBreaks(field.value)
						: emptyPlaceholder(emptyValue),
				)}`,
			);
			continue;
		}

		rows.push(renderDataRow(field.label, renderValueHtml(field, emptyValue)));
	}

	flushRows();

	return blocks.join("\n");
}

function renderValueHtml(
	field: IntakeSummaryField,
	emptyValue: string | undefined,
): string {
	if (!field.value) {
		return emptyPlaceholder(emptyValue);
	}

	// Dane od klienta zawsze przez `escapeHtml` — bez tego treść formularza
	// wstrzykiwałaby własne znaczniki do skrzynki odbiorcy.
	const value = escapeHtml(field.value);

	return field.href
		? `<a href="${escapeHtml(field.href)}" style="color:${COLOR.accent};text-decoration:none;">${value}</a>`
		: value;
}

function emptyPlaceholder(emptyValue: string | undefined): string {
	return `<span style="color:${COLOR.mutedLight};">${escapeHtml(emptyValue ?? "")}</span>`;
}
