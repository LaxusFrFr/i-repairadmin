import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import DashboardLayout from "./dashboardlayout";
import { FaChartBar, FaCalendarAlt, FaCheckCircle, FaClock, FaTimes } from "react-icons/fa";
import "../styles/analytics.css";

interface AppointmentStatusData {
  month: string;
  pending: number;
  completed: number;
  cancelled: number;
  rejected: number;
  total: number;
}

interface AnalyticsData {
  appointmentStatusByMonth: AppointmentStatusData[];
  totalStats: {
    totalAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    rejectedAppointments: number;
    successRate: number;
  };
}

export default function Analytics() {
  const [isSuccessRateModalOpen, setIsSuccessRateModalOpen] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);
  const [applianceSuccessRates, setApplianceSuccessRates] = useState<any>({});
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    appointmentStatusByMonth: [],
    totalStats: {
      totalAppointments: 0,
      pendingAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      rejectedAppointments: 0,
      successRate: 0
    }
  });

  useEffect(() => {
    // Animation initialized
    return () => {};
  }, []);

  // Fetch appointment status analytics
  useEffect(() => {
    const fetchAppointmentStatusAnalytics = async () => {
      try {
        console.log('🔍 Starting appointment status analytics fetch...');
        
        const appointmentsQuery = query(
          collection(db, "appointments"),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(appointmentsQuery, (snapshot: any) => {
          console.log('📊 Appointment status snapshot received:', snapshot.size, 'appointments');
          const appointments = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          })) as any[];

          // Process appointment status by month - REAL DATA (12 months)
          const monthlyStatusData: { [key: string]: { pending: number; completed: number; cancelled: number; rejected: number; total: number } } = {};
          const currentDate = new Date();
          
          // Initialize all 12 months
          for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            monthlyStatusData[monthKey] = { pending: 0, completed: 0, cancelled: 0, rejected: 0, total: 0 };
          }

          console.log('📅 Initialized months for status:', Object.keys(monthlyStatusData));

          // Count appointments by status and month with correct status mapping
          appointments.forEach(apt => {
            if (apt.createdAt) {
              const date = apt.createdAt.toDate ? apt.createdAt.toDate() : new Date(apt.createdAt);
              const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
              
              if (monthlyStatusData.hasOwnProperty(monthKey)) {
                const status = apt.status?.global || apt.status || 'Scheduled';
                monthlyStatusData[monthKey].total++;
                
                if (status === 'Completed') {
                  monthlyStatusData[monthKey].completed++;
                } else if (status === 'Cancelled') {
                  monthlyStatusData[monthKey].cancelled++;
                } else if (status === 'Rejected') {
                  monthlyStatusData[monthKey].rejected++;
                } else {
                  // Pending includes: Scheduled, Accepted, Repairing, Testing
                  monthlyStatusData[monthKey].pending++;
                }
              }
            }
          });

          console.log('📊 Real monthly status data:', monthlyStatusData);

          const appointmentStatusByMonth = Object.entries(monthlyStatusData).map(([month, data]) => ({
            month,
            pending: data.pending,
            completed: data.completed,
            cancelled: data.cancelled,
            rejected: data.rejected,
            total: data.total
          }));

          // Calculate total stats with proper status mapping
          const totalAppointments = appointments.length;
          
          // Count appointments by actual status
          const pendingAppointments = appointments.filter(apt => {
            const status = apt.status?.global || apt.status || 'Scheduled';
            return ['Scheduled', 'Accepted', 'Repairing', 'Testing'].includes(status);
          }).length;
          
          const completedAppointments = appointments.filter(apt => {
            const status = apt.status?.global || apt.status || 'Scheduled';
            return status === 'Completed';
          }).length;
          
          const rejectedAppointments = appointments.filter(apt => {
            const status = apt.status?.global || apt.status || 'Scheduled';
            return status === 'Rejected';
          }).length;
          
          const cancelledAppointments = appointments.filter(apt => {
            const status = apt.status?.global || apt.status || 'Scheduled';
            return status === 'Cancelled';
          }).length;
          
          // Professional Success Rate: Based on technician acceptance rate
          // Success = When technician accepts appointment (Accepted, Repairing, Testing, Completed)
          // This reflects technician engagement and business growth
          const acceptedAppointments = appointments.filter(apt => {
            const status = apt.status?.global || apt.status || 'Scheduled';
            return ['Accepted', 'Repairing', 'Testing', 'Completed'].includes(status);
          }).length;
          
          const totalBookedAppointments = appointments.filter(apt => {
            const status = apt.status?.global || apt.status || 'Scheduled';
            return !['Cancelled'].includes(status); // Exclude only user cancellations
          }).length;
          
          // Professional Success Rate: Acceptance rate (technician engagement)
          const successRate = totalBookedAppointments > 0 ? 
            Math.round((acceptedAppointments / totalBookedAppointments) * 100) : 0;

          // Calculate appliance-specific success rates
          const applianceCategories = ['Television', 'Electric Fan', 'Air Conditioner', 'Refrigerator', 'Washing Machine'];
          const applianceStats: any = {};
          
          applianceCategories.forEach(category => {
            const categoryAppointments = appointments.filter(apt => {
              const aptCategory = apt.diagnosisData?.category || apt.diagnosis?.category || '';
              return aptCategory.toLowerCase() === category.toLowerCase();
            });
            
            if (categoryAppointments.length > 0) {
              const accepted = categoryAppointments.filter(apt => {
                const status = apt.status?.global || apt.status || 'Scheduled';
                return ['Accepted', 'Repairing', 'Testing', 'Completed'].includes(status);
              }).length;
              
              const rejected = categoryAppointments.filter(apt => {
                const status = apt.status?.global || apt.status || 'Scheduled';
                return status === 'Rejected';
              }).length;
              
              const totalBooked = categoryAppointments.filter(apt => {
                const status = apt.status?.global || apt.status || 'Scheduled';
                return !['Cancelled'].includes(status);
              }).length;
              
              const categorySuccessRate = totalBooked > 0 ? Math.round((accepted / totalBooked) * 100) : 0;
              
              applianceStats[category] = {
                total: categoryAppointments.length,
                accepted,
                rejected,
                successRate: categorySuccessRate
              };
            } else {
              applianceStats[category] = {
                total: 0,
                accepted: 0,
                rejected: 0,
                successRate: 0
              };
            }
          });

          console.log('📈 Appointment status analytics:', {
            totalAppointments,
            pendingAppointments,
            completedAppointments,
            cancelledAppointments,
            successRate
          });

          console.log('🔧 Appliance success rates:', applianceStats);

          setAnalytics({
            appointmentStatusByMonth,
            totalStats: {
              totalAppointments,
              pendingAppointments,
              completedAppointments,
              cancelledAppointments,
              rejectedAppointments,
              successRate
            }
          });
          
          setApplianceSuccessRates(applianceStats);
          
          console.log('✅ Appointment status analytics data set successfully');
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching appointment status analytics:', error);
      }
    };

    fetchAppointmentStatusAnalytics();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Success Rate Modal Handlers
  const handleSuccessRateMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    const timeout = setTimeout(() => {
      setIsSuccessRateModalOpen(true);
    }, 500);
    setHoverTimeout(timeout);
  };

  const handleSuccessRateMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    if (!isSuccessRateModalOpen) {
      const timeout = setTimeout(() => {
        setIsSuccessRateModalOpen(false);
      }, 200);
      setHoverTimeout(timeout);
    }
  };

  const handleSuccessRateModalMouseLeave = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsSuccessRateModalOpen(false);
      setIsFadingOut(false);
    }, 300);
  };

  return (
    <DashboardLayout activeMenu="analytics">
      <div className="analytics-container">
        <div className="header-section">
          <h2 className="page-title">📊 Analytics</h2>
          <p className="page-subtitle">Comprehensive insights and data visualization for your repair business.</p>
        </div>

        <main className="analytics-wrapper">
          {/* Analytics Cards */}
          <div className="analytics-card">
            <h2>
              <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <FaChartBar />
              </div>
              Monthly Service Request Analysis
            </h2>
            <p className="analytics-description">
              Track monthly service request trends, completion rates, and technician performance metrics to optimize service delivery and resource allocation.
            </p>
            
            {/* Stacked Bar Chart */}
            <div className="chart-container">
              <div className="stacked-bar-chart">
                {/* Y-axis labels */}
                <div className="y-axis-labels">
                  {[100, 75, 50, 25, 0].map((value, index) => (
                    <div key={index} className="y-axis-label">{value}</div>
                  ))}
                </div>
                
                {/* Chart area */}
                <div className="chart-area">
                  {analytics.appointmentStatusByMonth.map((data, index) => {
                    const maxValue = Math.max(...analytics.appointmentStatusByMonth.map(d => d.total));
                    const pendingHeight = (data.pending / maxValue) * 100;
                    const completedHeight = (data.completed / maxValue) * 100;
                    const cancelledHeight = (data.cancelled / maxValue) * 100;
                    const rejectedHeight = (data.rejected / maxValue) * 100;
                    
                    return (
                      <div key={index} className="bar-container">
                        <div className="stacked-bar">
                          {/* Pending (bottom) */}
                          {data.pending > 0 && (
                            <div 
                              className="bar-segment pending"
                              style={{ height: `${pendingHeight}%` }}
                              title={`Pending: ${data.pending}`}
                            >
                              <span className="bar-value">{data.pending}</span>
                            </div>
                          )}
                          
                          {/* Completed (middle) */}
                          {data.completed > 0 && (
                            <div 
                              className="bar-segment completed"
                              style={{ height: `${completedHeight}%` }}
                              title={`Completed: ${data.completed}`}
                            >
                              <span className="bar-value">{data.completed}</span>
                            </div>
                          )}
                          
                          {/* Cancelled (top) */}
                          {data.cancelled > 0 && (
                            <div 
                              className="bar-segment cancelled"
                              style={{ height: `${cancelledHeight}%` }}
                              title={`Cancelled: ${data.cancelled}`}
                            >
                              <span className="bar-value">{data.cancelled}</span>
                            </div>
                          )}
                          
                          {/* Rejected (top) */}
                          {data.rejected > 0 && (
                            <div 
                              className="bar-segment rejected"
                              style={{ height: `${rejectedHeight}%` }}
                              title={`Rejected: ${data.rejected}`}
                            >
                              <span className="bar-value">{data.rejected}</span>
                            </div>
                          )}
                        </div>
                        <div className="x-axis-label">{data.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chart Legend - Inside Card */}
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color pending"></div>
                <span>Pending</span>
              </div>
              <div className="legend-item">
                <div className="legend-color completed"></div>
                <span>Completed</span>
              </div>
              <div className="legend-item">
                <div className="legend-color cancelled"></div>
                <span>Declined</span>
              </div>
              <div className="legend-item">
                <div className="legend-color rejected"></div>
                <span>Rejected</span>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="analytics-stats-overview">
              <div className="analytics-stat-item">
                <div className="analytics-stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                  <FaCalendarAlt />
                </div>
                <div className="analytics-stat-content">
                  <div className="analytics-stat-number">{analytics.totalStats.totalAppointments}</div>
                  <div className="analytics-stat-label">Total Appointments</div>
                </div>
              </div>
              
              <div className="analytics-stat-item">
                <div className="analytics-stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                  <FaClock />
                </div>
                <div className="analytics-stat-content">
                  <div className="analytics-stat-number">{analytics.totalStats.pendingAppointments}</div>
                  <div className="analytics-stat-label">Pending</div>
                </div>
              </div>
              
              <div className="analytics-stat-item">
                <div className="analytics-stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                  <FaCheckCircle />
                </div>
                <div className="analytics-stat-content">
                  <div className="analytics-stat-number">{analytics.totalStats.completedAppointments}</div>
                  <div className="analytics-stat-label">Completed</div>
                </div>
              </div>
              
              <div className="analytics-stat-item">
                <div className="analytics-stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)' }}>
                  <FaTimes />
                </div>
                <div className="analytics-stat-content">
                  <div className="analytics-stat-number">{analytics.totalStats.cancelledAppointments}</div>
                  <div className="analytics-stat-label">Cancelled</div>
                </div>
              </div>
              
              <div className="analytics-stat-item">
                <div className="analytics-stat-icon" style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)' }}>
                  <FaTimes />
                </div>
                <div className="analytics-stat-content">
                  <div className="analytics-stat-number">{analytics.totalStats.rejectedAppointments || 0}</div>
                  <div className="analytics-stat-label">Rejected</div>
                </div>
              </div>
              
              <div 
                className="analytics-stat-item success-rate"
                onMouseEnter={handleSuccessRateMouseEnter}
                onMouseLeave={handleSuccessRateMouseLeave}
                style={{ cursor: 'pointer' }}
              >
                <div className="analytics-stat-icon" style={{ background: 'linear-gradient(135deg, #a8edea, #fed6e3)' }}>
                  <FaChartBar />
                </div>
                <div className="analytics-stat-content">
                  <div className="analytics-stat-number">{analytics.totalStats.successRate}%</div>
                  <div className="analytics-stat-label">Success Rate</div>
                </div>
              </div>
          </div>

        </main>
      </div>

      {/* Success Rate Modal */}
      {isSuccessRateModalOpen && (
        <div 
          className="chart-modal-overlay"
          onClick={() => setIsSuccessRateModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div 
            className="chart-modal-content"
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={handleSuccessRateModalMouseLeave}
            style={{
              background: 'rgba(40, 40, 40, 0.98)',
              borderRadius: '16px',
              padding: '30px',
              width: '90vw',
              maxWidth: '1200px',
              height: '80vh',
              maxHeight: '700px',
              position: 'relative',
              boxShadow: 'none',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              animation: isFadingOut ? 'fadeOut 0.3s ease-out' : 'slideIn 0.4s ease-out',
              opacity: isFadingOut ? 0 : 1,
              transition: 'opacity 0.3s ease-out'
            }}
          >
            {/* Modal Title */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ color: '#fff', fontSize: '24px', margin: '0 0 5px 0', fontWeight: '600' }}>
                Appliance Success Rate Analytics
              </h2>
              <p style={{ color: '#aaa', fontSize: '14px', margin: '0' }}>
                Success rate breakdown by appliance category based on technician acceptance
              </p>
            </div>

            {/* Appliance Success Rates Pyramid Layout */}
            <div style={{ 
              height: 'calc(100% - 100px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '30px',
              padding: '20px'
            }}>
              {/* Top Row - 2 Appliances */}
              <div style={{
                display: 'flex',
                gap: '40px',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {['Television', 'Electric Fan'].map((appliance) => {
                  const data = applianceSuccessRates[appliance];
                  return (
                    <div key={appliance} style={{
                      background: 'rgba(60, 60, 60, 0.8)',
                      border: '1px solid rgba(100, 100, 100, 0.3)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      minWidth: '250px'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getApplianceColor(appliance)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '15px',
                        fontSize: '24px',
                        color: '#fff'
                      }}>
                        {getApplianceIcon(appliance)}
                      </div>
                      
                      <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 10px 0', fontWeight: '600' }}>
                        {appliance}
                      </h3>
                      
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#4ade80', marginBottom: '10px' }}>
                        {data?.successRate || 0}%
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#bbb', marginBottom: '15px' }}>
                        Success Rate
                      </div>
                      
                      <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#aaa' }}>
                        <div>
                          <div style={{ color: '#4ade80', fontWeight: '600' }}>{data?.accepted || 0}</div>
                          <div>Accepted</div>
                        </div>
                        <div>
                          <div style={{ color: '#f87171', fontWeight: '600' }}>{data?.rejected || 0}</div>
                          <div>Rejected</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontWeight: '600' }}>{data?.total || 0}</div>
                          <div>Total</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Row - 3 Appliances */}
              <div style={{
                display: 'flex',
                gap: '30px',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {['Air Conditioner', 'Refrigerator', 'Washing Machine'].map((appliance) => {
                  const data = applianceSuccessRates[appliance];
                  return (
                    <div key={appliance} style={{
                      background: 'rgba(60, 60, 60, 0.8)',
                      border: '1px solid rgba(100, 100, 100, 0.3)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      minWidth: '250px'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getApplianceColor(appliance)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '15px',
                        fontSize: '24px',
                        color: '#fff'
                      }}>
                        {getApplianceIcon(appliance)}
                      </div>
                      
                      <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 10px 0', fontWeight: '600' }}>
                        {appliance}
                      </h3>
                      
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#4ade80', marginBottom: '10px' }}>
                        {data?.successRate || 0}%
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#bbb', marginBottom: '15px' }}>
                        Success Rate
                      </div>
                      
                      <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#aaa' }}>
                        <div>
                          <div style={{ color: '#4ade80', fontWeight: '600' }}>{data?.accepted || 0}</div>
                          <div>Accepted</div>
                        </div>
                        <div>
                          <div style={{ color: '#f87171', fontWeight: '600' }}>{data?.rejected || 0}</div>
                          <div>Rejected</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontWeight: '600' }}>{data?.total || 0}</div>
                          <div>Total</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Helper functions for appliance icons and colors
const getApplianceIcon = (appliance: string) => {
  const icons: { [key: string]: string } = {
    'Television': '📺',
    'Electric Fan': '🌀',
    'Air Conditioner': '❄️',
    'Refrigerator': '🧊',
    'Washing Machine': '🌊'
  };
  return icons[appliance] || '🔧';
};

const getApplianceColor = (appliance: string) => {
  const colors: { [key: string]: string } = {
    'Television': '#667eea, #764ba2',
    'Electric Fan': '#f093fb, #f5576c',
    'Air Conditioner': '#4facfe, #00f2fe',
    'Refrigerator': '#fa709a, #fee140',
    'Washing Machine': '#ff6b6b, #ee5a52'
  };
  return colors[appliance] || '#a8edea, #fed6e3';
};
