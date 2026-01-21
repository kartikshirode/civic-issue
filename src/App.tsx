import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import IssuesPage from "./pages/IssuesPage";
import IssueDetail from "./pages/IssueDetail";
import ReportPage from "./pages/ReportPage";
import AboutPage from "./pages/AboutPage";
import MapPage from "./pages/MapPage";

// Create a new QueryClient instance
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/issues/:id" element={<IssueDetail />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/map" element={<MapPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
