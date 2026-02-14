import React, { useState, useEffect } from "react";
import AuthLayout from "./pages/AuthLayout";
import Dashboard from "./dashboard/Dashboard";
import HRDashboard from "./dashboard/HRDashboard";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleClick = () => {
      if (currentUser) {
        window.electron.trackMouseClick();
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [currentUser]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    console.log('User logged in:', user);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await window.electron.stopSession();
      localStorage.removeItem("currentUser");
    } catch (err) {
      console.error('Error stopping session:', err);
    }
    
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg)'
      }}>
        <div style={{ color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  if (currentUser) {
    if (currentUser.role === 'HR' || currentUser.role === 'ADMIN') {
      return <HRDashboard user={currentUser} onLogout={handleLogout} />;
    }
    
    return <Dashboard user={currentUser} onLogout={handleLogout} />;
  }

  return <AuthLayout onLoginSuccess={handleLoginSuccess} />;
}