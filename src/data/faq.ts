import { pricing, isPromotionActive } from "./pricing";

export interface FaqItem {
	q: string;
	a: string;
}

const jdgPriceFrom = pricing.jdg.variants[0].priceFrom;
const promoActive = isPromotionActive(pricing.promotion);

const pricingAnswer = promoActive
	? `Prowadzenie JDG zaczyna się od ${jdgPriceFrom} zł miesięcznie w ramach promocji dla nowych klientów, do ${pricing.jdg.documentLimit} dokumentów. Ostateczną stawkę ustalam po bezpłatnej konsultacji — zależy od formy opodatkowania, VAT-u i liczby dokumentów.`
	: `Prowadzenie JDG zaczyna się od ${jdgPriceFrom} zł miesięcznie, do ${pricing.jdg.documentLimit} dokumentów. Ostateczną stawkę ustalam po bezpłatnej konsultacji — zależy od formy opodatkowania, VAT-u i liczby dokumentów.`;

export const faqs: FaqItem[] = [
	{
		q: "Jaką formę opodatkowania wybrać?",
		a: "To zależy od branży, kosztów i planów na przyszłość — ostateczną decyzję zawsze podejmujesz Ty. Na bezpłatnej konsultacji wyjaśniam zasady rozliczania dostępnych form opodatkowania, żebyś miał/miała pełny obraz przed decyzją.",
	},
	{
		q: "Czy muszę przyjeżdżać do biura?",
		a: "Nie. Całość prowadzę zdalnie, w całej Polsce. Umowę i pełnomocnictwo podpisujemy online, a dokumenty przesyłasz zdjęciem lub mailem.",
	},
	{
		q: "Jak przekazuję dokumenty?",
		a: "Najwygodniej jak Ci pasuje — zdjęciem z telefonu, skanem lub mailem. Nie musisz niczego segregować ani dowozić.",
	},
	{
		q: "Pomożesz mi założyć firmę?",
		a: "Tak. Pomagam z wyborem kodów PKD, przygotowaniem wniosku CEIDG i zgłoszeniami do ZUS — a rozliczenia prowadzę zgodnie z formą opodatkowania, którą wybierzesz.",
	},
	{
		q: "Prowadzę już firmę w innym biurze — da się przejść?",
		a: "Oczywiście. Pomogę bezpłatnie przejąć dokumentację i dopełnić formalności. Zmiana biura jest prostsza, niż się wydaje, i możesz jej dokonać w trakcie roku.",
	},
	{
		q: "Ile to kosztuje?",
		a: pricingAnswer,
	},
];

export const faqDisclaimer =
	"Powyższe informacje mają charakter ogólny i nie stanowią porady podatkowej. Wybór formy opodatkowania oraz sprawy wymagające indywidualnej analizy podatkowej należą do przedsiębiorcy — w takich sytuacjach warto skonsultować się z licencjonowanym doradcą podatkowym.";
