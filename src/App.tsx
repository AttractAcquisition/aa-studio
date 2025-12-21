import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import BrandKit from "./pages/BrandKit";
import TemplateLibrary from "./pages/TemplateLibrary";
import ContentFactory from "./pages/ContentFactory";
import ContentCalendar from "./pages/ContentCalendar";
import AssetVault from "./pages/AssetVault";
import ProofVault from "./pages/ProofVault";
import Exports from "./pages/Exports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/brand-kit" element={<BrandKit />} />
          <Route path="/templates" element={<TemplateLibrary />} />
          <Route path="/content-factory" element={<ContentFactory />} />
          <Route path="/calendar" element={<ContentCalendar />} />
          <Route path="/assets" element={<AssetVault />} />
          <Route path="/proofs" element={<ProofVault />} />
          <Route path="/exports" element={<Exports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
