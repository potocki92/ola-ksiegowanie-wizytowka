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

const inquiryTypeOptions = [
  "Prowadzenie JDG",
  "Założenie działalności",
  "Zmiana biura rachunkowego",
  "Kadry i płace",
  "Rozliczenie roczne PIT",
  "Inne",
] as const;

const monthlyDocumentsOptions = [
  "Jeszcze nie wiem",
  "Do 10",
  "11–20",
  "21–50",
  "Powyżej 50",
] as const;

export const contactSubmissionSchema = z.object({
  // `error` powtarza się na `z.string()` i na `.min()` celowo: pierwszy łapie
  // pole całkiem nieobecne w zgłoszeniu, drugi pole obecne, ale za krótkie.
  // Bez tego pierwszego użytkownik dostałby angielski komunikat Zoda.
  name: z
    .string({ error: "Podaj imię i nazwisko" })
    .trim()
    .min(2, { error: "Podaj imię i nazwisko" })
    .max(100, { error: "Imię i nazwisko jest zbyt długie" }),

  // `trim()` musi poprzedzać walidację formatu — inaczej adres wklejony ze
  // spacją na końcu zostaje odrzucony, mimo że jest poprawny.
  email: z
    .string({ error: "Podaj adres e-mail" })
    .trim()
    .max(254, { error: "Adres e-mail jest zbyt długi" })
    .pipe(z.email({ error: "Podaj poprawny adres e-mail" })),

  // Puste pole opcjonalne przychodzi z formularza jako "", nie jako undefined.
  phone: z
    .union([phoneSchema, z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),

  message: z
    .string({ error: "Napisz, czego potrzebujesz" })
    .trim()
    .min(10, { error: "Opisz krótko, czego potrzebujesz (min. 10 znaków)" })
    // Górny limit chroni skrzynkę przed zalaniem jednym zgłoszeniem.
    .max(2000, { error: "Wiadomość może mieć maksymalnie 2000 znaków" }),

  // Oba pola niżej są opcjonalne — puste "" z formularza zamieniamy na
  // undefined tym samym wzorcem co przy `phone`.
  inquiryType: z
    .union([z.enum(inquiryTypeOptions), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),

  monthlyDocuments: z
    .union([z.enum(monthlyDocumentsOptions), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),

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

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

/** Dane po odsianiu pól technicznych — to trafia do szablonów maili. */
export type ContactMessage = Omit<ContactSubmission, "company" | "elapsed">;
