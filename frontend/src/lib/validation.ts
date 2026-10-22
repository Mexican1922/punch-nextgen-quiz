import { ApiError } from "./api";

export interface RegistrationForm {
  displayName: string;
  username: string;
  password: string;
}

export type FieldErrors<T> = Partial<Record<keyof T, string[]>>;

/**
 * Instant checks in the browser so students see problems as they type.
 * These mirror the server's rules but don't replace them: the server checks
 * everything again (including "too common" and "username taken").
 */
export function validateRegistration(form: RegistrationForm): FieldErrors<RegistrationForm> {
  const errors: FieldErrors<RegistrationForm> = {};
  const name = form.displayName.trim();
  const username = form.username.trim();
  const password = form.password;

  if (name.length < 2) errors.displayName = ["Enter a display name of at least 2 characters."];

  if (username.length < 3) {
    errors.username = ["Usernames need at least 3 characters."];
  } else if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    errors.username = ["Use only letters, numbers, underscores or dots. No spaces."];
  }

  const passwordErrors: string[] = [];
  if (password.length < 8) passwordErrors.push(`Use at least 8 characters (${password.length} so far).`);
  if (password && /^\d+$/.test(password)) passwordErrors.push("It can't be only numbers.");
  if (password && username && password.toLowerCase().includes(username.toLowerCase())) {
    passwordErrors.push("It's too similar to your username.");
  }
  if (passwordErrors.length) errors.password = passwordErrors;

  return errors;
}

const SERVER_FIELDS: Record<string, keyof RegistrationForm> = {
  display_name: "displayName",
  username: "username",
  password: "password",
};

/** Split a 400 from Django REST Framework into per-field messages and a general one. */
export function serverErrors(err: unknown): { fields: FieldErrors<RegistrationForm>; general: string } {
  if (!(err instanceof ApiError) || err.status !== 400 || !err.data || typeof err.data !== "object") {
    return { fields: {}, general: (err as Error)?.message ?? "Something went wrong." };
  }
  const fields: FieldErrors<RegistrationForm> = {};
  const general: string[] = [];
  for (const [key, value] of Object.entries(err.data as Record<string, unknown>)) {
    const messages = (Array.isArray(value) ? value : [value]).map(String);
    const field = SERVER_FIELDS[key];
    if (field) fields[field] = messages;
    else general.push(...messages);
  }
  return { fields, general: general.join(" ") };
}
