import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/adminlogin";

// Import pages directly to avoid lazy loading issues
import Dashboard from "./pages/dashboard";
import Profiles from "./pages/profiles";
import Users from "./pages/users";
import Technicians from "./pages/technicians";
import Freelance from "./pages/freelance";
import Shops from "./pages/shops";
import Reports from "./pages/reports";
import Appointments from "./pages/appointments";
import Repairs from "./pages/repairs";
import Analytics from "./pages/analytics";
import About from "./pages/about";
import Settings from "./pages/settings";
import Feedbacks from "./pages/feedbacks";
import Signup from "./pages/signup";

function App() {
  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') || 'default';
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-default', 'theme-dark');
    
    // Apply the saved theme class
    if (savedTheme === 'dark') {
      body.classList.add('theme-dark');
    } else {
      body.classList.add('theme-default');
    }
  }, []);

  return (
    <Routes>
      {/* 🔑 Login */}
      <Route path="/" element={<AdminLogin />} />

      {/* 🖥️ Admin Dashboard Routes (each page has its own DashboardLayout) */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profiles" element={<Profiles />} />
      <Route path="/users" element={<Users />} />
      <Route path="/technicians" element={<Technicians />} />
      <Route path="/freelance" element={<Freelance />} />
      <Route path="/shops" element={<Shops />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/repairs" element={<Repairs />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/about" element={<About />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/feedbacks" element={<Feedbacks />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;
