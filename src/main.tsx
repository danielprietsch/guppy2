import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Pages
import Index from './pages/Index';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LocationsPage from './pages/LocationsPage';
import LocationDetailPage from './pages/LocationDetailPage';
import BookCabinPage from './pages/BookCabinPage';
import ProfessionalsPage from './pages/ProfessionalsPage';
import ProfessionalDetailPage from './pages/ProfessionalDetailPage';
import ProfessionalDashboardPage from './pages/ProfessionalDashboardPage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import ClientReservationsPage from './pages/ClientReservationsPage';
import ClientProfilePage from './pages/ClientProfilePage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import OwnerProfilePage from './pages/OwnerProfilePage';
import GlobalAdminDashboardPage from './pages/GlobalAdminDashboardPage';
import GlobalAdminProfilePage from './pages/GlobalAdminProfilePage';
import NotFound from './pages/NotFound';
import NewServicePage from './pages/NewServicePage';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found, creating one');
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  createRoot(newRoot).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  );
} else {
  createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  );
}
