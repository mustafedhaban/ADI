import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Briefcase,
  FolderKanban,
  LayoutDashboard,
  Library,
  Link2,
  Plus,
  Upload,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Meta } from "@/components/common/Primitives";

/* ---------------------------------------------------------------------------
   App shell — persistent left rail (design direction §5, §6).
   Replaces the previous top nav, which overflowed at six items on tablet.
--------------------------------------------------------------------------- */

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  /** Custom active test for routes with sibling paths. */
  isActive?: (pathname: string) => boolean;
};

const GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Browse",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      {
        to: "/references",
        label: "Library",
        icon: Library,
        isActive: (p) =>
          p === "/references" ||
          (/^\/references\/[^/]+(\/edit)?$/.test(p) &&
            p !== "/references/new" &&
            p !== "/references/quick-import"),
      },
      {
        to: "/collections",
        label: "Collections",
        icon: FolderKanban,
        isActive: (p) => p.startsWith("/collections"),
      },
    ],
  },
  {
    label: "Work",
    items: [
      {
        to: "/projects",
        label: "Projects",
        icon: Briefcase,
        isActive: (p) => p.startsWith("/projects"),
      },
    ],
  },
  {
    label: "Add",
    items: [
      {
        to: "/references/quick-import",
        label: "Quick Import",
        icon: Link2,
        end: true,
      },
      { to: "/references/new", label: "Add Reference", icon: Plus, end: true },
      { to: "/import", label: "Bulk Import", icon: Upload },
    ],
  },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <>
      {GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <Meta className="px-3 pb-1">{group.label}</Meta>
          {group.items.map(({ to, label, icon: Icon, end, isActive }) => {
            const active = isActive
              ? isActive(location.pathname)
              : undefined;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive: routerActive }) =>
                  cn(
                    "group relative inline-flex items-center gap-2.5 rounded-sm py-1.5 pl-3 pr-2 text-sm transition-colors",
                    (active ?? routerActive)
                      ? "font-medium text-foreground"
                      : "text-ink-2 hover:bg-surface-2 hover:text-foreground",
                  )
                }
              >
                {({ isActive: routerActive }) => {
                  const on = active ?? routerActive;
                  return (
                    <>
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full transition-colors",
                          on ? "bg-primary" : "bg-transparent",
                        )}
                      />
                      <Icon
                        aria-hidden
                        className={cn(
                          "size-4 shrink-0",
                          on ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="whitespace-nowrap">{label}</span>
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </div>
      ))}
    </>
  );
}

function Wordmark() {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="font-display text-2xl leading-none">ADI</span>
      <span className="meta hidden sm:inline">Design Intelligence</span>
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    api
      .getDashboard()
      .then((d) => setTotal(d.total))
      .catch(() => setTotal(null));
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen lg:flex">
      {/* --- desktop rail --- */}
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r bg-background lg:flex">
        <div className="border-b px-5 py-5">
          <Wordmark />
        </div>
        <nav className="thin-scroll flex flex-1 flex-col gap-6 overflow-y-auto px-2 py-5">
          <NavItems />
        </nav>
        <div className="border-t px-5 py-4">
          <Meta className="tabular">
            {total === null ? "—" : total} references
          </Meta>
        </div>
      </aside>

      {/* --- mobile bar --- */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-5 py-3.5 backdrop-blur">
          <Wordmark />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="adi-mobile-nav"
            className="meta rounded-sm border px-3 py-1.5 text-foreground transition-colors hover:bg-surface-2"
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </header>
        {mobileOpen && (
          <nav
            id="adi-mobile-nav"
            className="flex flex-col gap-6 border-b bg-background px-3 py-5"
          >
            <NavItems onNavigate={() => setMobileOpen(false)} />
          </nav>
        )}
      </div>

      {/* --- content --- */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 md:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
