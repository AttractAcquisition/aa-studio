import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import AAConsole from "./pages/AAConsole";
import ClientConsole from "./pages/ClientConsole";
import ClientDashboard from "./pages/ClientDashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<AuthGuard><AAConsole /></AuthGuard>} />
          <Route path="/aa-console" element={<AuthGuard><AAConsole /></AuthGuard>} />
          <Route path="/client-console" element={<AuthGuard><ClientConsole /></AuthGuard>} />
          <Route path="/client/:clientId" element={<AuthGuard><ClientDashboard /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
