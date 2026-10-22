import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthShell, { Field } from "../components/AuthShell";
import { Button } from "../components/ui";
import { useAuth } from "../lib/auth";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      // The server re-checks everything (unique username, password strength).
      // These rules only exist here to give faster feedback.
      await register(form.username.trim(), form.displayName.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const ready = form.displayName.trim().length >= 2 && form.username.trim().length >= 3 && form.password.length >= 8;

  return (
    <AuthShell title="Create your account" subtitle="A nickname is fine. We don't need your real details.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Display name" autoComplete="nickname" maxLength={40} value={form.displayName} onChange={update("displayName")} hint="This is what others see on the leaderboard." />
        <Field label="Username" autoComplete="username" maxLength={30} value={form.username} onChange={update("username")} hint="Letters, numbers, underscores or dots." />
        <Field label="Password" type="password" autoComplete="new-password" value={form.password} onChange={update("password")} hint="At least 8 characters. Avoid common ones like password123." />
        {error && (
          <p role="alert" className="rounded-2xl bg-pen-wash px-4 py-3 text-[15px]">
            {error}
          </p>
        )}
        <Button type="submit" loading={busy} disabled={!ready} className="w-full">
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
