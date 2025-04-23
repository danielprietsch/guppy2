
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { TooltipProvider } from "@/components/ui/tooltip";

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
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import ClientProfilePage from "./pages/ClientProfilePage";
import ProviderProfilePage from "./pages/ProviderProfilePage";
import OwnerProfilePage from "./pages/OwnerProfilePage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
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
                <Route path="owner/dashboard" element={<OwnerDashboardPage />} />
                <Route path="client/profile" element={<ClientProfilePage />} />
                <Route path="provider/profile" element={<ProviderProfilePage />} />
                <Route path="owner/profile" element={<OwnerProfilePage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
