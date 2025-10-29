import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import DashboardLayout from "./dashboardlayout";
import { useConfirmation } from "../hooks/useConfirmation";
import "../styles/appointments.css";
import "../styles/diagnosis-modal.css";
import { 
  FaCalendarAlt, 
  FaUser, 
  FaClock, 
  FaTimes,
  FaSearch,
  FaFilter,
  FaCogs,
  FaExclamationCircle
} from "react-icons/fa";

interface AppointmentData {
  id: string;
  userId: string;
  technicianId: string;
  serviceType: string;
  deviceType?: string;
  issue?: string;
  scheduledDate: any;
  scheduledTime?: string;
  status: {
    global: string;
    technician?: string;
    userView?: string;
    technicianView?: string;
  };
  location?: string;
  createdAt: any;
  updatedAt?: any;
  
  // Mobile app structure fields
  diagnosisId?: string;
  diagnosisData?: {
    category: string;
    brand: string;
    model?: string;
    issue: string;
    issueDescription?: string;
    diagnosis?: string;
    estimatedCost?: number;
    isCustomIssue?: boolean;
  };
  technicianType?: string;
  technicianDetails?: {
    name: string;
    username?: string;
    email?: string;
    phone?: string;
    rating?: number;
    experience?: string;
    shopName?: string;
    distance?: number;
  };
  userDetails?: {
    name: string;
    username?: string;
    phone?: string;
    email?: string;
  };
  serviceLocation?: string;
  userLocation?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  cancelDeadline?: any;
  
  // Legacy fields for backward compatibility
  userInfo?: {
    username: string;
    email: string;
    phone?: string;
  };
  technicianInfo?: {
    username: string;
    email: string;
    phone?: string;
  };
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // Diagnosis modal state
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<AppointmentData["diagnosisData"] | null>(null);


  // Helper function to fetch user and technician details
  const fetchUserAndTechnicianDetails = async (appointment: any) => {
    try {
      let userInfo = appointment.userInfo || appointment.userDetails;
      let technicianInfo = appointment.technicianInfo || appointment.technicianDetails;

      // If we don't have user info, fetch from users collection
      if (!userInfo && appointment.userId) {
        try {
          const userDoc = await getDoc(doc(db, "users", appointment.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userInfo = {
              username: userData.username || userData.name || "Unknown",
              email: userData.email || "N/A",
              phone: userData.phone || "N/A"
            };
          }
        } catch (err) {
          console.warn("Could not fetch user details:", err);
        }
      }

      // If we don't have technician info, fetch from technicians collection
      if (!technicianInfo && appointment.technicianId) {
        try {
          const techDoc = await getDoc(doc(db, "technicians", appointment.technicianId));
          if (techDoc.exists()) {
            const techData = techDoc.data();
            technicianInfo = {
              username: techData.username || techData.name || "Unknown",
              email: techData.email || "N/A",
              phone: techData.phone || "N/A"
            };
          }
        } catch (err) {
          console.warn("Could not fetch technician details:", err);
        }
      }

      return {
        ...appointment,
        userInfo: userInfo ? {
          username: userInfo.username || userInfo.name || "Unknown",
          email: userInfo.email || "N/A",
          phone: userInfo.phone || "N/A"
        } : undefined,
        technicianInfo: technicianInfo ? {
          username: technicianInfo.username || technicianInfo.name || "Unknown",
          email: technicianInfo.email || "N/A",
          phone: technicianInfo.phone || "N/A"
        } : undefined
      };
    } catch (error) {
      console.error("Error fetching user/technician details:", error);
      return appointment;
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "appointments"), orderBy("createdAt", "desc")),
      async (snapshot) => {
        try {
          setError(null);
        const appointmentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AppointmentData[];

          // Process appointments to ensure we have user and technician info
          const processedAppointments = await Promise.all(
            appointmentsData.map(fetchUserAndTechnicianDetails)
          );

          setAppointments(processedAppointments);
          setLoading(false);
        } catch (err) {
          console.error("Error processing appointments:", err);
          setError("Failed to load appointments");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Firestore error:", error);
        setError("Failed to connect to database");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);


  const filteredAppointments = appointments.filter((appointment) => {
    const searchLower = searchTerm.toLowerCase();
    
    // Get user and technician names from different possible fields
    const userName = appointment.userInfo?.username || 
                    appointment.userDetails?.name || 
                    appointment.userDetails?.username || 
                    "Unknown";
    const techName = appointment.technicianInfo?.username || 
                    appointment.technicianDetails?.name || 
                    appointment.technicianDetails?.username || 
                    "Unknown";
    
    // Get device type and issue from different possible fields
    const deviceType = appointment.deviceType || 
                      appointment.diagnosisData?.category || 
                      appointment.diagnosisData?.brand || 
                      "";
    const issue = appointment.issue || 
                 appointment.diagnosisData?.issue || 
                 appointment.diagnosisData?.diagnosis || 
                 "";
    
    const matchesSearch = 
      userName.toLowerCase().includes(searchLower) ||
      techName.toLowerCase().includes(searchLower) ||
      deviceType.toLowerCase().includes(searchLower) ||
      issue.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === "all" || appointment.status?.global === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "#3b82f6";
      case "Accepted": return "#10b981";
      case "Repairing": return "#f59e0b";
      case "Testing": return "#8b5cf6";
      case "Completed": return "#059669";
      case "Rejected": return "#ef4444";
      case "Cancelled": return "#6b7280";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="appointments">
        <div className="appointments-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading appointments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeMenu="appointments">
        <div className="appointments-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Appointments</h3>
            <p>{error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="appointments">
      <div className="appointments-container">
        <div className="header-section">
          <h2 className="page-title">📅 Appointment Management</h2>
          <p className="page-subtitle">Manage and monitor all repair appointments</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="controls-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-box">
            <FaFilter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Appointments Grid */}
        <div className="appointments-grid">
          {filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="appointments-empty-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                <FaCalendarAlt />
              </div>
              <h3>No appointments found</h3>
              <p>No appointments match your current filters.</p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="appointment-card"
              >
                <div className="appointment-header">
                  <div className="appointment-meta">
                  <div className="appointment-id">#{appointment.id.slice(0, 8)}</div>
                    <div className="appointment-id">
                      Technician: {appointment.technicianInfo?.username || appointment.technicianDetails?.name || appointment.technicianDetails?.username || "Unknown"}
                    </div>
                  </div>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(appointment.status.global) }}
                  >
                    {appointment.status.global}
                  </div>
                </div>

                <div className="appointment-content">
                  <div className="appointment-info">
                    <div className="info-row">
                      <FaUser className="info-icon" />
                      <span className="info-label">User:</span>
                      <span className="info-value">
                        {appointment.userInfo?.username || 
                         appointment.userDetails?.name || 
                         appointment.userDetails?.username || 
                         "Unknown"}
                      </span>
                    </div>
                    
                    {/* Technician row removed per request */}
                    
                    <div className="info-row">
                      <FaClock className="info-icon" />
                      <span className="info-label">Scheduled:</span>
                      <span className="info-value">
                        {appointment.scheduledDate?.toDate?.()?.toLocaleDateString() || 
                         appointment.scheduledDate?.toLocaleDateString?.() || 
                         "N/A"} 
                        {appointment.scheduledTime && ` at ${appointment.scheduledTime}`}
                      </span>
                    </div>
                    
                    <div className="info-row">
                      <FaCogs className="info-icon" />
                      <span className="info-label">Device:</span>
                      <span className="info-value">
                        {appointment.deviceType || 
                         appointment.diagnosisData?.category || 
                         appointment.diagnosisData?.brand || 
                         "N/A"}
                      </span>
                    </div>
                    
                    <div className="info-row">
                      <FaExclamationCircle className="info-icon" />
                      <span className="info-label">Issue:</span>
                      <span className="info-value">
                        {appointment.issue || 
                         (appointment.diagnosisData as any)?.issueDescription || 
                         appointment.diagnosisData?.issue || 
                         "N/A"}
                      </span>
                    </div>
                  </div>
                  {/* View Diagnosis button directly under Issue */}
                  <div className="card-actions">
                  <button
                      className="view-details-inline"
                      onClick={async () => {
                        setDiagnosisError(null);
                        setDiagnosisLoading(true);
                        setShowDiagnosisModal(true);
                        try {
                          if (appointment.diagnosisData) {
                            setDiagnosisData(appointment.diagnosisData);
                          } else if (appointment.diagnosisId) {
                            const diagDoc = await getDoc(doc(db, 'diagnoses', appointment.diagnosisId));
                            if (diagDoc.exists()) {
                              const data: any = diagDoc.data();
                              setDiagnosisData({
                                category: data.category || data.deviceType || '',
                                brand: data.brand || data.model || '',
                                model: data.model,
                                issue: data.issueDescription || data.issue || '',
                                diagnosis: data.diagnosis || data.findings || '',
                                estimatedCost: data.estimatedCost,
                                isCustomIssue: data.isCustomIssue,
                              });
                            } else {
                              setDiagnosisError('Diagnosis not found.');
                            }
                          } else {
                            setDiagnosisError('No diagnosis information available for this appointment.');
                          }
                        } catch (e) {
                          console.error(e);
                          setDiagnosisError('Failed to load diagnosis.');
                        } finally {
                          setDiagnosisLoading(false);
                        }
                      }}
                    >
                      View Diagnosis
                    </button>
                  </div>
                </div>

                {/* Removed all extra detail sections per request */}

                {/* Card is clickable; no action buttons for view/accept/delete */}
              </div>
            ))
          )}
        </div>

        {/* Diagnosis Modal */}
        {showDiagnosisModal && (
          <div className="diag-modal-overlay" onClick={() => setShowDiagnosisModal(false)}>
            <div className="diag-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="diag-modal-header">
                <h3>Diagnosis Details</h3>
                <button className="diag-modal-close" onClick={() => setShowDiagnosisModal(false)}><FaTimes /></button>
              </div>
              <div className="diag-modal-body">
                {diagnosisLoading ? (
                  <div className="diag-loading">Loading diagnosis...</div>
                ) : diagnosisError ? (
                  <div className="diag-error">{diagnosisError}</div>
                ) : diagnosisData ? (
                  <div className="diag-grid">
                    <div className="diag-item"><span className="diag-label">Category:</span><span className="diag-value">{diagnosisData.category || 'N/A'}</span></div>
                    <div className="diag-item"><span className="diag-label">Brand/Model:</span><span className="diag-value">{[diagnosisData.brand, diagnosisData.model].filter(Boolean).join(' ') || 'N/A'}</span></div>
                    <div className="diag-item"><span className="diag-label">Issue:</span><span className="diag-value">{diagnosisData.issue || 'N/A'}</span></div>
                    <div className="diag-item"><span className="diag-label">Diagnosis:</span><span className="diag-value">{diagnosisData.diagnosis || 'N/A'}</span></div>
                    <div className="diag-item"><span className="diag-label">Estimated Price:</span><span className="diag-value">{diagnosisData.estimatedCost != null ? `₱${diagnosisData.estimatedCost}` : 'N/A'}</span></div>
                  </div>
                ) : (
                  <div className="diag-empty">No diagnosis data.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Appointment Details Modal removed */}

        {/* Diagnosis Modal removed to keep only the gray modal */}
      </div>
    </DashboardLayout>
  );
}




