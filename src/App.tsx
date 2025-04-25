
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Index from './pages/Index';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LocationsPage from './pages/LocationsPage';
import LocationDetailPage from './pages/LocationDetailPage';
import BookCabinPage from './pages/BookCabinPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfessionalsPage from './pages/ProfessionalsPage';
import ProfessionalDetailPage from './pages/ProfessionalDetailPage';
import ProfessionalDashboardPage from './pages/ProfessionalDashboardPage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import ClientReservationsPage from './pages/ClientReservationsPage';
import ClientProfilePage from './pages/ClientProfilePage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import OwnerProfilePage from './pages/OwnerProfilePage';
import CabinsLossReport from './pages/owner/CabinsLossReport';
import AdminDashboardPage from './pages/AdminDashboardPage';
import GlobalAdminDashboardPage from './pages/GlobalAdminDashboardPage';
import GlobalAdminProfilePage from './pages/GlobalAdminProfilePage';
import NotFound from './pages/NotFound';
import NewServicePage from './pages/NewServicePage';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <BrowserRouter>
        <NavBar />
        <main className="flex-1 relative">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/locations/:id" element={<LocationDetailPage />} />
            <Route path="/book-cabin/:cabinId" element={<BookCabinPage />} />
            
            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Professional Routes */}
            <Route path="/professionals" element={<ProfessionalsPage />} />
            <Route path="/professionals/:id" element={<ProfessionalDetailPage />} />
            <Route path="/professional/dashboard" element={<ProfessionalDashboardPage />} />
            <Route path="/professional/profile" element={<ProfessionalProfilePage />} />
            <Route path="/services/new" element={<NewServicePage />} />
            
            {/* Client Routes */}
            <Route path="/client/dashboard" element={<ClientDashboardPage />} />
            <Route path="/client/reservations" element={<ClientReservationsPage />} />
            <Route path="/client/profile" element={<ClientProfilePage />} />
            
            {/* Owner Routes */}
            <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
            <Route path="/owner/profile" element={<OwnerProfilePage />} />
            <Route path="/owner/reports/cabins-loss" element={<CabinsLossReport />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/global" element={<GlobalAdminDashboardPage />} />
            <Route path="/admin/profile" element={<GlobalAdminProfilePage />} />
            
            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
