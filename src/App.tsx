
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Import pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LocationsPage from "./pages/LocationsPage";
import LocationDetailPage from "./pages/LocationDetailPage";
import ProvidersPage from "./pages/ProvidersPage";
import ProviderDetailPage from "./pages/ProviderDetailPage";
import BookCabinPage from "./pages/BookCabinPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import ProviderDashboardPage from "./pages/ProviderDashboardPage";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="locations/:id" element={<LocationDetailPage />} />
            <Route path="providers" element={<ProvidersPage />} />
            <Route path="providers/:id" element={<ProviderDetailPage />} />
            <Route path="book-cabin/:id" element={<BookCabinPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="client/dashboard" element={<ClientDashboardPage />} />
            <Route path="provider/dashboard" element={<ProviderDashboardPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
