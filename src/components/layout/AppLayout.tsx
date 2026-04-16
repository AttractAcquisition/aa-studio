import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="min-h-screen pl-72">
        <div className="px-6 py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
