import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AAConsole from "./pages/AAConsole";
import ClientConsole from "./pages/ClientConsole";
import ClientDashboard from "./pages/ClientDashboard";
import BrandIntelligence from "./pages/BrandIntelligence";
import PositioningStudio from "./pages/PositioningStudio";
import ScriptLibrary from "./pages/ScriptLibrary";
import ProofAssetManager from "./pages/ProofAssetManager";
import OrganicContentStudio from "./pages/OrganicContentStudio";
import ProfileBuilder from "./pages/ProfileBuilder";
import AdCreativeBriefs from "./pages/AdCreativeBriefs";
import ApprovalQueue from "./pages/ApprovalQueue";
import ContentCalendar from "./pages/ContentCalendar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={<Navigate to="/aa-console" replace />} />

          <Route path="/aa-console" element={<AuthGuard><ConsoleShell context="aa" /></AuthGuard>}>
            <Route index element={<AAConsole />} />
            <Route path="brand-intelligence" element={<BrandIntelligence />} />
            <Route path="positioning-studio" element={<PositioningStudio />} />
            <Route path="script-library" element={<ScriptLibrary />} />
            <Route path="proof-assets" element={<ProofAssetManager />} />
            <Route path="organic-studio" element={<OrganicContentStudio />} />
            <Route path="profile-builder" element={<ProfileBuilder />} />
            <Route path="ad-briefs" element={<AdCreativeBriefs />} />
            <Route path="approval-queue" element={<ApprovalQueue />} />
            <Route path="content-calendar" element={<ContentCalendar />} />
          </Route>

          <Route path="/clients" element={<AuthGuard><ClientConsole /></AuthGuard>} />
          <Route path="/clients/:clientId" element={<AuthGuard><ConsoleShell context="client" /></AuthGuard>}>
            <Route index element={<ClientDashboard />} />
            <Route path="brand-intelligence" element={<BrandIntelligence />} />
            <Route path="positioning-studio" element={<PositioningStudio />} />
            <Route path="script-library" element={<ScriptLibrary />} />
            <Route path="proof-assets" element={<ProofAssetManager />} />
            <Route path="organic-studio" element={<OrganicContentStudio />} />
            <Route path="profile-builder" element={<ProfileBuilder />} />
            <Route path="ad-briefs" element={<AdCreativeBriefs />} />
            <Route path="approval-queue" element={<ApprovalQueue />} />
            <Route path="content-calendar" element={<ContentCalendar />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
