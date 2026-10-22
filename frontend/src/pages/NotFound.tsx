import { Link } from "react-router-dom";
import { Logo } from "../components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-sm text-center">
        <Logo />
        <h1 className="mt-10 text-3xl font-black tracking-tight">There's no page here</h1>
        <p className="mt-2 text-lg text-ink-soft">The link may be mistyped, or the page may have moved.</p>
        <Link to="/" className="press mt-8 inline-flex min-h-12 items-center rounded-2xl bg-highlight px-6 text-[17px] font-bold text-ink">
          Go to home
        </Link>
      </div>
    </div>
  );
}
