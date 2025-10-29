import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import DashboardLayout from "./dashboardlayout";
import {
  FaUsers,
  FaTools,
  FaCalendarAlt,
  FaWrench,
  FaClock,
  FaCheckCircle,
  FaTv,
  FaWind,
  FaSnowflake,
  FaTint,
  FaCog,
  FaPrint,
  FaFlag,
} from "react-icons/fa";

import "../styles/dashboard.css";
import PrintReportsModal from "../components/PrintReportsModal";

interface DashboardStats {
  totalUsers: number;
  totalTechnicians: number;
  totalShops: number;
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  activeRepairs: number;
  totalReports: number;
}

interface AnalyticsData {
  repairRequestsByMonth: { month: string; count: number }[];
  serviceDistribution: { category: string; count: number; percentage: number; icon: any }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTechnicians: 0,
    totalShops: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    activeRepairs: 0,
    totalReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [adminName, setAdminName] = useState<string>('Admin');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    repairRequestsByMonth: [
      { month: 'Jan', count: 45 },
      { month: 'Feb', count: 52 },
      { month: 'Mar', count: 38 },
      { month: 'Apr', count: 67 },
      { month: 'May', count: 73 },
      { month: 'Jun', count: 89 },
      { month: 'Jul', count: 95 },
      { month: 'Aug', count: 82 },
      { month: 'Sep', count: 76 },
      { month: 'Oct', count: 91 },
      { month: 'Nov', count: 58 },
      { month: 'Dec', count: 43 }
    ],
    serviceDistribution: []
  });

  // Debug when Services modal opens
  useEffect(() => {
    if (isServicesModalOpen) {
      console.log('🔍 Expanded Modal - serviceDistribution data:', analytics.serviceDistribution);
      console.log('🔍 Expanded Modal - data length:', analytics.serviceDistribution.length);
    }
  }, [isServicesModalOpen, analytics.serviceDistribution]);

  // Debug analytics state changes
  useEffect(() => {
    console.log('📊 Analytics state updated:', analytics.serviceDistribution);
  }, [analytics.serviceDistribution]);

  useEffect(() => {
    const t = setTimeout(() => {
      // Reveal animation trigger
    }, 400);
    return () => clearTimeout(t);
  }, []);

  // Fetch admin data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            setAdminName(adminData.fullName || 'Admin');
          }
        } catch (error) {
          console.error('Error fetching admin data:', error);
          setAdminName('Admin');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Get greeting based on time of day (same as I-Repair app)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '🌅 Good morning';
    if (hour >= 12 && hour < 18) return '🌞 Good afternoon';
    return '🌙 Good evening';
  };

  // Get Manila date
  const getManilaDate = () => {
    const now = new Date();
    const manilaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    return manilaTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleChartMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    const timeout = setTimeout(() => {
      setIsChartExpanded(true);
    }, 500); // Increased delay to 500ms
    setHoverTimeout(timeout);
  };

  const handleChartMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    // Only close if not already expanded (prevent closing when modal is open)
    if (!isChartExpanded) {
      const timeout = setTimeout(() => {
        setIsChartExpanded(false);
      }, 200); // Shorter delay for closing
      setHoverTimeout(timeout);
    }
  };

  const handleChartClick = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setIsChartExpanded(true);
  };

  const handleServicesChartClick = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setIsServicesModalOpen(true);
  };

  const handleServicesMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    const timeout = setTimeout(() => {
      setIsServicesModalOpen(true);
    }, 500);
    setHoverTimeout(timeout);
  };

  const handleServicesMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    if (!isServicesModalOpen) {
      const timeout = setTimeout(() => {
        setIsServicesModalOpen(false);
      }, 200);
      setHoverTimeout(timeout);
    }
  };

  const handleModalMouseLeave = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsChartExpanded(false);
      setIsFadingOut(false);
    }, 300); // 300ms fade out duration
  };

  const handleServicesModalMouseLeave = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsServicesModalOpen(false);
      setIsFadingOut(false);
    }, 300); // 300ms fade out duration
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Real-time data fetching
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      // Only count users that are not deleted
      const activeUsers = snapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.isDeleted;
      });
      setStats(prev => ({ ...prev, totalUsers: activeUsers.length }));
    });

    const unsubscribeTechnicians = onSnapshot(collection(db, "technicians"), (snapshot) => {
      // Only count technicians that are properly registered and active
      const allTechnicians = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as any));
      
      const registeredTechnicians = allTechnicians.filter((tech: any) => {
        // Only count technicians that are fully registered and approved and not deleted
        return !tech.isDeleted &&
               tech.username && 
               tech.email && 
               (tech.status === 'approved' || tech.status === 'active' || tech.status === 'registered') &&
               !tech.isBlocked &&
               tech.submitted === true; // Ensure they've completed registration
      });
      
      // Debug logging
      console.log('🔍 All technicians:', allTechnicians.length);
      console.log('✅ Registered technicians:', registeredTechnicians.length);
      console.log('📋 All technician details:', allTechnicians.map((t: any) => ({
        username: t.username,
        email: t.email,
        status: t.status,
        submitted: t.submitted,
        isBlocked: t.isBlocked,
        isRegistered: (t.username && t.email && (t.status === 'approved' || t.status === 'active' || t.status === 'registered') && !t.isBlocked && t.submitted === true)
      })));
      
      setStats(prev => ({ ...prev, totalTechnicians: registeredTechnicians.length }));
    });

    const unsubscribeAppointments = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const appointments = snapshot.docs.map(doc => doc.data());
      const total = appointments.length;
      const pending = appointments.filter(apt => apt.status?.global === "Scheduled" || apt.status?.global === "Accepted").length;
      const completed = appointments.filter(apt => apt.status?.global === "Completed").length;
      const repairing = appointments.filter(apt => apt.status?.global === "Repairing" || apt.status?.global === "Testing").length;
      
      setStats(prev => ({
        ...prev,
        totalAppointments: total,
        pendingAppointments: pending,
        completedAppointments: completed,
        activeRepairs: repairing,
      }));
    });

    const unsubscribeReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      setStats(prev => ({ ...prev, totalReports: snapshot.size }));
    });

    setLoading(false);

    return () => {
      unsubscribeUsers();
      unsubscribeTechnicians();
      unsubscribeAppointments();
      unsubscribeReports();
    };
  }, []);

  // Analytics data fetching
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        console.log('🔍 Starting analytics fetch...');
        
        // Get all appointments first (simpler approach)
        const appointmentsQuery = query(
          collection(db, "appointments"),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(appointmentsQuery, (snapshot: any) => {
          console.log('📊 Analytics snapshot received:', snapshot.size, 'appointments');
          const appointments = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          })) as any[];

          console.log('📋 Processing appointments:', appointments.length);
          console.log('📋 Sample appointment data:', appointments.slice(0, 3));

          // Process repair requests by month - REAL DATA (12 months)
          const monthlyData: { [key: string]: number } = {};
          const currentDate = new Date();
          
          // Initialize all 12 months
          for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            monthlyData[monthKey] = 0;
          }

          console.log('📅 Initialized months:', Object.keys(monthlyData));

          // Count real appointments by month
          appointments.forEach(apt => {
            if (apt.createdAt) {
              const date = apt.createdAt.toDate ? apt.createdAt.toDate() : new Date(apt.createdAt);
              const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
              if (monthlyData.hasOwnProperty(monthKey)) {
                monthlyData[monthKey]++;
              }
            }
          });

          console.log('📊 Real monthly data:', monthlyData);

          const repairRequestsByMonth = Object.entries(monthlyData).map(([month, count]) => ({
            month,
            count: count || 0 // Use real data only, no fallback
          }));

          console.log('📈 Monthly data:', repairRequestsByMonth);

          // Process service distribution by appliance category - REAL DATA
          const categoryCounts: { [key: string]: number } = {};
          
          // Count actual categories from appointments
          appointments.forEach(apt => {
            const category = apt.diagnosisData?.category || 
                           apt.deviceInfo?.deviceType || 
                           apt.deviceType ||
                           apt.applianceType ||
                           apt.category;
            console.log('🔍 Appointment category found:', category, 'from appointment:', apt.id);
            
            if (category) {
              // Normalize category names
              const normalizedCategory = category.trim();
              if (normalizedCategory) {
                categoryCounts[normalizedCategory] = (categoryCounts[normalizedCategory] || 0) + 1;
              }
            }
          });

          console.log('📊 Real category counts from appointments:', categoryCounts);

          // Only include categories that have actual data and sort by count descending
          const categoriesWithData = Object.entries(categoryCounts)
            .filter(([category, count]) => count > 0)
            .sort(([,a], [,b]) => b - a); // Sort by count descending (highest first)

          const totalAppointments = appointments.length;
          console.log('📊 Total appointments for pie chart:', totalAppointments);
          console.log('📊 Categories with data:', categoriesWithData);

          // Calculate real percentages based on actual counts
          const totalCount = categoriesWithData.reduce((sum, [, count]) => sum + count, 0);
          console.log('📊 Total count for percentage calculation:', totalCount);
          console.log('📊 Percentage calculation check:');
          
          const serviceDistribution = categoriesWithData.map(([category, count]) => {
            const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            console.log(`📊 ${category}: ${count} appointments out of ${totalCount} total = ${percentage}%`);
            
            return {
              category,
              count,
              percentage,
              icon: getCategoryIcon(category)
            };
          });
          
          // Verify percentages add up to 100%
          const totalPercentage = serviceDistribution.reduce((sum, item) => sum + item.percentage, 0);
          console.log('📊 Total percentage check:', totalPercentage + '% (should be 100%)');

          // Sort by percentage descending (highest first) for proper pie chart order
          const sortedServiceDistribution = serviceDistribution.sort((a, b) => b.percentage - a.percentage);
          
          console.log('🥧 Service distribution (sorted by percentage):', sortedServiceDistribution);

          console.log('📊 Firestore Data - categoriesWithData:', categoriesWithData);
          console.log('📊 Firestore Data - totalCount:', totalCount);
          console.log('📊 Firestore Data - sortedServiceDistribution:', sortedServiceDistribution);

          setAnalytics({
            repairRequestsByMonth,
            serviceDistribution: sortedServiceDistribution
          });
          
          console.log('✅ Analytics data set successfully');
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Set fallback data if there's an error
        setAnalytics({
          repairRequestsByMonth: [],
          serviceDistribution: []
        });
      }
    };

    fetchAnalytics();
  }, []);

  // Helper function to get category icons
  const getCategoryIcon = (category: string) => {
    const normalizedCategory = category.toLowerCase();
    switch (normalizedCategory) {
      case 'television':
      case 'tv':
        return FaTv;
      case 'electric fan':
      case 'fan':
        return FaWind;
      case 'air conditioner':
      case 'air conditioning':
      case 'ac':
        return FaSnowflake;
      case 'refrigerator':
      case 'fridge':
        return FaTint;
      case 'washing machine':
      case 'washer':
        return FaCog;
      default: 
        return FaWrench;
    }
  };

  return (
    <DashboardLayout activeMenu="dashboard">
      <div>
        <header className="dashboard-header">
          <h2>{getGreeting()}, {adminName} 👋</h2>
          <p className="dashboard-date">{getManilaDate()}</p>
          <p>Manage and monitor I-Repair efficiently.</p>
        </header>

        {/* Clean Modal - No Background Overlay */}
        {isChartExpanded && (
          <div 
            className="chart-modal-overlay"
            onClick={() => setIsChartExpanded(false)}
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
            {/* Expanded Chart Modal */}
            <div 
              className="chart-modal-content"
              onClick={(e) => e.stopPropagation()}
              onMouseLeave={handleModalMouseLeave}
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
                  Repair Requests Analytics
                </h2>
                <p style={{ color: '#aaa', fontSize: '14px', margin: '0' }}>
                  Detailed monthly breakdown with interactive data visualization
                </p>
              </div>

              {/* Expanded Chart Content */}
              <div style={{ height: 'calc(100% - 100px)', position: 'relative' }}>
                {/* Y-axis labels */}
                <div style={{ position: 'absolute', left: '0', top: '20px', bottom: '40px', width: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {[100, 75, 50, 25, 0].map((value, index) => (
                    <div key={index} style={{ color: '#666', fontSize: '12px', textAlign: 'right' }}>{value}</div>
                  ))}
                </div>
                
                {/* Expanded Bar Chart */}
                <div style={{ 
                  marginLeft: '50px', 
                  height: 'calc(100% - 20px)', 
                  position: 'relative', 
                  overflowX: 'hidden',
                  overflowY: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '20px 20px 40px 20px'
                }}>
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'end',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    minHeight: '300px'
                  }}>
                    {/* Grid lines */}
                    <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '40px' }}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ 
                          position: 'absolute', 
                          top: `${i * 25}%`, 
                          left: '0', 
                          right: '0', 
                          height: '1px', 
                          backgroundColor: 'rgba(255,255,255,0.1)' 
                        }} />
                      ))}
        </div>

                    {/* Enhanced Bar Chart */}
                    {analytics.repairRequestsByMonth.map((data, index) => {
                      // Ultra Conservative scale (very clean, understated look)
                      let height;
                      if (data.count === 0) {
                        height = 0;
                      } else if (data.count === 1) {
                        height = 3; // 1 appointment = 3% height
                      } else if (data.count === 2) {
                        height = 6; // 2 appointments = 6% height
                      } else if (data.count === 3) {
                        height = 10; // 3 appointments = 10% height
                      } else if (data.count === 4) {
                        height = 15; // 4 appointments = 15% height
                      } else if (data.count === 5) {
                        height = 20; // 5 appointments = 20% height
                      } else if (data.count <= 8) {
                        height = 30; // 6-8 appointments = 30% height
                      } else if (data.count <= 12) {
                        height = 40; // 9-12 appointments = 40% height
                      } else if (data.count <= 20) {
                        height = 55; // 13-20 appointments = 55% height
                      } else {
                        height = 70; // 20+ appointments = 70% height (maximum)
                      }
                      
                      return (
                        <div key={index} style={{ 
                          width: '60px', 
                          height: `${height}%`, 
                          backgroundColor: '#4a90e2',
                          borderRadius: '6px 6px 0 0',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '4px',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          boxShadow: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#5ba0f2';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#4a90e2';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        >
                          <div style={{ 
                            color: '#fff', 
                            fontSize: '12px', 
                            fontWeight: 'bold',
                            textAlign: 'center',
                            width: '100%',
                            zIndex: 1
                          }}>
                            {data.count}
                          </div>
                        </div>
                      );
                    })}
          </div>

                {/* X-axis labels */}
                <div style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
                  {analytics.repairRequestsByMonth.map((data, index) => (
                    <div key={index} style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', width: '60px' }}>{data.month}</div>
                  ))}
                </div>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Distribution Modal */}
        {isServicesModalOpen && (
          <div 
            className="chart-modal-overlay"
            onClick={() => setIsServicesModalOpen(false)}
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
            {/* Expanded Services Modal */}
            <div 
              className="chart-modal-content"
              onClick={(e) => e.stopPropagation()}
              onMouseLeave={handleServicesModalMouseLeave}
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
                  Services Distribution Analytics
                </h2>
                <p style={{ color: '#aaa', fontSize: '14px', margin: '0' }}>
                  Service distribution breakdown by appliance category
                </p>
              </div>

              {/* Services Chart Content */}
              <div className="chart-content" style={{ 
                height: 'calc(100% - 100px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="services-chart" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  flexDirection: 'row',
                  gap: '50px',
                  padding: '40px'
                }}>
                  <div 
                    className="pie-chart-expanded"
                    style={{ 
                      background: analytics.serviceDistribution.length > 0 ? 'conic-gradient(' + 
                        analytics.serviceDistribution.map((data, index) => {
                          // Custom color mapping based on category
                          let color = '#3b82f6'; // Default blue
                          if (data.category === 'Air Conditioner') {
                            color = '#3b82f6'; // Blue
                          } else if (data.category === 'Television') {
                            color = '#ef4444'; // Red
                          } else if (data.category === 'Electric Fan') {
                            color = '#f59e0b'; // Orange
                          } else if (data.category === 'Refrigerator') {
                            color = '#10b981'; // Green
                          } else if (data.category === 'Washing Machine') {
                            color = '#8b5cf6'; // Purple
                          } else {
                            // Fallback colors for other categories
                            const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];
                            color = colors[index % colors.length];
                          }
                          const startAngle = analytics.serviceDistribution.slice(0, index).reduce((sum, item) => sum + item.percentage, 0);
                          const endAngle = startAngle + data.percentage;
                          console.log(`🥧 Expanded Modal - ${data.category}: ${data.percentage}% (${startAngle * 3.6}deg to ${endAngle * 3.6}deg)`);
                          return `${color} ${startAngle * 3.6}deg ${endAngle * 3.6}deg`;
                        }).join(', ') + ')' : 'conic-gradient(#3b82f6 0deg 72deg, #f59e0b 72deg 144deg, #ef4444 144deg 216deg, #10b981 216deg 288deg, #8b5cf6 288deg 360deg)',
                      position: 'relative',
                      width: '280px',
                      height: '280px',
                      borderRadius: '50%'
                    }}
                  >
                    <div className="pie-center" style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '120px',
                      height: '120px',
                      backgroundColor: 'rgba(30, 30, 30, 0.9)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      Total
                    </div>
                  </div>

                  <div className="pie-legend" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    alignItems: 'flex-start',
                    flex: 1
                  }}>
                    {analytics.serviceDistribution.map((data, index) => {
                      // Custom color mapping based on category
                      let color = '#3b82f6'; // Default blue
                      if (data.category === 'Air Conditioner') {
                        color = '#3b82f6'; // Blue
                      } else if (data.category === 'Television') {
                        color = '#ef4444'; // Red
                      } else if (data.category === 'Electric Fan') {
                        color = '#f59e0b'; // Orange
                      } else if (data.category === 'Refrigerator') {
                        color = '#10b981'; // Green
                      } else if (data.category === 'Washing Machine') {
                        color = '#8b5cf6'; // Purple
                      } else {
                        // Fallback colors for other categories
                        const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];
                        color = colors[index % colors.length];
                      }
                      const IconComponent = data.icon;
                      
                      return (
                        <div key={index} className="legend-item" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '16px',
                          marginBottom: '8px'
                        }}>
                          <div 
                            className="legend-color"
                            style={{ 
                              backgroundColor: color,
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <IconComponent style={{ fontSize: '18px', color: '#fff' }} />
                          </div>
                          <span className="legend-label" style={{ color: '#fff', fontSize: '16px' }}>{data.category}</span>
                          <span className="legend-percentage" style={{ color: '#aaa', fontSize: '16px', fontWeight: 'bold' }}>{data.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Side by Side */}
        <div className="charts-container">
          {/* Repair Requests Bar Chart */}
          <div 
            className="chart-card"
            onMouseEnter={handleChartMouseEnter}
            onMouseLeave={handleChartMouseLeave}
            onClick={handleChartClick}
            style={{ 
              cursor: 'pointer',
              transform: 'none !important',
              boxShadow: '0 6px 18px rgba(0,0,0,0.4) !important',
              transition: 'none !important'
            }}
          >
            <h3 className="chart-title">Repair Requests</h3>
            <p className="chart-subtitle">Monthly data (Jan-Dec)</p>
            <div style={{ height: '250px', position: 'relative', padding: '10px' }}>
              {/* Y-axis labels */}
              <div style={{ position: 'absolute', left: '0', top: '20px', bottom: '40px', width: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {[100, 75, 50, 25, 0].map((value, index) => (
                  <div key={index} style={{ color: '#666', fontSize: '10px', textAlign: 'right' }}>{value}</div>
                ))}
              </div>
              
              {/* Bar Chart with Scrollbar */}
              <div style={{ 
                marginLeft: '40px', 
                height: '100%', 
                position: 'relative', 
                overflowX: isChartExpanded ? 'visible' : 'auto',
                overflowY: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px'
              }}>
                <div style={{ 
                  width: isChartExpanded ? '100%' : '1200px', 
                  height: '100%', 
                  position: 'relative',
                  minWidth: isChartExpanded ? 'auto' : '1200px',
                  display: isChartExpanded ? 'flex' : 'block',
                  justifyContent: isChartExpanded ? 'space-between' : 'normal',
                  padding: isChartExpanded ? '0 20px' : '0'
                }}>
                  {/* Grid lines */}
                  <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '40px' }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ 
                        position: 'absolute', 
                        top: `${i * 25}%`, 
                        left: '0', 
                        right: '0', 
                        height: '1px', 
                        backgroundColor: 'rgba(255,255,255,0.1)' 
                      }} />
                    ))}
        </div>

                  {/* Bar Chart */}
                  <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '40px', display: 'flex', alignItems: 'end', justifyContent: 'space-between', padding: '0 10px' }}>
                    {analytics.repairRequestsByMonth.map((data, index) => {
                      // Ultra Conservative scale (very clean, understated look)
                      let height;
                      if (data.count === 0) {
                        height = 0;
                      } else if (data.count === 1) {
                        height = 3; // 1 appointment = 3% height
                      } else if (data.count === 2) {
                        height = 6; // 2 appointments = 6% height
                      } else if (data.count === 3) {
                        height = 10; // 3 appointments = 10% height
                      } else if (data.count === 4) {
                        height = 15; // 4 appointments = 15% height
                      } else if (data.count === 5) {
                        height = 20; // 5 appointments = 20% height
                      } else if (data.count <= 8) {
                        height = 30; // 6-8 appointments = 30% height
                      } else if (data.count <= 12) {
                        height = 40; // 9-12 appointments = 40% height
                      } else if (data.count <= 20) {
                        height = 55; // 13-20 appointments = 55% height
                      } else {
                        height = 70; // 20+ appointments = 70% height (maximum)
                      }
                      
                      console.log(`Bar ${index}: height=${height}%, count=${data.count}`);
                      return (
                        <div key={index} style={{ 
                          width: isChartExpanded ? '80px' : '60px', 
                          height: `${height}%`, 
                          backgroundColor: '#4a90e2',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '4px',
                          transition: 'all 0.3s ease-in-out'
                        }}>
                          <div style={{ 
                            color: '#fff', 
                            fontSize: isChartExpanded ? '14px' : '10px', 
                            fontWeight: 'bold',
                            textAlign: 'center',
                            width: '100%',
                            zIndex: 1
                          }}>
                            {data.count}
                          </div>
                        </div>
                      );
                    })}
          </div>

                  {/* X-axis labels */}
                  <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
                    {analytics.repairRequestsByMonth.map((data, index) => (
                      <div key={index} style={{ color: '#aaa', fontSize: '10px', textAlign: 'center', width: '60px' }}>{data.month}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services Distribution Chart */}
          <div 
            className="chart-card"
            onMouseEnter={handleServicesMouseEnter}
            onMouseLeave={handleServicesMouseLeave}
            onClick={handleServicesChartClick}
            style={{ 
              cursor: 'pointer',
              transform: 'none !important',
              boxShadow: '0 6px 18px rgba(0,0,0,0.4) !important',
              transition: 'none !important'
            }}
          >
            <h3 className="chart-title">Services Distribution</h3>
            <p className="chart-subtitle">By appliance category</p>
            <div className="chart-content">
              <div className="services-chart">
                <div 
                  className="pie-chart"
                  style={{ background: analytics.serviceDistribution.length > 0 ? 'conic-gradient(' + 
                    analytics.serviceDistribution.map((data, index) => {
                      // Custom color mapping based on category
                      let color = '#3b82f6'; // Default blue
                      if (data.category === 'Air Conditioner') {
                        color = '#3b82f6'; // Blue
                      } else if (data.category === 'Television') {
                        color = '#ef4444'; // Red
                      } else if (data.category === 'Electric Fan') {
                        color = '#f59e0b'; // Orange
                      } else if (data.category === 'Refrigerator') {
                        color = '#10b981'; // Green
                      } else if (data.category === 'Washing Machine') {
                        color = '#8b5cf6'; // Purple
                      } else {
                        // Fallback colors for other categories
                        const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];
                        color = colors[index % colors.length];
                      }
                      const startAngle = analytics.serviceDistribution.slice(0, index).reduce((sum, item) => sum + item.percentage, 0);
                      const endAngle = startAngle + data.percentage;
                      return `${color} ${startAngle * 3.6}deg ${endAngle * 3.6}deg`;
                    }).join(', ') + ')' : 'conic-gradient(#3b82f6 0deg 72deg, #f59e0b 72deg 144deg, #ef4444 144deg 216deg, #10b981 216deg 288deg, #8b5cf6 288deg 360deg)'
                  }}
                >
                  <div className="pie-center">
                    Total
                  </div>
          </div>

                <div className="pie-legend">
                  {analytics.serviceDistribution.map((data, index) => {
                    // Custom color mapping based on category
                    let color = '#3b82f6'; // Default blue
                    if (data.category === 'Air Conditioner') {
                      color = '#3b82f6'; // Blue
                    } else if (data.category === 'Television') {
                      color = '#ef4444'; // Red
                    } else if (data.category === 'Electric Fan') {
                      color = '#f59e0b'; // Orange
                    } else if (data.category === 'Refrigerator') {
                      color = '#10b981'; // Green
                    } else if (data.category === 'Washing Machine') {
                      color = '#8b5cf6'; // Purple
                    } else {
                      // Fallback colors for other categories
                      const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];
                      color = colors[index % colors.length];
                    }
                    const IconComponent = data.icon;
                    
                    return (
                      <div key={index} className="legend-item">
                        <div 
                          className="legend-color"
                          style={{ backgroundColor: color }}
                        >
                          <IconComponent style={{ fontSize: '15px', color: '#fff' }} />
                        </div>
                        <span className="legend-label">{data.category}</span>
                        <span className="legend-percentage">{data.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          </div>

        {/* ✅ Dashboard cards */}
        <section className="cards-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
              <FaUsers />
            </div>
            <div className="stat-content">
            <h3>Total Clients</h3>
              <p className="stat-number">{loading ? "..." : stats.totalUsers}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
              <FaTools />
            </div>
            <div className="stat-content">
              <h3>Technicians</h3>
              <p className="stat-number">{loading ? "..." : stats.totalTechnicians}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
              <FaCalendarAlt />
            </div>
            <div className="stat-content">
              <h3>Total Appointments</h3>
              <p className="stat-number">{loading ? "..." : stats.totalAppointments}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)' }}>
              <FaClock />
            </div>
            <div className="stat-content">
              <h3>Pending</h3>
              <p className="stat-number">{loading ? "..." : stats.pendingAppointments}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #a8edea, #fed6e3)' }}>
              <FaWrench />
            </div>
            <div className="stat-content">
              <h3>Active Repairs</h3>
              <p className="stat-number">{loading ? "..." : stats.activeRepairs}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #d299c2, #fef9d7)' }}>
              <FaCheckCircle />
            </div>
            <div className="stat-content">
              <h3>Completed</h3>
              <p className="stat-number">{loading ? "..." : stats.completedAppointments}</p>
            </div>
          </div>
          
        </section>

        {/* 📊 Quick Actions */}
        <section className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <Link to="/appointments" className="action-card">
              <FaCalendarAlt className="action-icon" style={{ color: '#3b82f6' }} />
              <span>Manage Appointments</span>
            </Link>
            <Link to="/users" className="action-card">
              <FaUsers className="action-icon" style={{ color: '#10b981' }} />
              <span>Client Management</span>
            </Link>
            <Link to="/technicians" className="action-card">
              <FaTools className="action-icon" style={{ color: '#f59e0b' }} />
              <span>Technician Management</span>
            </Link>
            <Link to="/reports" className="action-card">
              <FaFlag className="action-icon" style={{ color: '#ef4444' }} />
              <span>Client Reports</span>
            </Link>
            <button 
              className="action-card print-button" 
              onClick={() => setIsPrintModalOpen(true)}
            >
              <FaPrint className="action-icon" style={{ color: '#8b5cf6' }} />
              <span>Print Reports</span>
            </button>
          </div>
        </section>

        {/* Print Reports Modal */}
        <PrintReportsModal 
          isOpen={isPrintModalOpen} 
          onClose={() => setIsPrintModalOpen(false)} 
        />

        {/* Footer */}
        <footer style={{ 
          textAlign: 'center', 
          padding: '20px 0', 
          marginTop: '40px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '400'
        }}>
          © 2025 I-Repair, All rights reserved
        </footer>
    </div>
    </DashboardLayout>
  );
}
