
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { User } from "@/lib/types";

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in from localStorage
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("Index: User loaded from localStorage:", parsedUser);
        setCurrentUser(parsedUser);
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
    }
  }, [location.pathname]); // Re-check on route changes

  const handleLogout = () => {
    // Clear user from localStorage
    localStorage.removeItem("currentUser");
    // Reset user state
    setCurrentUser(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
