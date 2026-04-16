import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { sidebarSections, type SidebarNavItem } from "@/lib/aa-navigation";

function SidebarGroup({ title, items, collapsed }: { title: string; items: SidebarNavItem[]; collapsed: boolean }) {
  return (
    <div className="space-y-1">
      {!collapsed ? <div className="px-4 pt-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{title}</div> : null}
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) => cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors duration-200",
            isActive ? "border-primary/20 bg-primary/10 text-foreground" : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-secondary/50 hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          <item.icon className="h-5 w-5 flex-shrink-0 text-primary" />
          {!collapsed ? <span className="text-sm font-medium">{item.title}</span> : null}
        </NavLink>
      ))}
    </div>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isConsoleRoute = location.pathname.startsWith("/aa-console") || location.pathname.startsWith("/client-console");

  return (
    <aside className={cn("fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl transition-all duration-300", collapsed ? "w-20" : "w-72")}>
      <div className={cn("flex h-20 items-center border-b border-sidebar-border px-6", collapsed && "justify-center px-0")}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <span className="font-mono text-sm font-semibold tracking-[0.18em] text-primary">AA</span>
          </div>
          {!collapsed ? (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">AA Studio</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Content Ops Console</span>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4 scrollbar-hide">
        {sidebarSections.map((section) => (
          <SidebarGroup key={section.title} title={section.title} items={section.items} collapsed={collapsed} />
        ))}
      </nav>

      {!collapsed && isConsoleRoute ? (
        <div className="px-4 pb-4">
          <NavLink to={location.pathname.startsWith("/client-console") ? "/client/requests" : "/briefs"}>
            <Button variant="outline" className="w-full justify-between gap-2 rounded-xl">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {location.pathname.startsWith("/client-console") ? "Open Requests" : "Open Briefs"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </NavLink>
        </div>
      ) : null}

      <div className="border-t border-sidebar-border p-4">
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className={cn("w-full justify-center gap-2 rounded-xl", collapsed && "px-0")}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
        </Button>
      </div>
    </aside>
  );
}
