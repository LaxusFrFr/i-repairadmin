import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ import
import {
  FaBars,
  FaTachometerAlt,
  FaUser,
  FaUsers,
  FaTools,
  FaCalendarAlt,
  FaWrench,
  FaBriefcase,
  FaStore,
  FaCommentDots,
  FaCog,
  FaInfoCircle,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaChartBar,
} from "react-icons/fa";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Notification from "../components/Notification";
import { useNotification } from "../hooks/useNotification";

import "../styles/dashboard.css";
import "./profiles";
import "./users";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeMenu?: string; // ✅ allow passing active menu from child page
}

export default function DashboardLayout({ children, activeMenu }: DashboardLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [adminName, setAdminName] = useState<string>("Admin");
  const navigate = useNavigate(); // ✅ initialize router
  const notification = useNotification();

  useEffect(() => {
    const t = setTimeout(() => setReveal(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Fetch admin profile image and name
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists()) {
            const data = adminDoc.data();
            setProfileImage(data.profileImage || null);
            // Fetch admin name - same as dashboard greeting
            setAdminName(data.fullName || "Admin");
          }
        } catch (error) {
          console.error('Error fetching admin data:', error);
          setAdminName("Admin");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle drawer open with flip animation
  useEffect(() => {
    if (drawerOpen) {
      // Show iRepair logo for 1 second, then flip to profile picture
      const timer = setTimeout(() => {
        setShowProfilePicture(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Reset to logo when drawer closes
      setShowProfilePicture(false);
    }
  }, [drawerOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      notification.notify("You have been logged out.", "success");
      navigate("/"); // ✅ redirect to login
    } catch (error) {
      console.error("Logout error:", error);
      notification.notify("Failed to logout. Please try again.", "error");
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* 🍔 Hamburger */}
      <button
        className={`hamburger-btn ${drawerOpen ? "hide" : ""}`}
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
      >
        <FaBars />
      </button>

      {/* 👈 Drawer */}
      <aside className={`drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
        <div className="drawer-header">
          <div className="logo-container">
            <img 
              src="../../assets/images/i-repair.png" 
              alt="I-Repair Logo" 
              className={`logo ${showProfilePicture ? 'hidden' : ''}`} 
            />
            <img 
              src={profileImage || "../../assets/images/profile.png"} 
              alt="Admin Profile" 
              className={`profile-picture circular ${showProfilePicture ? 'visible' : ''}`} 
            />
          </div>
          <h1 className="title">I-Repair</h1>
          <div className="admin-name">{adminName}</div>
          <div className="subtitle">Admin</div>
        </div>

        <nav className="menu-panel">
          <div className="menu-section">
            <p className="menu-label">Overview</p>
            <button
              className={`menu-btn ${activeMenu === "dashboard" ? "active" : ""}`}
              onClick={() => {
                navigate("/dashboard"); // ✅ navigate instead of just state
                setDrawerOpen(false);
              }}
            >
              <FaTachometerAlt /> Dashboard
            </button>
            <button
              className={`menu-btn ${activeMenu === "analytics" ? "active" : ""}`}
              onClick={() => {
                navigate("/analytics");
                setDrawerOpen(false);
              }}
            >
              <FaChartBar /> Analytics
            </button>
          </div>

          <div className="menu-section">
            <p className="menu-label">Management</p>
            <button
              className={`menu-btn ${activeMenu === "profiles" ? "active" : ""}`}
              onClick={() => {
                navigate("/profiles"); // ✅ go to profiles
                setDrawerOpen(false);
              }}
            >
              <FaUser /> Profiles
            </button>
            <button
              className={`menu-btn ${activeMenu === "users" ? "active" : ""}`}
              onClick={() => navigate("/users")}
            >
              <FaUsers /> Clients
            </button>
            <button
              className={`menu-btn ${activeMenu === "technicians" ? "active" : ""}`}
              onClick={() => navigate("/technicians")}
            >
              <FaTools /> Technicians
            </button>
            <button
              className={`menu-btn ${activeMenu === "reports" ? "active" : ""}`}
              onClick={() => navigate("/reports")}
            >
              <FaExclamationTriangle /> Reports
            </button>
          </div>

          <div className="menu-section">
            <p className="menu-label">Operations</p>
            <button
              className={`menu-btn ${activeMenu === "appointments" ? "active" : ""}`}
              onClick={() => navigate("/appointments")}
            >
              <FaCalendarAlt /> Appointments
            </button>
            <button
              className={`menu-btn ${activeMenu === "repairs" ? "active" : ""}`}
              onClick={() => navigate("/repairs")}
            >
              <FaWrench /> Repairs
            </button>
            <button
              className={`menu-btn ${activeMenu === "freelance" ? "active" : ""}`}
              onClick={() => navigate("/freelance")}
            >
              <FaBriefcase /> Freelance
            </button>
            <button
              className={`menu-btn ${activeMenu === "shops" ? "active" : ""}`}
              onClick={() => navigate("/shops")}
            >
              <FaStore /> Shops
            </button>
          </div>

          <div className="menu-section">
            <p className="menu-label">System</p>
            <button
              className={`menu-btn ${activeMenu === "feedbacks" ? "active" : ""}`}
              onClick={() => navigate("/feedbacks")}
            >
              <FaCommentDots /> Feedbacks
            </button>
            <button
              className={`menu-btn ${activeMenu === "settings" ? "active" : ""}`}
              onClick={() => navigate("/settings")}
            >
              <FaCog /> Settings
            </button>
            <button
              className={`menu-btn ${activeMenu === "about" ? "active" : ""}`}
              onClick={() => navigate("/about")}
            >
              <FaInfoCircle /> About
            </button>
          </div>

          <button className="menu-btn logout" onClick={handleLogout}>
            <FaSignOutAlt /> Log Out
          </button>
        </nav>
      </aside>

      {/* Overlay */}
      {drawerOpen && <div className="overlay" onClick={() => setDrawerOpen(false)} />}

      {/* 🌐 Main content */}
      <main className={`dashboard-content ${reveal ? "reveal" : ""}`}>
        {children}
      </main>

      {/* Notification */}
      <Notification
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={notification.close}
      />
    </div>
  );
}