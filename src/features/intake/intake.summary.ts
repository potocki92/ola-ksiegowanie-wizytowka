/**
 * Zamiana odpowiedzi z ankiety na czytelną, uporządkowaną postać.
 *
 * To jedyne miejsce, które wie, że `ryczalt` znaczy „Ryczałt", w jakiej
 * kolejności czyta się sekcje i które pola w ogóle mają sens dla danej
 * odpowiedzi. Oba maile (powiadomienie do właścicielki i kopia dla klienta)
 * renderują tę samą strukturę — różnią się wyłącznie oprawą.
 */

import {
	EMPLOYMENT_NONE,
	businessStatusOptions,
	currentAccountingOptions,
	employmentOptions,
	labelFor,
	legalFormOptions,
	preferredContactOptions,
	shortLabelFor,
	taxFormOptions,
	vatStatusOptions,
} from "./intake.options";
import type { IntakeMessage } from "./intake.schema";

export interface IntakeSummaryField {
	label: string;
	/** `undefined` = klient nie wypełnił pola; renderer decyduje, co z tym zrobić. */
	value?: string;
	/** Wielolinijkowa wypowiedź klienta — mail pokazuje ją blokiem cytatu. */
	multiline?: boolean;
	/** `mailto:` / `tel:` dla wartości, które w mailu mają być klikalne. */
	href?: string;
}

export interface IntakeSummarySection {
	title: string;
	fields: IntakeSummaryField[];
}

/** Pełna ankieta w sekcjach — wspólna baza obu maili. */
export function buildIntakeSummary(
	message: IntakeMessage,
): IntakeSummarySection[] {
	return [
		{
			title: "Dane kontaktowe",
			fields: [
				{ label: "Imię i nazwisko", value: message.name },
				{
					label: "E-mail",
					value: message.email,
					href: `mailto:${message.email}`,
				},
				{
					label: "Telefon",
					value: message.phone,
					href: message.phone ? `tel:${message.phone.replace(/\s/g, "")}` : undefined,
				},
			],
		},
		{
			title: "O firmie",
			fields: [
				{
					label: "Status działalności",
					value: labelFor(businessStatusOptions, message.businessStatus),
				},
				{ label: "Nazwa firmy", value: message.businessName },
				{
					label: "Opis działalności",
					value: message.businessDescription,
					multiline: true,
				},
				{
					label: startDateLabel(message.businessStatus),
					value: message.plannedStartDate,
				},
				{
					label: "Forma prawna",
					value: labelFor(legalFormOptions, message.legalForm),
				},
			],
		},
		{
			title: "Rozliczenia",
			fields: [
				{
					label: "Forma opodatkowania",
					value: labelFor(taxFormOptions, message.taxForm),
				},
				{ label: "VAT", value: labelFor(vatStatusOptions, message.vatStatus) },
				{
					label: "Zatrudnienie",
					value: labelFor(employmentOptions, message.employment),
				},
				// Liczba osób przy odpowiedzi „nie planuję zatrudniać" jest tylko
				// szumem — formularz chowa to pole, ale wartość mogła w nim zostać.
				...(message.employment === EMPLOYMENT_NONE
					? []
					: [{ label: "Liczba osób", value: message.employeeCount }]),
				{ label: "Skala działalności", value: message.estimatedScale },
			],
		},
		{
			title: "Obecna sytuacja",
			fields: [
				{
					label: "Obecna obsługa księgowa",
					value: labelFor(currentAccountingOptions, message.currentAccounting),
				},
				{
					label: "Preferowany kontakt",
					value: labelFor(preferredContactOptions, message.preferredContact),
				},
			],
		},
		{
			title: "Dodatkowe informacje",
			fields: [{ label: "Uwagi", value: message.notes, multiline: true }],
		},
	];
}

/**
 * Skrót zgłoszenia na górę maila do właścicielki — to, co pozwala zdecydować
 * o dalszych krokach bez czytania całej ankiety.
 */
export function buildIntakeHighlights(
	message: IntakeMessage,
): IntakeSummaryField[] {
	return [
		{ label: "Imię i nazwisko", value: message.name },
		{ label: "E-mail", value: message.email, href: `mailto:${message.email}` },
		{
			label: "Telefon",
			value: message.phone,
			href: message.phone ? `tel:${message.phone.replace(/\s/g, "")}` : undefined,
		},
		{ label: "Nazwa firmy", value: message.businessName },
		{
			label: "Status",
			value: labelFor(businessStatusOptions, message.businessStatus),
		},
		{
			label: "Forma prawna",
			value: labelFor(legalFormOptions, message.legalForm),
		},
		{
			label: "Opodatkowanie",
			value: labelFor(taxFormOptions, message.taxForm),
		},
		{ label: "VAT", value: labelFor(vatStatusOptions, message.vatStatus) },
		{
			label: "Kontakt",
			value: labelFor(preferredContactOptions, message.preferredContact),
		},
	];
}

/**
 * Temat maila do właścicielki: „Nowa ankieta: Jan Kowalski | JDG | Ryczałt".
 * Trzy człony wystarczają, żeby rozpoznać zgłoszenie na liście wiadomości,
 * a temat nie ucina się w podglądzie na telefonie.
 */
export function buildIntakeSubject(message: IntakeMessage): string {
	const parts = [
		message.name,
		shortLabelFor(legalFormOptions, message.legalForm),
		shortLabelFor(taxFormOptions, message.taxForm),
	];

	return `Nowa ankieta: ${parts.join(" | ")}`;
}

function startDateLabel(businessStatus: IntakeMessage["businessStatus"]): string {
	return businessStatus === "planned"
		? "Planowana data rozpoczęcia działalności"
		: "Data rozpoczęcia działalności";
}
