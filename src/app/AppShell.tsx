import { NavLink, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Import", end: true },
  { to: "/practice", label: "Practice" },
  { to: "/mistakes", label: "Mistakes" },
  { to: "/generated-drills", label: "Generated drills" },
  { to: "/insights", label: "Insights" },
  { to: "/help", label: "Help" },
  { to: "/settings", label: "Settings" },
];

export function AppShell() {
  const location = useLocation();
  const isPracticeRoute = location.pathname === "/practice";

  return (
    <div className={isPracticeRoute ? "app-shell app-shell--practice" : "app-shell"}>
      {isPracticeRoute ? (
        <header className="app-shell__session-bar">
          <p className="app-shell__mark type-label-meta">Personal Hebrew Mistake Trainer</p>
        </header>
      ) : (
        <header className="app-shell__header">
          <div>
            <p className="eyebrow type-label">Personal Hebrew Mistake Trainer</p>
            <h1 className="type-display-hero">Practice the Hebrew mistakes you actually make</h1>
          </div>
          <p className="app-shell__lede type-body-lede">
            A local-first writing desk for importing corrections, drilling weak
            patterns, and tracking relapse over time.
          </p>
        </header>
      )}

      <nav
        className="app-shell__nav app-shell__nav--practice"
        aria-label="Primary"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              isActive
                ? "nav-link nav-link--practice nav-link--active nav-link--practice-active"
                : "nav-link nav-link--practice"
            }
            end={item.end}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className={isPracticeRoute ? "app-shell__main app-shell__main--practice" : "app-shell__main"}>
        <Outlet />
      </main>
    </div>
  );
}
