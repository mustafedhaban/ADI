import type { CSSProperties } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

/* ---------------------------------------------------------------------------
   App shell — shadcn Sidebar (Obsidian Archive).
--------------------------------------------------------------------------- */

export function AppLayout() {
  return (
    <SidebarProvider
      className="overflow-x-hidden"
      style={
        {
          "--sidebar-width": "15rem",
          "--sidebar-width-icon": "3.25rem",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur md:px-4">
          <SidebarTrigger className="-ml-0.5" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Alool Design Intelligence
          </span>
        </header>
        <div className="mx-auto w-full min-w-0 max-w-[1280px] flex-1 px-5 py-8 md:px-8 md:py-10">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
