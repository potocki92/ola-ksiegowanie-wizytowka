import type { APIRoute } from "astro";
import { z } from "zod";
import { contactSubmissionSchema } from "../../features/contact/contact.schema";
import { submitContactMessage } from "../../features/contact/contact.service";

// Bez tego Astro prerenderuje endpoint przy budowaniu i po deployu każdy POST
// dostaje 405 — mimo że lokalnie w `astro dev` wszystko działa.
export const prerender = false;

/** Człowiek nie wypełni czterech pól szybciej niż w kilka sekund. */
const MIN_FILL_TIME_MS = 750;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Prosta zapora przed zalewem z jednego adresu.
 *
 * Świadome ograniczenie: pamięć funkcji serverless znika przy zimnym starcie
 * i nie jest współdzielona między równoległymi instancjami, więc to sito na
 * prymitywny flood, a nie pełny rate limiting. Realny wymagałby zewnętrznego
 * magazynu (Vercel KV / Upstash) — dokładamy, jeśli spam faktycznie się pojawi.
 */
const submissions = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submissions.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    submissions.set(ip, recent);
    return true;
  }

  recent.push(now);
  submissions.set(ip, recent);

  // Mapa rośnie wraz z liczbą adresów — czyścimy wpisy, które i tak wygasły.
  if (submissions.size > 500) {
    for (const [key, timestamps] of submissions) {
      if (
        timestamps.every((timestamp) => now - timestamp >= RATE_LIMIT_WINDOW_MS)
      ) {
        submissions.delete(key);
      }
    }
  }

  return false;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Nieprawidłowy format zgłoszenia." }, 400);
  }

  const parsed = contactSubmissionSchema.safeParse(payload);

  if (!parsed.success) {
    return json(
      {
        ok: false,
        error: "Sprawdź poprawność wypełnionych pól.",
        fields: z.flattenError(parsed.error).fieldErrors,
      },
      400,
    );
  }

  const { company, elapsed, ...message } = parsed.data;

  // Honeypot i próg czasowy odpowiadają sukcesem, mimo że nic nie wysyłają.
  // Bot, który dostałby błąd, wiedziałby czego unikać przy kolejnej próbie.
//   if (company && company.trim().length > 0) {
//     return json({ ok: true }, 200);
//   }

//   if (elapsed !== undefined && elapsed > 0 && elapsed < MIN_FILL_TIME_MS) {
//     return json({ ok: true }, 200);
//   }
  if (clientAddress && isRateLimited(clientAddress)) {
    return json(
      {
        ok: false,
        error:
          "Zbyt wiele zgłoszeń z tego urządzenia. Spróbuj ponownie za chwilę.",
      },
      429,
    );
  }

  try {
    await submitContactMessage(message);
  } catch (error) {
    // Szczegóły (w tym odpowiedź dostawcy) zostają w logach serwera.
    console.error("[contact] Wysyłka zgłoszenia nie powiodła się:", error);
    return json({ ok: false, error: "Nie udało się wysłać wiadomości." }, 502);
  }

  // Log strukturalny, niezależny od skryptów w przeglądarce (adblocki go nie
  // ruszą) — trafia do Vercel Runtime Logs i liczy się 1:1 z realną wysyłką.
  console.log(JSON.stringify({ event: "contact_form_submitted", ts: Date.now() }));

  return json({ ok: true }, 200);
};
