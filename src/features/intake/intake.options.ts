/**
 * Etykiety opcji `select` — wspólne dla formularza (renderowanie `<option>`)
 * i treści maila do właścicielki (żeby nie pisać tych samych opisów dwa razy).
 */

export const businessStatusOptions = [
	{ value: "existing", label: "Już prowadzę działalność" },
	{ value: "planned", label: "Dopiero planuję ją założyć" },
] as const;

export const legalFormOptions = [
	{ value: "jdg", label: "Jednoosobowa działalność gospodarcza (JDG)" },
	{ value: "spolka_cywilna", label: "Spółka cywilna" },
	{ value: "spolka_zoo", label: "Spółka z o.o." },
	{ value: "inna", label: "Inna / jeszcze nie wiem" },
] as const;

export const taxFormOptions = [
	{ value: "ryczalt", label: "Ryczałt" },
	{ value: "kpir", label: "Zasady ogólne (KPiR)" },
	{ value: "liniowy", label: "Podatek liniowy" },
	{ value: "nie_wiem", label: "Jeszcze nie wiem — proszę o doradztwo" },
] as const;

export const vatStatusOptions = [
	{ value: "zwolniony", label: "Zwolniony z VAT" },
	{ value: "czynny", label: "Czynny podatnik VAT" },
	{ value: "nie_wiem", label: "Jeszcze nie wiem" },
] as const;

export const employmentOptions = [
	{ value: "brak", label: "Nie planuję zatrudniać" },
	{ value: "umowa_o_prace", label: "Tak — umowa o pracę" },
	{ value: "umowa_zlecenie", label: "Tak — umowa zlecenie" },
	{ value: "oba", label: "Tak — oba typy umów" },
] as const;

export const currentAccountingOptions = [
	{
		value: "pierwsza_wspolpraca",
		label: "To będzie moja pierwsza współpraca z biurem rachunkowym",
	},
	{ value: "zmiana_biura", label: "Zmieniam obecne biuro rachunkowe" },
] as const;

export const preferredContactOptions = [
	{ value: "telefon", label: "Telefon" },
	{ value: "email", label: "E-mail" },
	{ value: "bez_preferencji", label: "Bez preferencji" },
] as const;

type OptionList = ReadonlyArray<{ value: string; label: string }>;

/** Zamienia zapisaną wartość (np. `"ryczalt"`) na etykietę do wyświetlenia w mailu. */
export function labelFor(options: OptionList, value: string): string {
	return options.find((option) => option.value === value)?.label ?? value;
}
