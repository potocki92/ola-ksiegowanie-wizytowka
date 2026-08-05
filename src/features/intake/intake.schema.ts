import { z } from "zod";

/**
 * Numery zapisuje się różnie: „533 032 455", „+48 533-032-455", „533032455".
 * Zamiast wymuszać jeden format, sprawdzamy tylko dozwolone znaki i liczbę
 * cyfr — pole jest opcjonalne i służy kontaktowi, nie rozliczeniom.
 */
const phoneSchema = z
	.string()
	.trim()
	.regex(
		/^[\d\s+()-]+$/,
		"Numer może zawierać tylko cyfry, spacje i znaki + ( ) -",
	)
	.refine(
		(value) => {
			const digits = value.replace(/\D/g, "").length;
			return digits >= 9 && digits <= 15;
		},
		{ error: "Numer telefonu wygląda na niekompletny" },
	);

/** Puste pole opcjonalne przychodzi z formularza jako "", nie jako undefined. */
const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.optional()
		.transform((value) => (value ? value : undefined));

export const intakeSubmissionSchema = z.object({
	// Dane kontaktowe
	name: z
		.string({ error: "Podaj imię i nazwisko" })
		.trim()
		.min(2, { error: "Podaj imię i nazwisko" })
		.max(100, { error: "Imię i nazwisko jest zbyt długie" }),

	email: z
		.string({ error: "Podaj adres e-mail" })
		.trim()
		.max(254, { error: "Adres e-mail jest zbyt długi" })
		.pipe(z.email({ error: "Podaj poprawny adres e-mail" })),

	phone: z
		.union([phoneSchema, z.literal("")])
		.optional()
		.transform((value) => (value ? value : undefined)),

	// O firmie
	businessDescription: z
		.string({ error: "Opisz, czym zajmuje się Twoja firma" })
		.trim()
		.min(10, { error: "Opisz krótko działalność (min. 10 znaków)" })
		.max(1000, { error: "Opis może mieć maksymalnie 1000 znaków" }),

	businessStatus: z.enum(["existing", "planned"], {
		error: "Wybierz status działalności",
	}),

	plannedStartDate: optionalText(100),

	legalForm: z.enum(["jdg", "spolka_cywilna", "spolka_zoo", "inna"], {
		error: "Wybierz formę prawną",
	}),

	// Rozliczenia
	taxForm: z.enum(["ryczalt", "kpir", "liniowy", "nie_wiem"], {
		error: "Wybierz formę opodatkowania",
	}),

	vatStatus: z.enum(["zwolniony", "czynny", "nie_wiem"], {
		error: "Wybierz status VAT",
	}),

	employment: z.enum(["brak", "umowa_o_prace", "umowa_zlecenie", "oba"], {
		error: "Wybierz odpowiedź o zatrudnieniu",
	}),

	employeeCount: optionalText(50),

	estimatedScale: optionalText(200),

	// Obecna sytuacja i uwagi
	currentAccounting: z.enum(["pierwsza_wspolpraca", "zmiana_biura"], {
		error: "Wybierz odpowiedź o obecnej obsłudze księgowej",
	}),

	preferredContact: z.enum(["telefon", "email", "bez_preferencji"], {
		error: "Wybierz preferowany sposób kontaktu",
	}),

	notes: optionalText(2000),

	// Honeypot — pole ukryte przed człowiekiem, wypełniane przez boty.
	company: z.string().max(100).optional(),

	// Czas wypełniania w ms; człowiek nie wyśle formularza w ułamek sekundy.
	elapsed: z.preprocess((value) => {
		if (value === "" || value === null || value === undefined) {
			return undefined;
		}

		return value;
	}, z.coerce.number().int().nonnegative().optional()),
});

export type IntakeSubmission = z.infer<typeof intakeSubmissionSchema>;

/** Dane po odsianiu pól technicznych — to trafia do szablonów maili. */
export type IntakeMessage = Omit<IntakeSubmission, "company" | "elapsed">;
