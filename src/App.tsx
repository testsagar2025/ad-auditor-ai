import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Store from "./pages/Store";
import InstituteDetail from "./pages/InstituteDetail";
import Scanner from "./pages/Scanner";
import Conflicts from "./pages/Conflicts";
import ConflictDetail from "./pages/ConflictDetail";
import ReportGenerator from "./pages/ReportGenerator";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Disclaimer from "./pages/Disclaimer";
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
          <Route path="/store" element={<Store />} />
          <Route path="/store/:id" element={<InstituteDetail />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/conflicts" element={<Conflicts />} />
          <Route path="/conflicts/:id" element={<ConflictDetail />} />
          <Route path="/conflict" element={<Navigate to="/conflicts" replace />} />
          <Route path="/report/:type/:id" element={<ReportGenerator />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
