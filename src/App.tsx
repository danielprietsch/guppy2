
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFound from "@/pages/NotFound";
import ProfessionalDashboardPage from "@/pages/ProfessionalDashboardPage";
import ClientDashboardPage from "@/pages/ClientDashboardPage";
import OwnerDashboardPage from "@/pages/OwnerDashboardPage";
import OwnerProfilePage from "@/pages/OwnerProfilePage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import HomePage from "@/pages/HomePage";
import LocationsPage from "@/pages/LocationsPage";
import LocationDetailPage from "@/pages/LocationDetailPage";
import BookCabinPage from "@/pages/BookCabinPage";
import ProfessionalsPage from "@/pages/ProfessionalsPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import ClientProfilePage from "@/pages/ClientProfilePage";
import ClientReservationsPage from "@/pages/ClientReservationsPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import GlobalAdminDashboardPage from "@/pages/GlobalAdminDashboardPage";
import GlobalAdminProfilePage from "@/pages/GlobalAdminProfilePage";
import ProfessionalProfilePage from "@/pages/ProfessionalProfilePage";
import ProfessionalDetailPage from "@/pages/ProfessionalDetailPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    errorElement: <NotFound />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/professional/dashboard",
        element: <ProfessionalDashboardPage />,
      },
      {
        path: "/professional/profile",
        element: <ProfessionalProfilePage />,
      },
      {
        path: "/professional/:id",
        element: <ProfessionalDetailPage />,
      },
      {
        path: "/client/dashboard",
        element: <ClientDashboardPage />,
      },
      {
        path: "/client/profile",
        element: <ClientProfilePage />,
      },
      {
        path: "/client/reservations",
        element: <ClientReservationsPage />,
      },
      {
        path: "/owner/dashboard",
        element: <OwnerDashboardPage />,
      },
      {
        path: "/owner/profile",
        element: <OwnerProfilePage />,
      },
      {
        path: "/profile",
        element: <OwnerProfilePage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
      {
        path: "/locations",
        element: <LocationsPage />,
      },
      {
        path: "/locations/:id",
        element: <LocationDetailPage />,
      },
      {
        path: "/book-cabin/:id",
        element: <BookCabinPage />,
      },
      {
        path: "/professionals",
        element: <ProfessionalsPage />,
      },
      {
        path: "/about",
        element: <AboutPage />,
      },
      {
        path: "/contact",
        element: <ContactPage />,
      },
      {
        path: "/admin/dashboard",
        element: <AdminDashboardPage />,
      },
      {
        path: "/admin/global",
        element: <GlobalAdminDashboardPage />,
      },
      {
        path: "/admin/profile",
        element: <GlobalAdminProfilePage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
