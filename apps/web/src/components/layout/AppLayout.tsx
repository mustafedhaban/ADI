import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Briefcase,
  FolderKanban,
  LayoutDashboard,
  Library,
  Plus,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/references", label: "Library", icon: Library, match: "library" as const },
  {
    to: "/collections",
    label: "Collections",
    icon: FolderKanban,
    match: "collections" as const,
  },
  {
    to: "/projects",
    label: "Projects",
    icon: Briefcase,
    match: "projects" as const,
  },
  { to: "/references/new", label: "Add Reference", icon: Plus, end: true },
  { to: "/import", label: "Import", icon: Upload },
];

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl tracking-tight">ADI</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Alool Design Intelligence
            </span>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {links.map(({ to, label, icon: Icon, end, match }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => {
                  const libraryActive =
                    match === "library" &&
                    (location.pathname === "/references" ||
                      (/^\/references\/[^/]+(\/edit)?$/.test(
                        location.pathname,
                      ) &&
                        location.pathname !== "/references/new" &&
                        location.pathname !== "/references/quick-import"));
                  const collectionsActive =
                    match === "collections" &&
                    location.pathname.startsWith("/collections");
                  const projectsActive =
                    match === "projects" &&
                    location.pathname.startsWith("/projects");
                  const active =
                    match === "library"
                      ? libraryActive
                      : match === "collections"
                        ? collectionsActive
                        : match === "projects"
                          ? projectsActive
                          : isActive;
                  return cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  );
                }}
              >
                <Icon className="size-4" />
                <span className="whitespace-nowrap">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
