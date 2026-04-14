import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import Home from "./pages/Home";
import ClientRequests from "./pages/ClientRequests";
import ClientApprovals from "./pages/ClientApprovals";
import ClientCalendar from "./pages/ClientCalendar";
import ClientLibrary from "./pages/ClientLibrary";
import ClientPerformance from "./pages/ClientPerformance";
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
          <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
          <Route path="/client/requests" element={<AuthGuard><ClientRequests /></AuthGuard>} />
          <Route path="/client/approvals" element={<AuthGuard><ClientApprovals /></AuthGuard>} />
          <Route path="/client/calendar" element={<AuthGuard><ClientCalendar /></AuthGuard>} />
          <Route path="/client/library" element={<AuthGuard><ClientLibrary /></AuthGuard>} />
          <Route path="/client/performance" element={<AuthGuard><ClientPerformance /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
