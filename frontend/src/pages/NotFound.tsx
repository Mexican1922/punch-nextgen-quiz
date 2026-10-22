import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-display text-7xl font-black text-sun">404</p>
        <p className="mt-2 text-muted">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-sun px-6 py-3 font-display font-extrabold text-ink">
          Go home
        </Link>
      </div>
    </div>
  );
}
