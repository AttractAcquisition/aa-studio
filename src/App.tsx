import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { ConsoleShell } from "@/components/layout/ConsoleShell";

const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AAConsole = lazy(() => import("./pages/AAConsole"));
const ClientConsole = lazy(() => import("./pages/ClientConsole"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const BrandIntelligence = lazy(() => import("./pages/BrandIntelligence"));
const PositioningStudio = lazy(() => import("./pages/PositioningStudio"));
const ScriptLibrary = lazy(() => import("./pages/ScriptLibrary"));
const ProofAssetManager = lazy(() => import("./pages/ProofAssetManager"));
const OrganicContentStudio = lazy(() => import("./pages/OrganicContentStudio"));
const ProfileBuilder = lazy(() => import("./pages/ProfileBuilder"));
const AdCreativeBriefs = lazy(() => import("./pages/AdCreativeBriefs"));
const ApprovalQueue = lazy(() => import("./pages/ApprovalQueue"));
const ContentCalendar = lazy(() => import("./pages/ContentCalendar"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading aa-studio…</div>}>
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
