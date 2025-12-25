import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import Dashboard from "./pages/Dashboard";
import BrandKit from "./pages/BrandKit";
import TemplateLibrary from "./pages/TemplateLibrary";
import TemplateEdit from "./pages/TemplateEdit";
import ScriptLibrary from "./pages/ScriptLibrary";
import ContentFactory from "./pages/ContentFactory";
import ContentCalendar from "./pages/ContentCalendar";
import AssetVault from "./pages/AssetVault";
import ProofVault from "./pages/ProofVault";
import Exports from "./pages/Exports";
import Enquiries from "./pages/Enquiries";
import Videos from "./pages/Videos";
import OnePagers from "./pages/OnePagers";
import RecordingStudio from "./pages/RecordingStudio";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/brand-kit" element={<AuthGuard><BrandKit /></AuthGuard>} />
          <Route path="/templates" element={<AuthGuard><TemplateLibrary /></AuthGuard>} />
          <Route path="/templates/:id/edit" element={<AuthGuard><TemplateEdit /></AuthGuard>} />
          <Route path="/scripts" element={<AuthGuard><ScriptLibrary /></AuthGuard>} />
          <Route path="/content-factory" element={<AuthGuard><ContentFactory /></AuthGuard>} />
          <Route path="/calendar" element={<AuthGuard><ContentCalendar /></AuthGuard>} />
          <Route path="/assets" element={<AuthGuard><AssetVault /></AuthGuard>} />
          <Route path="/proofs" element={<AuthGuard><ProofVault /></AuthGuard>} />
          <Route path="/videos" element={<AuthGuard><Videos /></AuthGuard>} />
          <Route path="/exports" element={<AuthGuard><Exports /></AuthGuard>} />
          <Route path="/enquiries" element={<AuthGuard><Enquiries /></AuthGuard>} />
          <Route path="/one-pagers" element={<AuthGuard><OnePagers /></AuthGuard>} />
          <Route path="/record" element={<AuthGuard><RecordingStudio /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
