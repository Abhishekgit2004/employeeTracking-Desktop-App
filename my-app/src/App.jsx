/* =====================================================
   App.jsx
   ===================================================== */

import { useState } from "react";
// import AuthLayout from "./auth/AuthLayout";
import AuthLayout from "./pages/AuthLayout";
import Dashboard from "./dashboard/Dashboard";
import HRDashboard from "./dashboard/HRDashboard";
import "./assets/global.css";

export default function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    console.log("✅ Login successful in App:", userData);
    setUser(userData);
  };

  const handleLogout = () => {
    console.log("👋 Logging out...");
    localStorage.removeItem("currentUser");
    setUser(null);
  };

  // If user is authenticated, show appropriate dashboard
  if (user) {
    // Route to HR dashboard for HR/ADMIN roles
    if (user.role === "HR" || user.role === "ADMIN") {
      return <HRDashboard user={user} onLogout={handleLogout} />;
    }
    
    // Route to employee dashboard
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  // Show auth layout if not authenticated
  return <AuthLayout onLoginSuccess={handleLoginSuccess} />;
}