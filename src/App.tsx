
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFound from "@/pages/NotFound";
import ProviderDashboardPage from "@/pages/ProviderDashboardPage";
import ClientDashboardPage from "@/pages/ClientDashboardPage";
import OwnerDashboardPage from "@/pages/OwnerDashboardPage";
import ProfilePage from "@/pages/OwnerProfilePage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import HomePage from "@/pages/HomePage";
import LocationsPage from "@/pages/LocationsPage";
import ProvidersPage from "@/pages/ProvidersPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import ClientProfilePage from "@/pages/ClientProfilePage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import GlobalAdminDashboardPage from "@/pages/GlobalAdminDashboardPage";
import GlobalAdminProfilePage from "@/pages/GlobalAdminProfilePage";

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
        path: "/provider/dashboard",
        element: <ProviderDashboardPage />,
      },
      {
        path: "/client/dashboard",
        element: <ClientDashboardPage />,
      },
      {
        path: "/owner/dashboard",
        element: <OwnerDashboardPage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/client/profile",
        element: <ClientProfilePage />,
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
        path: "/providers",
        element: <ProvidersPage />,
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
