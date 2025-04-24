import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFound from "@/pages/NotFound";
import ProviderDashboard from "@/pages/dashboards/ProviderDashboard";
import ClientDashboard from "@/pages/dashboards/ClientDashboard";
import OwnerDashboard from "@/pages/dashboards/OwnerDashboard";
import ProfilePage from "@/pages/ProfilePage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    errorElement: <NotFound />,
    children: [
      {
        path: "/",
        element: <LoginPage />,
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
        element: <ProviderDashboard />,
      },
      {
        path: "/client/dashboard",
        element: <ClientDashboard />,
      },
      {
        path: "/owner/dashboard",
        element: <OwnerDashboard />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
