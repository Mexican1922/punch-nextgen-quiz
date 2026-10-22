import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthShell, { Field } from "../components/AuthShell";
import { Button } from "../components/ui";
import { useAuth } from "../lib/auth";
import { serverErrors, validateRegistration, type FieldErrors, type RegistrationForm } from "../lib/validation";

type Key = keyof RegistrationForm;

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegistrationForm>({ displayName: "", username: "", password: "" });
  // A field shows its errors once the student has left it, or after they press the button.
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [fromServer, setFromServer] = useState<FieldErrors<RegistrationForm>>({});
  const [general, setGeneral] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const local = validateRegistration(form);
  const errorsFor = (key: Key) => fromServer[key] ?? (touched[key] || submitted ? local[key] : undefined);

  const update = (key: Key) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    // The server's message was about the old value; drop it once they edit.
    setFromServer((s) => ({ ...s, [key]: undefined }));
  };
  const leave = (key: Key) => () => setTouched((t) => ({ ...t, [key]: true }));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setGeneral("");
    const firstInvalid = (["displayName", "username", "password"] as Key[]).find((k) => local[k]);
    if (firstInvalid) {
      // Move the cursor to the first box that needs fixing.
      e.currentTarget.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await register(form.username.trim(), form.displayName.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      const { fields, general } = serverErrors(err);
      setFromServer(fields);
      setGeneral(general);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="A nickname is fine. We don't need your real details.">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field
          label="Display name"
          name="displayName"
          autoComplete="nickname"
          maxLength={40}
          value={form.displayName}
          onChange={update("displayName")}
          onBlur={leave("displayName")}
          error={errorsFor("displayName")}
          hint="This is what others see on the leaderboard."
        />
        <Field
          label="Username"
          name="username"
          autoComplete="username"
          maxLength={30}
          value={form.username}
          onChange={update("username")}
          onBlur={leave("username")}
          error={errorsFor("username")}
          hint="Letters, numbers, underscores or dots. You'll use it to log in."
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update("password")}
          onBlur={leave("password")}
          error={errorsFor("password")}
          hint="At least 8 characters. Avoid common words and number patterns."
        />
        {general && (
          <p role="alert" className="rounded-2xl bg-pen-wash px-4 py-3 text-[15px]">
            {general}
          </p>
        )}
        <Button type="submit" loading={busy} className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-8 text-center text-ink-soft">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
