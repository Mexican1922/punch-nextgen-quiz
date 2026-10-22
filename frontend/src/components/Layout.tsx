import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Logo } from "./ui";

const links = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/quizzes", label: "Quizzes", icon: "🧠", end: false },
  { to: "/leaderboard", label: "Leaderboard", icon: "🏆", end: false },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <NavLink to="/" aria-label="NextGen home">
            <Logo />
          </NavLink>

          <nav aria-label="Main" className="hidden gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive ? "bg-ink-3 text-sun" : "text-muted hover:text-white"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user?.display_name}</span>
            <button
              onClick={logout}
              className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-muted hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6">
        <Outlet />
      </main>

      {/* Bottom tab bar on phones, where a thumb can reach it. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${isActive ? "text-sun" : "text-muted"}`
            }
          >
            <span aria-hidden className="text-lg">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
