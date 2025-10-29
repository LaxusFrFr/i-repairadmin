import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import DashboardLayout from "./dashboardlayout";
import "../styles/repairs.css";
import { 
  FaUser, 
  FaTools, 
  FaClock, 
  FaTimes,
  FaEye,
  FaSearch,
  FaFilter,
  FaWrench,
  FaCogs,
  FaExclamationCircle
} from "react-icons/fa";

interface RepairData {
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
    phone?: string;
    rating?: number;
    experience?: string;
    shopName?: string;
    distance?: number;
  };
  userDetails?: {
    name: string;
    phone?: string;
    email?: string;
  };
  serviceLocation?: string;
  userLocation?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };

  // Repair progress timestamps
  arrivalTime?: any;
  repairStartedAt?: any;
  testingStartedAt?: any;
  completedAt?: any;

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

export default function Repairs() {
  const [repairs, setRepairs] = useState<RepairData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRepair, setSelectedRepair] = useState<RepairData | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Helper function to fetch user and technician details
  const fetchUserAndTechnicianDetails = async (appointment: any) => {
    try {
      let userData = null;
      let technicianData = null;

      // Fetch user details if not present
      if (!appointment.userInfo && !appointment.userDetails && appointment.userId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', appointment.userId));
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }

      // Fetch technician details if not present
      if (!appointment.technicianInfo && !appointment.technicianDetails && appointment.technicianId) {
        try {
          const technicianDoc = await getDoc(doc(db, 'technicians', appointment.technicianId));
          if (technicianDoc.exists()) {
            technicianData = technicianDoc.data();
          }
        } catch (error) {
          console.error('Error fetching technician details:', error);
        }
      }

      return {
        ...appointment,
        userInfo: appointment.userInfo || userData ? {
          username: userData?.username || userData?.name || 'Unknown',
          email: userData?.email || 'N/A',
          phone: userData?.phone || 'N/A'
        } : undefined,
        technicianInfo: appointment.technicianInfo || technicianData ? {
          username: technicianData?.username || technicianData?.name || technicianData?.fullName || 'Unknown',
          email: technicianData?.email || 'N/A',
          phone: technicianData?.phone || 'N/A'
        } : undefined,
        userDetails: appointment.userDetails || userData ? {
          name: userData?.username || userData?.name || 'Unknown',
          email: userData?.email || 'N/A',
          phone: userData?.phone || 'N/A'
        } : undefined,
        technicianDetails: appointment.technicianDetails || technicianData ? {
          name: technicianData?.username || technicianData?.name || technicianData?.fullName || 'Unknown',
          phone: technicianData?.phone || 'N/A',
          rating: technicianData?.averageRating || technicianData?.rating || 0,
          experience: technicianData?.experience || 'N/A',
          shopName: technicianData?.shopName || 'N/A',
          distance: technicianData?.distance || 0
        } : undefined
      };
    } catch (error) {
      console.error('Error in fetchUserAndTechnicianDetails:', error);
      return appointment;
    }
  };

  useEffect(() => {
    // First try to fetch appointments with repair-related statuses
    const q = query(
      collection(db, "appointments"),
      where("status.global", "in", ["Repairing", "Testing", "Completed"]),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const appointments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // If no repair appointments found, show empty state
        if (appointments.length === 0) {
          console.log("No repair appointments found");
          setRepairs([]);
        } else {
          // Process appointments with user and technician details
          const processedAppointments = await Promise.all(
            appointments.map(appointment => fetchUserAndTechnicianDetails(appointment))
          );

          setRepairs(processedAppointments as RepairData[]);
        }
      } catch (error) {
        console.error("Error processing repairs:", error);
        // Don't set error state, just log it
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching repairs:", error);
      // Don't set error state, just log it
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredRepairs = repairs.filter((repair) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      repair.userInfo?.username?.toLowerCase()?.includes(searchLower) ||
      repair.userDetails?.name?.toLowerCase()?.includes(searchLower) ||
      repair.technicianInfo?.username?.toLowerCase()?.includes(searchLower) ||
      repair.technicianDetails?.name?.toLowerCase()?.includes(searchLower) ||
      (repair.deviceType && repair.deviceType.toLowerCase().includes(searchLower)) ||
      (repair.diagnosisData?.category && repair.diagnosisData.category.toLowerCase().includes(searchLower)) ||
      (repair.diagnosisData?.brand && repair.diagnosisData.brand.toLowerCase().includes(searchLower)) ||
      (repair.issue && repair.issue.toLowerCase().includes(searchLower)) ||
      (repair.diagnosisData?.issue && repair.diagnosisData.issue.toLowerCase().includes(searchLower)) ||
      (repair.diagnosisData?.issueDescription && repair.diagnosisData.issueDescription.toLowerCase().includes(searchLower));

    // Check if the filter matches status
    if (typeFilter === "all") {
      return matchesSearch;
    } else {
      // It's a status filter (Completed, Repairing, Testing)
      return matchesSearch && repair.status?.global === typeFilter;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "#4CAF50";
      case "Repairing":
        return "#FF9800";
      case "Testing":
        return "#2196F3";
      default:
        return "#666";
    }
  };

  const getRepairTypeIcon = (type: string) => {
    return type === "freelance" ? "👨‍🔧" : "🏪";
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="repairs">
        <div className="repairs-container">
          <div className="header-section">
            <h2 className="page-title">🔧 Repairs Management</h2>
            <p className="page-subtitle">Monitor active and completed technician repairs</p>
          </div>
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading repairs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="repairs">
      <div className="repairs-container">
        <div className="header-section">
          <h2 className="page-title">🔧 Repairs Management</h2>
          <p className="page-subtitle">Monitor active and completed technician repairs</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="controls-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search repairs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-box">
            <FaFilter className="filter-icon" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="Completed">Completed</option>
              <option value="Repairing">Repairing</option>
              <option value="Testing">Testing</option>
            </select>
          </div>
        </div>

        {/* Repairs Grid */}
        <div className="repairs-grid">
          {filteredRepairs.length === 0 ? (
            <div className="empty-state">
              <div className="repairs-empty-icon" style={{ background: 'linear-gradient(135deg, #a8edea, #fed6e3)' }}>
                <FaWrench />
              </div>
              <h3>No repairs found</h3>
              <p>No repairs match your current filters.</p>
            </div>
          ) : (
            filteredRepairs.map((repair) => (
              <div key={repair.id} className="repair-card">
                <div className="repair-header">
                  <div className="repair-id">#{repair.id.slice(0, 8)}</div>
                  <div 
                    className="repair-status"
                    style={{ backgroundColor: getStatusColor(repair.status.global) }}
                  >
                    {repair.status.global}
                  </div>
                </div>

                <div className="repair-content">
                  <div className="repair-info">
                    <div className="info-row">
                      <FaUser className="info-icon" />
                      <span className="info-label">User:</span>
                      <span className="info-value">
                        {repair.userInfo?.username || repair.userDetails?.name || "Unknown"}
                      </span>
                    </div>
                    
                    <div className="info-row">
                      <FaTools className="info-icon" />
                      <span className="info-label">Technician:</span>
                      <span className="info-value">
                        {repair.technicianInfo?.username || repair.technicianDetails?.name || "Unknown"}
                      </span>
                    </div>
                    
                    <div className="info-row">
                      <FaClock className="info-icon" />
                      <span className="info-label">Status:</span>
                      <span className="info-value">
                        {repair.status?.global || "Unknown"}
                      </span>
                    </div>
                    
                    <div className="info-row">
                      <FaCogs className="info-icon" />
                      <span className="info-label">Device:</span>
                      <span className="info-value">
                        {repair.deviceType || repair.diagnosisData?.category || "N/A"}
                      </span>
                    </div>
                    
                    <div className="info-row">
                      <FaExclamationCircle className="info-icon" />
                      <span className="info-label">Issue:</span>
                      <span className="info-value">
                        {repair.issue || 
                         repair.diagnosisData?.issueDescription || 
                         repair.diagnosisData?.issue || 
                         "N/A"}
                      </span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">Type:</span>
                      <span className="info-value">
                        {getRepairTypeIcon(repair.technicianType || "freelance")} {repair.technicianType || "freelance"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="repair-actions">
                  <button 
                    className="action-btn view-btn"
                    onClick={() => {
                      setSelectedRepair(repair);
                      setShowModal(true);
                    }}
                  >
                    <FaEye />
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Repair Details Modal */}
        {showModal && selectedRepair && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Repair Details</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="detail-section">
                  <h4>Repair Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">ID:</span>
                      <span className="detail-value">#{selectedRepair.id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span 
                        className="detail-value status"
                        style={{ color: getStatusColor(selectedRepair.status?.global || "Unknown") }}
                      >
                        {selectedRepair.status?.global || "Unknown"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Device:</span>
                      <span className="detail-value">
                        {selectedRepair.deviceType || selectedRepair.diagnosisData?.category || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Brand:</span>
                      <span className="detail-value">
                        {selectedRepair.diagnosisData?.brand || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Model:</span>
                      <span className="detail-value">
                        {selectedRepair.diagnosisData?.model || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Issue:</span>
                      <span className="detail-value">
                        {selectedRepair.issue || 
                         selectedRepair.diagnosisData?.issueDescription || 
                         selectedRepair.diagnosisData?.issue || 
                         "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Diagnosis:</span>
                      <span className="detail-value">
                        {selectedRepair.diagnosisData?.diagnosis || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Estimated Cost:</span>
                      <span className="detail-value">
                        {selectedRepair.diagnosisData?.estimatedCost ? `₱${selectedRepair.diagnosisData.estimatedCost}` : "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Service Type:</span>
                      <span className="detail-value">{selectedRepair.serviceType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Technician Type:</span>
                      <span className="detail-value">
                        {getRepairTypeIcon(selectedRepair.technicianType || "freelance")} {selectedRepair.technicianType || "freelance"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Repair Progress</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Scheduled:</span>
                      <span className="detail-value">
                        {selectedRepair.scheduledDate?.toDate?.()?.toLocaleDateString() || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Arrival Time:</span>
                      <span className="detail-value">
                        {selectedRepair.arrivalTime?.toDate?.()?.toLocaleString() || "Not started"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Repair Started:</span>
                      <span className="detail-value">
                        {selectedRepair.repairStartedAt?.toDate?.()?.toLocaleString() || "Not started"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Testing Started:</span>
                      <span className="detail-value">
                        {selectedRepair.testingStartedAt?.toDate?.()?.toLocaleString() || "Not started"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Completed:</span>
                      <span className="detail-value">
                        {selectedRepair.completedAt?.toDate?.()?.toLocaleString() || "Not completed"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>User Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">
                        {selectedRepair.userInfo?.username || selectedRepair.userDetails?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">
                        {selectedRepair.userInfo?.email || selectedRepair.userDetails?.email || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">
                        {selectedRepair.userInfo?.phone || selectedRepair.userDetails?.phone || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">
                        {selectedRepair.userLocation?.address || selectedRepair.serviceLocation || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Technician Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">
                        {selectedRepair.technicianInfo?.username || selectedRepair.technicianDetails?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">
                        {selectedRepair.technicianInfo?.email || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">
                        {selectedRepair.technicianInfo?.phone || selectedRepair.technicianDetails?.phone || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Rating:</span>
                      <span className="detail-value">
                        {selectedRepair.technicianDetails?.rating ? `${selectedRepair.technicianDetails.rating}/5` : "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Experience:</span>
                      <span className="detail-value">
                        {selectedRepair.technicianDetails?.experience || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Shop Name:</span>
                      <span className="detail-value">
                        {selectedRepair.technicianDetails?.shopName || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
