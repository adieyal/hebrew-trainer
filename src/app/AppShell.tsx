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
          <p className="app-shell__mark">Personal Hebrew Mistake Trainer</p>
        </header>
      ) : (
        <header className="app-shell__header">
          <div>
            <p className="eyebrow">Personal Hebrew Mistake Trainer</p>
            <h1>Practice the Hebrew mistakes you actually make</h1>
          </div>
          <p className="app-shell__lede">
            A local-first writing desk for importing corrections, drilling weak
            patterns, and tracking relapse over time.
          </p>
        </header>
      )}

      <nav
        className={isPracticeRoute ? "app-shell__nav app-shell__nav--practice" : "app-shell__nav"}
        aria-label="Primary"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              isActive
                ? `nav-link nav-link--active${isPracticeRoute ? " nav-link--practice-active" : ""}`
                : `nav-link${isPracticeRoute ? " nav-link--practice" : ""}`
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
