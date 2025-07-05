import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/upload" element={<Index />} />
          <Route path="/library" element={<Index />} />
          <Route path="/versions" element={<Index />} />
          <Route path="/ai-config" element={<Index />} />
          <Route path="/tag-extraction" element={<Index />} />
          <Route path="/batch-processing" element={<Index />} />
          <Route path="/tags" element={<Index />} />
          <Route path="/tag-mapping" element={<Index />} />
          <Route path="/tag-analytics" element={<Index />} />
          <Route path="/conversion" element={<Index />} />
          <Route path="/compare" element={<Index />} />
          <Route path="/conversion-templates" element={<Index />} />
          <Route path="/review" element={<Index />} />
          <Route path="/review-history" element={<Index />} />
          <Route path="/workflow-config" element={<Index />} />
          <Route path="/change-requests" element={<Index />} />
          <Route path="/impact-analysis" element={<Index />} />
          <Route path="/deployment" element={<Index />} />
          <Route path="/analytics" element={<Index />} />
          <Route path="/usage-stats" element={<Index />} />
          <Route path="/ai-performance" element={<Index />} />
          <Route path="/users" element={<Index />} />
          <Route path="/permissions" element={<Index />} />
          <Route path="/audit-logs" element={<Index />} />
          <Route path="/settings" element={<Index />} />
          <Route path="/notifications" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
