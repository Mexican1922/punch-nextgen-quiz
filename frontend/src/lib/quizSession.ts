/**
 * Keeps an in-progress quiz in sessionStorage: the chosen answers and the
 * idempotency key for this attempt.
 *
 * The key is created once when the student starts and reused for every
 * submit of that attempt (double-tap, network retry, page reload). The server
 * recognises a repeated key and returns the original result instead of
 * awarding XP again. It's cleared only after a successful submit, so the
 * next attempt gets a fresh key.
 */

export interface QuizSession {
  key: string;
  answers: Record<number, number>; // question id -> choice id
  index: number;
}

const storageKey = (slug: string) => `nextgen.quiz.${slug}`;

function newKey() {
  // randomUUID only exists on HTTPS/localhost and newer browsers.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // Fallback: build an RFC 4122 version 4 UUID from getRandomValues.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function loadSession(slug: string): QuizSession {
  try {
    const raw = sessionStorage.getItem(storageKey(slug));
    if (raw) return JSON.parse(raw) as QuizSession;
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return { key: newKey(), answers: {}, index: 0 };
}

export function saveSession(slug: string, session: QuizSession) {
  try {
    sessionStorage.setItem(storageKey(slug), JSON.stringify(session));
  } catch {
    /* progress just won't survive a reload */
  }
}

export function clearSession(slug: string) {
  try {
    sessionStorage.removeItem(storageKey(slug));
  } catch {
    /* ignore */
  }
}
