import React, { useState } from "react";
import "../styles/about.css";
import { FaInfoCircle, FaShieldAlt, FaCogs, FaUsers, FaChartLine, FaMobile, FaDesktop, FaFileAlt, FaEye } from "react-icons/fa";
import DashboardLayout from "./dashboardlayout";

export default function About() {
  const [currentCard, setCurrentCard] = useState(0);

  const cards = [
    {
      id: 0,
      title: "System Overview",
      content: (
        <div>
          <h3 className="section-title">System Overview</h3>
          <p className="section-text">
            I-Repair Admin is a comprehensive web-based management system designed to streamline 
            repair service operations. This platform provides administrators with powerful tools 
            to manage users, technicians, appointments, and analytics in a centralized dashboard.
          </p>
        </div>
      )
    },
    {
      id: 1,
      title: "Key Features",
      content: (
        <div>
          <h3 className="section-title">Key Features</h3>
          <div className="features-grid">
            <div className="feature-item">
              <FaUsers className="feature-icon" style={{ color: '#10b981' }} />
              <h4>Client Management</h4>
              <p>Comprehensive client account management with detailed profiles and activity tracking.</p>
            </div>
            <div className="feature-item">
              <FaCogs className="feature-icon" style={{ color: '#f59e0b' }} />
              <h4>Technician Management</h4>
              <p>Complete technician profile management with skill tracking and performance monitoring.</p>
            </div>
            <div className="feature-item">
              <FaChartLine className="feature-icon" style={{ color: '#3b82f6' }} />
              <h4>Analytics Dashboard</h4>
              <p>Real-time analytics and reporting with comprehensive data visualization tools.</p>
            </div>
            <div className="feature-item">
              <FaShieldAlt className="feature-icon" style={{ color: '#ef4444' }} />
              <h4>Security & Privacy</h4>
              <p>Advanced security measures with encrypted data storage and secure authentication.</p>
            </div>
            <div className="feature-item">
              <FaFileAlt className="feature-icon" style={{ color: '#8b5cf6' }} />
              <h4>Reports & Analytics</h4>
              <p>Comprehensive reporting system with detailed insights and performance metrics.</p>
            </div>
            <div className="feature-item">
              <FaEye className="feature-icon" style={{ color: '#06b6d4' }} />
              <h4>System Monitoring</h4>
              <p>Real-time system monitoring with alerts and performance tracking capabilities.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "System Architecture",
      content: (
        <div>
          <h3 className="section-title">System Architecture</h3>
          <p className="section-text">
            Built with modern web technologies including React, Firebase, and responsive design principles. 
            The system features real-time data synchronization, secure authentication, and scalable cloud infrastructure 
            to ensure optimal performance and reliability for enterprise operations.
          </p>
        </div>
      )
    },
    {
      id: 3,
      title: "Platform Support",
      content: (
        <div>
          <h3 className="section-title">Platform Support</h3>
          <div className="platform-support">
            <div className="platform-item">
              <FaDesktop className="platform-icon" style={{ color: '#8b5cf6' }} />
              <span>Web Admin Panel</span>
            </div>
            <div className="platform-item">
              <FaMobile className="platform-icon" style={{ color: '#06b6d4' }} />
              <span>Mobile App</span>
            </div>
          </div>
          <p className="section-text">
            Cross-platform compatibility ensures seamless management across desktop and mobile devices, 
            providing administrators with flexible access to system controls and monitoring capabilities.
          </p>
        </div>
      )
    },
    {
      id: 4,
      title: "Development",
      content: (
        <div>
          <h3 className="section-title">Development</h3>
          <p className="section-text">
            Developed by Laxus with a focus on scalability, security, and user experience. 
            The system is continuously updated with new features and improvements based on 
            user feedback and industry best practices.
          </p>
        </div>
      )
    }
  ];

  const handleCardClick = () => {
    setCurrentCard((prev) => (prev + 1) % cards.length);
  };
  return (
    <DashboardLayout activeMenu="about">
      <div className="about-container">
        <div className="header-section">
          <h2 className="page-title">
            <FaInfoCircle className="page-icon" style={{ color: '#667eea' }} />
            About
          </h2>
          <p className="page-subtitle">Comprehensive repair management system for administrators.</p>
        </div>

        <div className="about-content">
          <div className="card-stack">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`about-card ${index === currentCard ? 'active' : ''} ${index < currentCard ? 'behind' : ''}`}
                onClick={index === currentCard ? handleCardClick : undefined}
                style={{
                  zIndex: cards.length - Math.abs(index - currentCard),
                  transform: `translate(-50%, -50%) translateY(${(index - currentCard) * 20}px) scale(${1 - Math.abs(index - currentCard) * 0.08})`,
                  opacity: index === currentCard ? 1 : Math.abs(index - currentCard) > 0 ? 0.3 : 0.7,
                  filter: Math.abs(index - currentCard) > 0 ? 'blur(3px)' : 'none',
                  cursor: index === currentCard ? 'pointer' : 'default'
                }}
              >
                {card.content}
              </div>
            ))}
          </div>
          
          {/* Card Indicators */}
          <div className="card-indicators">
            {cards.map((_, index) => (
              <label key={index} className="radio-indicator">
                <input
                  type="radio"
                  name="card-selector"
                  checked={index === currentCard}
                  onChange={() => setCurrentCard(index)}
                  className="radio-input"
                />
                <span className="radio-custom"></span>
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="footer">
            <p className="footer-text">© 2025 I-Repair, All rights reserved</p>
            <p className="footer-text">Development by Laxus</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}