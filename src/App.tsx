
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
