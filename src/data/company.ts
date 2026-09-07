/** Pojedyncze źródło prawdy dla marki i danych rejestrowych. */

export interface CompanyData {
	/** Marka i osoba prezentowana na stronie. */
	brand: {
		name: string;
		/** Księgowa prowadząca — Hero, „O mnie", podpisy w mailach. */
		accountant: string;
	};
	/** Podmiot prowadzący działalność — stopka, RODO, faktury, konto wfirma. */
	legal: {
		name: string;
		/** Same cyfry — format wyprowadza `companyNipFormatted`. */
		nip: string;
		address: {
			/** Opcjonalna: pomijana, gdy nie publikujemy adresu domowego. */
			street?: string;
			postalCode: string;
			city: string;
			country: "PL";
		};
	};
	contact: {
		email: string;
		phone: { display: string; href: string };
	};
}

export const company: CompanyData = {
	brand: {
		name: "Aleksandra Potocka — Księgowość",
		accountant: "Aleksandra Potocka",
	},
	legal: {
		name: "Mateusz Potocki",
		nip: "6121889056",
		address: {
			postalCode: "59-700",
			city: "Bolesławiec",
			country: "PL",
		},
	},
	contact: {
		email: "kontakt@potockaksiegowosc.pl",
		phone: { display: "533 032 455", href: "+48533032455" },
	},
};

// Placeholder ma wysypać build, a nie wylądować w stopce i klauzuli RODO.
// W dev tylko ostrzeżenie, żeby dało się pracować nad stroną.
const placeholders = [
	company.legal.name,
	company.legal.nip,
	...Object.values(company.legal.address),
].filter((value): value is string => typeof value === "string" && value.includes("{{"));

if (placeholders.length > 0) {
	const message = `company.ts — niewypełnione dane rejestrowe: ${placeholders.join(", ")}`;
	if (import.meta.env.PROD) throw new Error(message);
	console.warn(`[company] ${message}`);
}

/** „59-700 Bolesławiec" albo „ul. X 1, 59-700 Bolesławiec", gdy jest ulica. */
export const companyAddressLine = [
	company.legal.address.street,
	`${company.legal.address.postalCode} ${company.legal.address.city}`,
]
	.filter(Boolean)
	.join(", ");

/** NIP z myślnikami, w zapisie jak w CEIDG. */
export const companyNipFormatted = company.legal.nip.replace(
	/(\d{3})(\d{3})(\d{2})(\d{2})/,
	"$1-$2-$3-$4",
);
