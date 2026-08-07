export interface Testimonial {
	quote: string;
	author: string;
	company?: string;
	industry?: string;
	source?: string;
}

// TODO(Aleksandra): wklej tutaj prawdziwe opinie klientów, gdy będą dostępne
// (za zgodą osoby/firmy na publikację cytatu, imienia i — opcjonalnie —
// nazwy firmy). Nie wpisuj fikcyjnych nazwisk, ocen ani liczby klientów.
// Sekcja "Opinie klientów" nie renderuje się, dopóki ta tablica jest pusta —
// dodanie pierwszego wpisu automatycznie ją włącza.
export const testimonials: Testimonial[] = [];
