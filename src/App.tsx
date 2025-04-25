import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LocationsPage from './pages/LocationsPage';
import BookCabinPage from './pages/BookCabinPage';
import { Toast } from "@/components/ui/toast"
import ClientDashboardPage from './pages/ClientDashboardPage';
import ClientReservationsPage from './pages/ClientReservationsPage';
import ProfessionalsPage from './pages/ProfessionalsPage';
import ProfessionalDashboardPage from './pages/ProfessionalDashboardPage';
import ProfessionalReservationsPage from './pages/ProfessionalReservationsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LocationsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/book-cabin/:id" element={<BookCabinPage />} />
        <Route path="/client/dashboard" element={<ClientDashboardPage />} />
        <Route path="/client/reservations" element={<ClientReservationsPage />} />
        <Route path="/professionals" element={<ProfessionalsPage />} />
        <Route path="/professional-dashboard" element={<ProfessionalDashboardPage />} />
        <Route path="/professional-reservations" element={<ProfessionalReservationsPage />} />
      </Routes>
      <Toast />
    </BrowserRouter>
  );
}

export default App;
