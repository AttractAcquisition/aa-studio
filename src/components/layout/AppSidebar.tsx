import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Home, Sparkles, Users } from "lucide-react";
import { aaConsoleCards, clientConsoleCards } from "@/lib/studio-data";

const topLinks = [
  { title: "Home", url: "/", icon: Home },
  { title: "AA Console", url: "/aa-console", icon: Sparkles },
  { title: "Client Console", url: "/client-console", icon: Users },
];

function SidebarGroup({ title, links, collapsed }: { title: string; links: typeof aaConsoleCards; collapsed: boolean }) {
  return (
    <div className="space-y-1">
      {!collapsed ? <div className="px-4 pt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{title}</div> : null}
      {links.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          {!collapsed ? <span className="font-medium text-sm">{item.title}</span> : null}
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
    <aside className={cn("fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col", collapsed ? "w-20" : "w-72")}>
      <div className={cn("flex items-center h-20 px-6 border-b border-sidebar-border", collapsed && "justify-center px-0")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-lg font-black text-primary-foreground">AA</span>
          </div>
          {!collapsed ? (
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-sm">AA Studio</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Content Production Layer</span>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto scrollbar-hide">
        {topLinks.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed ? <span className="font-medium text-sm">{item.title}</span> : null}
          </NavLink>
        ))}

        <div className="pt-2">
          <SidebarGroup title="AA Console" links={aaConsoleCards} collapsed={collapsed} />
          <SidebarGroup title="Client Console" links={clientConsoleCards} collapsed={collapsed} />
        </div>
      </nav>

      {!collapsed && isConsoleRoute ? (
        <div className="px-4 pb-4">
          <NavLink to={location.pathname.startsWith("/client-console") ? "/client/requests" : "/briefs"}>
            <Button variant="gradient" className="w-full gap-2">
              <Sparkles className="w-4 h-4" />
              {location.pathname.startsWith("/client-console") ? "Open Requests" : "Open Briefs"}
            </Button>
          </NavLink>
        </div>
      ) : null}

      <div className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className={cn("w-full", collapsed && "px-0")}>
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </Button>
      </div>
    </aside>
  );
}
