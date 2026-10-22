import { BookOpen, House, LogOut, Trophy } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Logo } from "./ui";

const links = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/quizzes", label: "Quizzes", icon: BookOpen, end: false },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy, end: false },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh pb-28 md:pb-16">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-6 px-4">
          <NavLink to="/" aria-label="NextGen home">
            <Logo />
          </NavLink>

          <nav aria-label="Main" className="hidden flex-1 gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2 text-[15px] font-semibold ${
                    isActive ? "bg-paper text-ink shadow-[0_1px_0_var(--color-rule)]" : "text-ink-soft hover:text-ink"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden max-w-40 truncate text-[15px] font-semibold sm:inline">{user?.display_name}</span>
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-rule/60 hover:text-ink"
            >
              <LogOut aria-hidden className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-8">
        <Outlet />
      </main>

      {/* Thumb-reachable tabs on phones. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 pb-2 pt-2.5 text-xs font-semibold ${isActive ? "text-ink" : "text-ink-faint"}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`grid h-8 w-12 place-items-center rounded-full ${isActive ? "bg-punch text-white" : ""}`}>
                  <Icon aria-hidden className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
