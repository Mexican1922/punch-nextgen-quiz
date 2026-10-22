import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthShell, { Field } from "../components/AuthShell";
import { Button } from "../components/ui";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "That username and password don't match."
          : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to keep your streak of learning going.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="rounded-xl bg-flame/15 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
        <Button type="submit" loading={busy} disabled={!username || !password} className="w-full">
          Log in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link to="/register" className="font-semibold text-sun hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
