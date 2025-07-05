import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/versions" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/ai-config" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/tag-extraction" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/extraction" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/extraction/:templateId" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/batch-processing" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/tags" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/tag-mapping" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/tag-analytics" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/conversion" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/compare" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/conversion-templates" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/review" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/review-history" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/workflow-config" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/change-requests" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/impact-analysis" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/deployment" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/usage-stats" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/ai-performance" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/permissions" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/audit-logs" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
