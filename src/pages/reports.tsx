import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import DashboardLayout from "./dashboardlayout";
import ConfirmationModal from "../components/ConfirmationModal";
import { useConfirmation } from "../hooks/useConfirmation";
import "../styles/reports.css";
import { 
  FaExclamationTriangle, 
  FaUser, 
  FaTools, 
  FaClock, 
  FaFlag,
  FaTimes,
  FaEye,
  FaSearch,
  FaFilter
} from "react-icons/fa";
import { ReportService, ReportData } from '../services/reportService';

export default function Reports() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [technicianInfo, setTechnicianInfo] = useState<{[key: string]: any}>({});
  const confirmation = useConfirmation();

  useEffect(() => {
    const fetchTechInfo = async (reportsData: ReportData[]) => {
      // Fetch technician info for each report with status data
      const techInfo: {[key: string]: any} = {};
      for (const report of reportsData) {
        if (!techInfo[report.technicianId]) {
          try {
            const techDoc = await getDoc(doc(db, "technicians", report.technicianId));
            if (techDoc.exists()) {
              const data = techDoc.data();
              techInfo[report.technicianId] = {
                ...data,
                isBlocked: data.isBlocked || false,
                isBanned: data.isBanned || false,
                isSuspended: data.isSuspended || false,
                totalReports: data.totalReports || 0
              };
            } else {
              techInfo[report.technicianId] = { username: "Unknown", email: "N/A", isBlocked: false, isBanned: false, isSuspended: false, totalReports: 0 };
            }
          } catch (error) {
            console.error('Error fetching technician info:', error);
            techInfo[report.technicianId] = { username: "Unknown", email: "N/A", isBlocked: false, isBanned: false, isSuspended: false, totalReports: 0 };
          }
        }
      }
      setTechnicianInfo(techInfo);
    };

    // Set up real-time listener for reports
    const reportsQuery = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(reportsQuery, async (snapshot) => {
      const reportsData: ReportData[] = [];
      snapshot.forEach((doc) => {
        reportsData.push({
          id: doc.id,
          ...doc.data()
        } as ReportData);
      });
      
      setReports(reportsData);
      
      // Fetch technician info when reports change
      await fetchTechInfo(reportsData);
      
      setLoading(false);
    }, (error) => {
      console.error('Error listening to reports:', error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (reportId: string, status: 'pending' | 'reviewed' | 'resolved') => {
    try {
      await ReportService.updateReportStatus(reportId, status);
      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, status } : report
      ));
      setShowModal(false);
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Failed to update report status');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    const ok = await confirmation.confirm(
      "Delete Report",
      "Are you sure you want to delete this report? This action cannot be undone.",
      "danger"
    );
    if (ok) {
      try {
        await deleteDoc(doc(db, "reports", reportId));
        setReports(prev => prev.filter(report => report.id !== reportId));
      } catch (error) {
        console.error("Error deleting report:", error);
      }
    }
  };

  const filteredReports = reports.filter((report) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      technicianInfo[report.technicianId]?.username?.toLowerCase()?.includes(searchLower) ||
      (report.reason && report.reason.toLowerCase().includes(searchLower)) ||
      (report.userId && report.userId.toLowerCase().includes(searchLower));
    
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#ef4444";
      case "reviewed": return "#f59e0b";
      case "resolved": return "#10b981";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="reports">
        <div className="appointments-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="reports">
      <div className="appointments-container">
        <div className="header-section">
          <h2 className="page-title">🚩 Reports Management</h2>
          <p className="page-subtitle">Manage and monitor client reports about technicians</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="controls-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search reports..."
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
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="appointments-grid">
          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <div className="appointments-empty-icon" style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff8787)' }}>
                <FaExclamationTriangle />
              </div>
              <h3>No reports found</h3>
              <p>No reports match your current filters.</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} className="appointment-card">
                <div className="appointment-header">
                  <div className="appointment-id">#{report.id?.slice(0, 8) || "Unknown"}</div>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(report.status || 'pending') }}
                  >
                    {report.status || 'pending'}
                  </div>
                </div>

                <div className="appointment-content">
                  <div className="appointment-info">
                    <div className="info-row">
                      <FaTools className="info-icon" />
                      <span className="info-label">Technician:</span>
                      <span className="info-value">{technicianInfo[report.technicianId]?.username || "Unknown"}</span>
                      {technicianInfo[report.technicianId]?.isBanned && (
                        <span style={{ 
                          background: '#ef4444', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '10px',
                          fontWeight: '600',
                          marginLeft: '8px'
                        }}>BANNED</span>
                      )}
                      {technicianInfo[report.technicianId]?.isSuspended && (
                        <span style={{ 
                          background: '#ff9800', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '10px',
                          fontWeight: '600',
                          marginLeft: '8px'
                        }}>SUSPENDED</span>
                      )}
                      {technicianInfo[report.technicianId]?.isBlocked && !technicianInfo[report.technicianId]?.isBanned && (
                        <span style={{ 
                          background: '#f59e0b', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '10px',
                          fontWeight: '600',
                          marginLeft: '8px'
                        }}>BLOCKED</span>
                      )}
                      {technicianInfo[report.technicianId]?.totalReports >= 5 && (
                        <span style={{ 
                          background: '#9c27b0', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '10px',
                          fontWeight: '600',
                          marginLeft: '8px'
                        }}>{technicianInfo[report.technicianId]?.totalReports} REPORTS</span>
                      )}
                    </div>
                    
                    <div className="info-row">
                      <FaFlag className="info-icon" />
                      <span className="info-label">Report Reason:</span>
                      <span className="info-value" style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        maxWidth: '200px'
                      }}>{report.reason}</span>
                    </div>
                    
                    <div className="info-row">
                      <FaClock className="info-icon" />
                      <span className="info-label">Reported:</span>
                      <span className="info-value">
                        {report.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                      </span>
                    </div>
                    
                    <div className="info-row">
                      <FaUser className="info-icon" />
                      <span className="info-label">User ID:</span>
                      <span className="info-value">{report.userId?.slice(0, 8) || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="appointment-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={() => {
                      setSelectedReport(report);
                      setShowModal(true);
                    }}
                  >
                    <FaEye /> View Details
                  </button>
                  
                  {report.status !== 'resolved' && (
                    <button
                      className="action-btn accept-btn"
                      onClick={() => handleStatusUpdate(report.id!, 'resolved')}
                    >
                      <FaTimes /> Mark Resolved
                    </button>
                  )}
                  
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteReport(report.id!)}
                  >
                    <FaTimes /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Report Details Modal */}
        {showModal && selectedReport && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Report Details</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="detail-section">
                  <h4>Report Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">ID:</span>
                      <span className="detail-value">#{selectedReport.id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span 
                        className="detail-value status"
                        style={{ color: getStatusColor(selectedReport.status || 'pending') }}
                      >
                        {selectedReport.status || 'pending'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Technician ID:</span>
                      <span className="detail-value">{selectedReport.technicianId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">User ID:</span>
                      <span className="detail-value">{selectedReport.userId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Appointment ID:</span>
                      <span className="detail-value">{selectedReport.appointmentId || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Reported:</span>
                      <span className="detail-value">
                        {selectedReport.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Technician Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{technicianInfo[selectedReport.technicianId]?.username || "Unknown"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{technicianInfo[selectedReport.technicianId]?.email || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value">
                        {technicianInfo[selectedReport.technicianId]?.isBanned ? "BANNED" : 
                         technicianInfo[selectedReport.technicianId]?.isSuspended ? "SUSPENDED" :
                         technicianInfo[selectedReport.technicianId]?.isBlocked ? "BLOCKED" : "Active"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Reports:</span>
                      <span className="detail-value" style={{ color: technicianInfo[selectedReport.technicianId]?.totalReports >= 5 ? '#ef4444' : '#fff', fontWeight: 600 }}>
                        {technicianInfo[selectedReport.technicianId]?.totalReports || 0}
                      </span>
                    </div>
                    {technicianInfo[selectedReport.technicianId]?.isBlocked && (
                      <div className="detail-item">
                        <span className="detail-label">Blocked Reason:</span>
                        <span className="detail-value" style={{ color: '#ff6b6b' }}>
                          {technicianInfo[selectedReport.technicianId]?.blockedReason || "Due to reports"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Report Reason</h4>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    padding: '16px', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #ef4444'
                  }}>
                    <p style={{ color: '#fff', margin: 0, lineHeight: '1.6' }}>
                      {selectedReport.reason}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ 
                padding: '20px', 
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  className="action-btn accept-btn"
                  onClick={() => handleStatusUpdate(selectedReport.id!, 'reviewed')}
                >
                  <FaEye /> Mark Reviewed
                </button>
                <button
                  className="action-btn accept-btn"
                  onClick={() => handleStatusUpdate(selectedReport.id!, 'resolved')}
                >
                  <FaTimes /> Mark Resolved
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          confirmText="Confirm"
          cancelText="Cancel"
          type={confirmation.type}
          onConfirm={confirmation.handleConfirm}
          onCancel={confirmation.handleCancel}
        />
      </div>
    </DashboardLayout>
  );
}