import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Palette,
  LayoutTemplate,
  Factory,
  Calendar,
  FolderOpen,
  Trophy,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Brand Kit", url: "/brand-kit", icon: Palette },
  { title: "Template Library", url: "/templates", icon: LayoutTemplate },
  { title: "Content Factory", url: "/content-factory", icon: Factory },
  { title: "Content Calendar", url: "/calendar", icon: Calendar },
  { title: "Asset Vault", url: "/assets", icon: FolderOpen },
  { title: "Proof Vault", url: "/proofs", icon: Trophy },
  { title: "Exports", url: "/exports", icon: Download },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-20 px-6 border-b border-sidebar-border",
        collapsed && "justify-center px-0"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-lg font-black text-primary-foreground">AA</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-sm">AA Studio</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Brand OS</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors",
                isActive && "text-primary"
              )} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.title}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Create Button */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <NavLink to="/content-factory">
            <Button variant="gradient" className="w-full gap-2">
              <Sparkles className="w-4 h-4" />
              Create Content
            </Button>
          </NavLink>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("w-full", collapsed && "px-0")}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
