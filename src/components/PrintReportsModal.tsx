import React, { useState, useEffect } from 'react';
import { FaPrint, FaFileDownload, FaTimes, FaSpinner, FaChartLine, FaFileAlt, FaCog } from 'react-icons/fa';
import { db } from '../firebase/firebase';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { PrintService } from '../utils/printService';
import './PrintReportsModal.css';

interface AppointmentData {
  id: string;
  [key: string]: any;
  createdAt?: any;
  status?: any;
  category?: string;
  serviceType?: string;
}

interface SystemStats {
  totalUsers: number;
  totalTechnicians: number;
  totalShops: number;
  totalFreelancers: number;
  totalAppointments: number;
  pendingAppointments: number;
  acceptedAppointments: number;
  repairingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  activeRepairs: number;
  totalRepairs: number;
  monthlyTrends: Array<{ month: string; count: number }>;
  serviceCategories: Array<{ category: string; count: number }>;
  technicianStats: {
    shop: number;
    freelance: number;
  };
  averageRating: number;
  totalFeedbacks: number;
}

interface CustomReportOptions {
  includeUsers: boolean;
  includeTechnicians: boolean;
  includeAppointments: boolean;
  includeTrends: boolean;
  includeServices: boolean;
  includeCompletedRepairs: boolean;
}

interface PrintReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReportType = 'executive' | 'detailed' | 'custom';

export default function PrintReportsModal({ isOpen, onClose }: PrintReportsModalProps) {
  const [reportType, setReportType] = useState<ReportType>('executive');
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalTechnicians: 0,
    totalShops: 0,
    totalFreelancers: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    acceptedAppointments: 0,
    repairingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    activeRepairs: 0,
    totalRepairs: 0,
    monthlyTrends: [],
    serviceCategories: [],
    technicianStats: {
      shop: 0,
      freelance: 0
    },
    averageRating: 0,
    totalFeedbacks: 0
  });
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'quarter'>('all');
  
  const [customOptions, setCustomOptions] = useState<CustomReportOptions>({
    includeUsers: false,
    includeTechnicians: false,
    includeAppointments: false,
    includeTrends: false,
    includeServices: false,
    includeCompletedRepairs: false
  });

  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    
    const unsubscribers: (() => void)[] = [];

    // Fetch Users
    const usersQuery = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const activeUsers = snapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.isDeleted;
      });
      setStats(prev => ({ ...prev, totalUsers: activeUsers.length }));
    });
    unsubscribers.push(unsubUsers);

    // Fetch Technicians with detailed stats
    const techQuery = query(collection(db, 'technicians'));
    const unsubTech = onSnapshot(techQuery, async (snapshot) => {
      const activeTechs = snapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.isDeleted && 
               data.username && 
               data.status === 'approved';
      });
      
      // Count shop vs freelance technicians
      let shopCount = 0;
      let freelanceCount = 0;
      
      activeTechs.forEach(doc => {
        const data = doc.data();
        if (data.hasShop || data.type === 'shop') {
          shopCount++;
        } else if (!data.hasShop || data.type === 'freelance') {
          freelanceCount++;
        }
      });
      
      setStats(prev => ({ 
        ...prev, 
        totalTechnicians: activeTechs.length,
        totalFreelancers: freelanceCount,
        technicianStats: {
          shop: shopCount,
          freelance: freelanceCount
        }
      }));
    });
    unsubscribers.push(unsubTech);

    // Fetch Shops
    const shopsQuery = query(collection(db, 'shops'));
    const unsubShops = onSnapshot(shopsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalShops: snapshot.size }));
    });
    unsubscribers.push(unsubShops);

    // Fetch Feedbacks and Ratings
    const feedbacksQuery = query(collection(db, 'feedbacks'));
    const feedbacksSnapshot = collection(db, 'feedback');
    const ratingsQuery = query(collection(db, 'ratings'));
    
    Promise.all([
      getDocs(feedbacksQuery),
      getDocs(feedbacksSnapshot),
      getDocs(ratingsQuery)
    ]).then(([feedbacksSnap, feedbackSnap, ratingsSnap]) => {
      const totalFeedbacks = feedbacksSnap.size + feedbackSnap.size;
      
      // Calculate average rating
      let totalRating = 0;
      let ratingCount = 0;
      ratingsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.rating) {
          totalRating += data.rating;
          ratingCount++;
        }
      });
      const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 0;
      
      setStats(prev => ({ 
        ...prev, 
        totalFeedbacks,
        averageRating: parseFloat(averageRating.toString())
      }));
    });

    // Fetch Appointments with detailed status breakdown
    const appointmentsQuery = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const unsubAppointments = onSnapshot(appointmentsQuery, async (snapshot) => {
      const appointments: AppointmentData[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      
      let filteredAppointments = appointments;
      
      if (dateFilter === 'month') {
        filteredAppointments = appointments.filter(apt => {
          const aptDate = apt.createdAt?.toDate ? apt.createdAt.toDate() : new Date(apt.createdAt);
          return aptDate >= currentMonth;
        });
      } else if (dateFilter === 'quarter') {
        filteredAppointments = appointments.filter(apt => {
          const aptDate = apt.createdAt?.toDate ? apt.createdAt.toDate() : new Date(apt.createdAt);
          return aptDate >= currentQuarter;
        });
      }

      const total = filteredAppointments.length;
      const pending = filteredAppointments.filter(apt => {
        const status = apt.status?.global || apt.status;
        return status === 'Scheduled';
      }).length;
      
      const accepted = filteredAppointments.filter(apt => {
        const status = apt.status?.global || apt.status;
        return status === 'Accepted';
      }).length;
      
      const repairing = filteredAppointments.filter(apt => {
        const status = apt.status?.global || apt.status;
        return status === 'Repairing';
      }).length;
      
      const completed = filteredAppointments.filter(apt => {
        const status = apt.status?.global || apt.status;
        return status === 'Completed';
      }).length;

      const cancelled = filteredAppointments.filter(apt => {
        const status = apt.status?.global || apt.status;
        return status === 'Cancelled' || status === 'cancelled';
      }).length;

      const activeRepairs = pending + accepted + repairing;
      const totalRepairs = completed + cancelled;

      // Process monthly trends (last 12 months)
      const monthlyData: { [key: string]: number } = {};
      const currentDate = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData[monthKey] = 0;
      }

      appointments.forEach(apt => {
        if (apt.createdAt) {
          const date = apt.createdAt.toDate ? apt.createdAt.toDate() : new Date(apt.createdAt);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
          if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey]++;
          }
        }
      });

      const monthlyTrends = Object.entries(monthlyData).map(([month, count]) => ({ month, count }));

      // Count service categories
      const categoryCount: { [key: string]: number } = {};
      appointments.forEach(apt => {
        const category = apt.category || apt.serviceType || 'Other';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const serviceCategories = Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count
      }));

      setStats(prev => ({
        ...prev,
        totalAppointments: total,
        pendingAppointments: pending,
        acceptedAppointments: accepted,
        repairingAppointments: repairing,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        activeRepairs,
        totalRepairs,
        monthlyTrends,
        serviceCategories
      }));
    });
    unsubscribers.push(unsubAppointments);

    setTimeout(() => setLoading(false), 500);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isOpen, dateFilter]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      if (reportType === 'executive') {
        await PrintService.printExecutiveSummary(stats, { dateFilter });
      } else if (reportType === 'detailed') {
        await PrintService.printDetailedAnalytics(stats, { dateFilter });
      } else {
        await PrintService.printCustomReport(stats, customOptions, { dateFilter });
      }
    } catch (error) {
      console.error('Error printing:', error);
      alert('Failed to print report');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      if (reportType === 'executive') {
        PrintService.downloadExecutiveSummary(stats, { dateFilter });
      } else if (reportType === 'detailed') {
        PrintService.downloadDetailedAnalytics(stats, { dateFilter });
      } else {
        PrintService.downloadCustomReport(stats, customOptions, { dateFilter });
      }
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download report');
    } finally {
      setTimeout(() => setDownloading(false), 500);
    }
  };

  const toggleCustomOption = (key: keyof CustomReportOptions) => {
    setCustomOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  const totalSelected = reportType === 'custom' 
    ? Object.values(customOptions).filter(Boolean).length 
    : 0;

  return (
    <div className="print-modal-overlay" onClick={onClose}>
      <div className="print-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="print-modal-header">
          <div>
            <h2>📊 Print System Reports</h2>
            <p>Export analytics and system statistics</p>
          </div>
          <button className="print-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="print-modal-body">
          {/* Report Type Selection */}
          <div className="report-type-selection">
            <button
              className={`report-type-btn ${reportType === 'executive' ? 'active' : ''}`}
              onClick={() => setReportType('executive')}
            >
              <FaFileAlt />
              <span>Summary</span>
            </button>
            <button
              className={`report-type-btn ${reportType === 'detailed' ? 'active' : ''}`}
              onClick={() => setReportType('detailed')}
            >
              <FaChartLine />
              <span>Analytics</span>
            </button>
            <button
              className={`report-type-btn ${reportType === 'custom' ? 'active' : ''}`}
              onClick={() => setReportType('custom')}
            >
              <FaCog />
              <span>Custom</span>
            </button>
          </div>

          {/* Date Filter */}
          <div className="print-filters">
            <div className="print-filter-group">
              <label>Date Range</label>
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="print-select"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          {/* Custom Report Options */}
          {reportType === 'custom' && (
            <div className="custom-options">
              <h4>Select data to include:</h4>
              <div className="custom-grid">
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={customOptions.includeUsers}
                    onChange={() => toggleCustomOption('includeUsers')}
                  />
                  <span>Users</span>
                </label>
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={customOptions.includeTechnicians}
                    onChange={() => toggleCustomOption('includeTechnicians')}
                  />
                  <span>Technicians (Shops & Freelance)</span>
                </label>
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={customOptions.includeAppointments}
                    onChange={() => toggleCustomOption('includeAppointments')}
                  />
                  <span>Appointments</span>
                </label>
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={customOptions.includeCompletedRepairs}
                    onChange={() => toggleCustomOption('includeCompletedRepairs')}
                  />
                  <span>Completed Repairs</span>
                </label>
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={customOptions.includeTrends}
                    onChange={() => toggleCustomOption('includeTrends')}
                  />
                  <span>Monthly Trends</span>
                </label>
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={customOptions.includeServices}
                    onChange={() => toggleCustomOption('includeServices')}
                  />
                  <span>Service Categories</span>
                </label>
              </div>
              <p className="custom-info">
                Selected: {totalSelected} section{totalSelected !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {loading ? (
            <div className="print-loading">
              <FaSpinner className="spinner" />
              <p>Loading system data...</p>
            </div>
          ) : (
            <>
              {/* Preview Info */}
              <div className="print-preview-info">
                {reportType === 'executive' && (
                  <div>
                    <h4>📄 Summary Report</h4>
                    <p>Quick overview of your entire system</p>
                    <ul>
                      <li>✓ User & technician statistics</li>
                      <li>✓ Appointments overview</li>
                      <li>✓ Active repairs summary</li>
                    </ul>
                  </div>
                )}
                
                {reportType === 'detailed' && (
                  <div>
                    <h4>📊 Analytics Report</h4>
                    <p>Detailed analysis with trends and insights</p>
                    <ul>
                      <li>✓ All executive summary data</li>
                      <li>✓ 12-month appointment trends</li>
                      <li>✓ Service category breakdown</li>
                    </ul>
                  </div>
                )}

                {reportType === 'custom' && (
                  <div>
                    <h4>⚙️ Custom Report</h4>
                    <p>Personalized report with your selected sections</p>
                    <p className="custom-warning">
                      {totalSelected === 0 
                        ? '⚠️ Please select at least one section' 
                        : `✓ ${totalSelected} section${totalSelected !== 1 ? 's' : ''} selected`}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Stats Preview */}
              {(reportType === 'executive' || reportType === 'detailed') && (
                <div className="quick-stats-preview">
                  <div className="quick-stat">
                    <span className="quick-stat-label">Users:</span>
                    <span className="quick-stat-value">{stats.totalUsers}</span>
                  </div>
                  <div className="quick-stat">
                    <span className="quick-stat-label">Technicians:</span>
                    <span className="quick-stat-value">{stats.totalTechnicians}</span>
                  </div>
                  <div className="quick-stat">
                    <span className="quick-stat-label">Appointments:</span>
                    <span className="quick-stat-value">{stats.totalAppointments}</span>
                  </div>
                  <div className="quick-stat">
                    <span className="quick-stat-label">Completed:</span>
                    <span className="quick-stat-value" style={{ color: '#10b981' }}>
                      {stats.completedAppointments}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="print-modal-actions">
            <button
              className="print-action-btn print-btn"
              onClick={handlePrint}
              disabled={loading || printing || (reportType === 'custom' && totalSelected === 0)}
            >
              {printing ? <FaSpinner className="spinner" /> : <FaPrint />}
              {printing ? 'Generating...' : 'Print Report'}
            </button>
            <button
              className="print-action-btn download-btn"
              onClick={handleDownload}
              disabled={loading || downloading || (reportType === 'custom' && totalSelected === 0)}
            >
              {downloading ? <FaSpinner className="spinner" /> : <FaFileDownload />}
              {downloading ? 'Downloading...' : 'Download as HTML'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
