/**
 * Jedyne źródło opcji `select` w ankiecie.
 *
 * Czyta stąd formularz (renderowanie `<option>`) i `intake.summary.ts`
 * (zamiana zapisanej wartości na etykietę w mailach). Wartości techniczne
 * trafiają do `intake.schema.ts` jako `z.enum` — dodając opcję, dopisz ją
 * w obu miejscach.
 *
 * `short` służy tylko tematowi maila do właścicielki, gdzie pełna etykieta
 * („Jednoosobowa działalność gospodarcza (JDG)") byłaby nieczytelna.
 */

export interface IntakeOption {
	value: string;
	label: string;
	short?: string;
}

export const businessStatusOptions = [
	{ value: "existing", label: "Już prowadzę działalność" },
	{ value: "planned", label: "Dopiero planuję ją założyć" },
] as const satisfies readonly IntakeOption[];

export const legalFormOptions = [
	{
		value: "jdg",
		label: "Jednoosobowa działalność gospodarcza (JDG)",
		short: "JDG",
	},
	{ value: "spolka_cywilna", label: "Spółka cywilna", short: "Sp. cywilna" },
	{ value: "spolka_zoo", label: "Spółka z o.o.", short: "Sp. z o.o." },
	{ value: "inna", label: "Inna / jeszcze nie wiem", short: "Forma do ustalenia" },
] as const satisfies readonly IntakeOption[];

export const taxFormOptions = [
	{ value: "ryczalt", label: "Ryczałt", short: "Ryczałt" },
	{ value: "skala", label: "Skala podatkowa (zasady ogólne)", short: "Skala" },
	{ value: "liniowy", label: "Podatek liniowy", short: "Liniowy" },
	{
		value: "nie_wiem",
		label: "Jeszcze nie wiem — chcę omówić możliwości",
		short: "Podatek do ustalenia",
	},
] as const satisfies readonly IntakeOption[];

export const vatStatusOptions = [
	{ value: "zwolniony", label: "Zwolniony z VAT" },
	{ value: "czynny", label: "Czynny podatnik VAT" },
	{ value: "nie_wiem", label: "Jeszcze nie wiem" },
] as const satisfies readonly IntakeOption[];

/**
 * Wartość oznaczająca „bez pracowników". Formularz chowa dla niej pole
 * z liczbą osób, a podsumowanie w mailu pomija ten wiersz.
 */
export const EMPLOYMENT_NONE = "brak";

export const employmentOptions = [
	{ value: EMPLOYMENT_NONE, label: "Nie planuję zatrudniać" },
	{ value: "umowa_o_prace", label: "Tak — umowa o pracę" },
	{ value: "umowa_zlecenie", label: "Tak — umowa zlecenie" },
	{ value: "oba", label: "Tak — oba typy umów" },
] as const satisfies readonly IntakeOption[];

export const currentAccountingOptions = [
	{
		value: "pierwsza_wspolpraca",
		label: "To będzie moja pierwsza współpraca z biurem rachunkowym",
	},
	{ value: "samodzielnie", label: "Rozliczam się obecnie samodzielnie" },
	{ value: "zmiana_biura", label: "Zmieniam obecne biuro rachunkowe" },
] as const satisfies readonly IntakeOption[];

export const preferredContactOptions = [
	{ value: "telefon", label: "Telefon" },
	{ value: "email", label: "E-mail" },
	{ value: "bez_preferencji", label: "Bez preferencji" },
] as const satisfies readonly IntakeOption[];

type OptionList = readonly IntakeOption[];

/** Zamienia zapisaną wartość (np. `"ryczalt"`) na etykietę do wyświetlenia. */
export function labelFor(options: OptionList, value: string): string {
	return options.find((option) => option.value === value)?.label ?? value;
}

/** Skrócona etykieta do tematu maila; wraca do pełnej, gdy skrótu nie ma. */
export function shortLabelFor(options: OptionList, value: string): string {
	const option = options.find((entry) => entry.value === value);
	return option?.short ?? option?.label ?? value;
}
