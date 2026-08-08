// Przejścia między stronami (`ClientRouter`) podmieniają DOM bez przeładowania
// dokumentu, a moduły wykonują się TYLKO RAZ — przy pierwszym wejściu. Skrypt,
// który podpina listenery do elementów znalezionych na starcie, po nawigacji
// trzymałby się węzłów, których już nie ma w drzewie (menu przestaje się
// otwierać, FAQ nie reaguje, formularz nie wysyła).
//
// `astro:after-swap` leci po wstawieniu nowego dokumentu, więc `fn` dostaje
// świeży DOM. Pierwsze wywołanie robimy ręcznie, bo przy wejściu bezpośrednim
// to zdarzenie nie pada.
//
// UWAGA: `fn` może podpinać listenery wyłącznie do elementów strony. Listenery
// na `window`/`document` rejestruj raz, w zasięgu modułu — inaczej każda
// nawigacja dokłada kolejny i praca się dubluje.
export function onPageInit(fn: () => void): void {
	fn();
	document.addEventListener("astro:after-swap", fn);
}
