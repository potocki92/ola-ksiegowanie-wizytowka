/** Pojedyncze źródło prawdy dla wszystkich cen widocznych na stronie. */

export interface JdgVariant {
	key: "no-vat" | "vat";
	label: string;
	priceFrom: number;
	regularPrice: number;
}

export interface Promotion {
	enabled: boolean;
	label: string;
	description: string;
	/** ISO date (np. "2026-12-31") — dopóki `null`, promocja nie jest uznawana za aktywną. */
	validUntil: string | null;
	discountNote?: string;
}

export interface PricingData {
	jdg: {
		variants: JdgVariant[];
		documentLimit: number;
		includedItems: string[];
	};
	registration: { freeWithOngoing: boolean; standaloneFee: number };
	officeSwitch: { free: boolean };
	kadry: { perEmployeeFrom: number; umowaZlecenie: number; umowaOPrace: number };
	pit: { priceFrom: number; forms: string[] };
	promotion: Promotion;
}

export const pricing: PricingData = {
	jdg: {
		variants: [
			{ key: "no-vat", label: "Bez VAT", priceFrom: 250, regularPrice: 350 },
			{ key: "vat", label: "Z VAT", priceFrom: 350, regularPrice: 450 },
		],
		documentLimit: 20,
		includedItems: [
			"Prowadzenie KPiR / ryczałtu",
			"Rozliczenia VAT i JPK",
			"Deklaracje i rozliczenia ZUS",
			"Rozliczenia zgodne z Twoją formą opodatkowania",
			"Przypomnienia o terminach",
			"Stały kontakt z księgową",
		],
	},
	registration: { freeWithOngoing: true, standaloneFee: 50 },
	officeSwitch: { free: true },
	kadry: { perEmployeeFrom: 30, umowaZlecenie: 30, umowaOPrace: 50 },
	pit: { priceFrom: 100, forms: ["PIT-37", "PIT-36", "PIT-28"] },
	promotion: {
		enabled: true,
		label: "Promocja",
		// TODO(Aleksandra): uzupełnić realne warunki promocji (czas trwania,
		// limit miejsc/klientów, do kiedy obowiązuje) i ustawić `validUntil`.
		// Dopóki `validUntil` jest `null`, cennik pokazuje uczciwą cenę bez
		// przekreślenia — patrz `isPromotionActive`.
		description: "TODO: uzupełnić warunki promocji (czas trwania, limit miejsc)",
		validUntil: null,
		discountNote: "100 zł taniej dla nowych klientów",
	},
};

/** Promocja liczy się jako aktywna tylko, gdy ma realny, nieprzeterminowany termin. */
export function isPromotionActive(promo: Promotion): boolean {
	if (!promo.enabled || !promo.validUntil) return false;
	return new Date(promo.validUntil).getTime() >= Date.now();
}

export function getJdgPriceRangeLabel(data: PricingData): string {
	const values = data.jdg.variants.map((v) => v.priceFrom);
	const min = Math.min(...values);
	const max = Math.max(...values);
	return min === max ? `${min} zł` : `${min}–${max} zł`;
}
