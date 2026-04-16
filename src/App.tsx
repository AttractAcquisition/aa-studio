import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AAConsole from "./pages/AAConsole";
import ClientConsole from "./pages/ClientConsole";
import Briefs from "./pages/Briefs";
import Strategy from "./pages/Strategy";
import Production from "./pages/Production";
import Repurpose from "./pages/Repurpose";
import ReviewQueue from "./pages/ReviewQueue";
import Library from "./pages/Library";
import ScriptLibrary from "./pages/ScriptLibrary";
import Performance from "./pages/Performance";
import ContentFactory from "./pages/ContentFactory";
import BrandKit from "./pages/BrandKit";
import ContentCalendar from "./pages/ContentCalendar";
import AssetVault from "./pages/AssetVault";
import ProofVault from "./pages/ProofVault";
import Videos from "./pages/Videos";
import RecordingStudio from "./pages/RecordingStudio";
import VideoGenerator from "./pages/VideoGenerator";
import Exports from "./pages/Exports";
import Enquiries from "./pages/Enquiries";
import OnePagers from "./pages/OnePagers";
import TemplateLibrary from "./pages/TemplateLibrary";
import TemplateEdit from "./pages/TemplateEdit";
import BundleDetail from "./pages/BundleDetail";
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
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/aa-console" element={<AuthGuard><AAConsole /></AuthGuard>} />
          <Route path="/client-console" element={<AuthGuard><ClientConsole /></AuthGuard>} />
          <Route path="/briefs" element={<AuthGuard><Briefs /></AuthGuard>} />
          <Route path="/strategy" element={<AuthGuard><Strategy /></AuthGuard>} />
          <Route path="/production" element={<AuthGuard><Production /></AuthGuard>} />
          <Route path="/repurpose" element={<AuthGuard><Repurpose /></AuthGuard>} />
          <Route path="/review" element={<AuthGuard><ReviewQueue /></AuthGuard>} />
          <Route path="/library" element={<AuthGuard><Library /></AuthGuard>} />
          <Route path="/script-library" element={<AuthGuard><ScriptLibrary /></AuthGuard>} />
          <Route path="/performance" element={<AuthGuard><Performance /></AuthGuard>} />
          <Route path="/content-factory" element={<AuthGuard><ContentFactory /></AuthGuard>} />
          <Route path="/brand-kit" element={<AuthGuard><BrandKit /></AuthGuard>} />
          <Route path="/calendar" element={<AuthGuard><ContentCalendar /></AuthGuard>} />
          <Route path="/content-calendar" element={<AuthGuard><ContentCalendar /></AuthGuard>} />
          <Route path="/asset-vault" element={<AuthGuard><AssetVault /></AuthGuard>} />
          <Route path="/proof-vault" element={<AuthGuard><ProofVault /></AuthGuard>} />
          <Route path="/videos" element={<AuthGuard><Videos /></AuthGuard>} />
          <Route path="/recording-studio" element={<AuthGuard><RecordingStudio /></AuthGuard>} />
          <Route path="/video-generator" element={<AuthGuard><VideoGenerator /></AuthGuard>} />
          <Route path="/exports" element={<AuthGuard><Exports /></AuthGuard>} />
          <Route path="/enquiries" element={<AuthGuard><Enquiries /></AuthGuard>} />
          <Route path="/one-pagers" element={<AuthGuard><OnePagers /></AuthGuard>} />
          <Route path="/templates" element={<AuthGuard><TemplateLibrary /></AuthGuard>} />
          <Route path="/template-library" element={<AuthGuard><TemplateLibrary /></AuthGuard>} />
          <Route path="/templates/:id/edit" element={<AuthGuard><TemplateEdit /></AuthGuard>} />
          <Route path="/bundles/:id" element={<AuthGuard><BundleDetail /></AuthGuard>} />
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
