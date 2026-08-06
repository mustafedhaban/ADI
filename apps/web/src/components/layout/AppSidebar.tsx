import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Briefcase,
  Camera,
  Sparkles,
  FolderKanban,
  LayoutDashboard,
  Library,
  Link2,
  Plus,
  Upload,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
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
  {
    label: "Pipeline",
    items: [
      { to: "/capture", label: "Visual Capture", icon: Camera },
      { to: "/patterns", label: "Interface Patterns", icon: Sparkles },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    api
      .getDashboard()
      .then((d) => setTotal(d.total))
      .catch(() => setTotal(null));
  }, []);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/" end>
                <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="font-display text-sm font-semibold">A</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-display font-semibold tracking-tight">
                    ADI
                  </span>
                  <span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Design Intelligence
                  </span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ to, label, icon: Icon, end, isActive }) => {
                  const active = isActive
                    ? isActive(location.pathname)
                    : end
                      ? location.pathname === to
                      : location.pathname === to ||
                        location.pathname.startsWith(`${to}/`);
                  return (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton
                        asChild
                        tooltip={label}
                        isActive={active}
                      >
                        <NavLink to={to} end={end}>
                          <Icon />
                          <span>{label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Library">
              <NavLink to="/references">
                <Library />
                <span>References</span>
                <SidebarMenuBadge className="font-mono tabular-nums">
                  {total === null ? "—" : total}
                </SidebarMenuBadge>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
