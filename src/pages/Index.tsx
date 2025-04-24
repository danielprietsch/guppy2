
import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

// Main Layout Components
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

// Pages
import HomePage from "./HomePage";
import AboutPage from "./AboutPage";
import ContactPage from "./ContactPage";
import LocationsPage from "./LocationsPage";
import LocationDetailPage from "./LocationDetailPage";
import BookCabinPage from "./BookCabinPage";
import ProfessionalsPage from "./ProfessionalsPage";
import ProfessionalDetailPage from "./ProfessionalDetailPage";
import CabinSearchPage from "./CabinSearchPage";

// Auth Pages
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ResetPasswordPage from "./ResetPasswordPage";

// Dashboard Pages
import ClientDashboardPage from "./ClientDashboardPage";
import ClientReservationsPage from "./ClientReservationsPage";
import ProfessionalDashboardPage from "./ProfessionalDashboardPage";
import OwnerDashboardPage from "./OwnerDashboardPage";
import AdminDashboardPage from "./AdminDashboardPage";
import GlobalAdminDashboardPage from "./GlobalAdminDashboardPage";

// Profile Pages
import ClientProfilePage from "./ClientProfilePage";
import ProfessionalProfilePage from "./ProfessionalProfilePage";
import OwnerProfilePage from "./OwnerProfilePage";
import GlobalAdminProfilePage from "./GlobalAdminProfilePage";

// NotFound
import NotFound from "./NotFound";

// Loading Fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h2 className="text-xl font-bold mb-2">Carregando...</h2>
      <p className="text-muted-foreground">Por favor, aguarde.</p>
    </div>
  </div>
);

export default function Index() {
  return (
    <>
      <NavBar />
      <main className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/locations/:id" element={<LocationDetailPage />} />
            <Route path="/book-cabin/:cabinId" element={<BookCabinPage />} />
            <Route path="/professionals" element={<ProfessionalsPage />} />
            <Route path="/professional/:id" element={<ProfessionalDetailPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Search Routes */}
            <Route path="/search-cabins" element={<CabinSearchPage />} />
            <Route path="/cabin-search" element={<CabinSearchPage />} />

            {/* Dashboard Routes */}
            <Route path="/client/dashboard" element={<ClientDashboardPage />} />
            <Route path="/client/reservations" element={<ClientReservationsPage />} />
            <Route path="/professional/dashboard" element={<ProfessionalDashboardPage />} />
            <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/global" element={<GlobalAdminDashboardPage />} />

            {/* Profile Routes */}
            <Route path="/client/profile" element={<ClientProfilePage />} />
            <Route path="/professional/profile" element={<ProfessionalProfilePage />} />
            <Route path="/owner/profile" element={<OwnerProfilePage />} />
            <Route path="/admin/profile" element={<GlobalAdminProfilePage />} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Toaster />
    </>
  );
}
