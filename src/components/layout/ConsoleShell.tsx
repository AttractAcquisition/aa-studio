import { Outlet, NavLink, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { studioPageNav } from "@/lib/route-config";

interface ConsoleShellProps {
  context: "aa" | "client";
}

export function ConsoleShell({ context }: ConsoleShellProps) {
  const params = useParams();
  const clientId = context === "client" ? params.clientId : null;
  const basePath = context === "aa" ? "/aa-console" : `/clients/${clientId}`;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="h-20 border-b border-sidebar-border px-6 flex items-center">
          <div>
            <div className="font-bold text-foreground text-sm">AA Studio</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {context === "aa" ? "AA Console" : "Client Console"}
            </div>
          </div>
        </div>

        {context === "client" ? (
          <NavLink
            to="/clients"
            className="flex items-center gap-2 px-6 py-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            All clients
          </NavLink>
        ) : null}

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {studioPageNav.map((item) => (
            <NavLink
              key={item.path}
              to={`${basePath}/${item.path}`}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="min-h-screen flex-1 pl-72">
        <div className="p-8 lg:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
