/**
 * Reguły łamania wierszy dla nagłówków i leadów.
 *
 * `text-wrap: balance` wyrównuje długość wierszy, ale nie wie nic o treści —
 * potrafi zostawić na końcu wiersza samotne „w" albo rozbić zdanie w połowie.
 * Poniższe funkcje decydują o łamaniu ZANIM zrobi to przeglądarka.
 */

const NBSP = " ";

/**
 * Polska typografia: jednoliterowe spójniki i przyimki (a, i, o, u, w, z)
 * nie zostają na końcu wiersza — sklejamy je twardą spacją z następnym
 * słowem. Myślnik z kolei nie może zaczynać wiersza, więc kleimy go
 * ze słowem poprzednim.
 *
 * Świadomie obejmuje tylko wyrazy JEDNOLITEROWE. Sklejanie dłuższych
 * („od", „na") tworzy zbyt szerokie, niełamliwe bloki i psuje nagłówki
 * w wąskich kolumnach.
 */
export function fixOrphans(text: string): string {
	return text
		.replace(/(?<=^|[\s(„"'])([aiouwzAIOUWZ])[ \t]+/g, `$1${NBSP}`)
		.replace(/[ \t]+([—–])[ \t]+/g, `${NBSP}$1 `);
}

/**
 * Dzieli nagłówek na zdania. Każde zdanie dostaje własny wiersz, dzięki
 * czemu „Jasna cena. Bez ukrytych dopłat." łamie się na kropce, a nie
 * w środku drugiego zdania.
 */
export function splitSentences(text: string): string[] {
	return text.split(/(?<=\.)\s+/).filter(Boolean);
}
