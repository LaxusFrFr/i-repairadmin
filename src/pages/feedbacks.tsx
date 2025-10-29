import React, { useState, useEffect } from "react";
import "../styles/feedbacks.css";
import { FaComments, FaStar, FaUser, FaWrench, FaSearch } from "react-icons/fa";
import DashboardLayout from "./dashboardlayout";
import { db } from "../firebase/firebase";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";

interface AppFeedback {
  id: string;
  userId: string;
  email: string;
  feedbackText: string;
  rating: number;
  role?: string;
  createdAt: any;
}

interface TechnicianRating {
  id: string;
  technicianId: string;
  userId: string;
  rating: number;
  comment?: string;
  appointmentId?: string;
  createdAt: string;
  technician?: {
    id: string;
    username: string;
    fullName: string;
    profileImage?: string;
  };
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

export default function Feedbacks() {
  const [activeTab, setActiveTab] = useState("app-feedback");
  const [appFeedbacks, setAppFeedbacks] = useState<AppFeedback[]>([]);
  const [technicianRatings, setTechnicianRatings] = useState<TechnicianRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all feedback data
  useEffect(() => {
    fetchAllFeedbacks();
  }, []);

  const fetchAllFeedbacks = async () => {
    setLoading(true);
    try {
      // Fetch app feedbacks (from both 'feedback' and 'feedbacks' collections)
      const [feedbackSnapshot, feedbacksSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(50))),
        getDocs(query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(50)))
      ]);

      const appFeedbacksData: AppFeedback[] = [];
      
      // Process 'feedback' collection - all from users (role: 'user')
      feedbackSnapshot.forEach((doc) => {
        const data = doc.data();
        appFeedbacksData.push({
          id: doc.id,
          userId: data.userId || '',
          email: data.email || '',
          feedbackText: data.feedbackText || '',
          rating: data.rating || 0,
          role: 'user',
          createdAt: data.createdAt
        } as AppFeedback);
      });

      // Process 'feedbacks' collection - read role from document data
      feedbacksSnapshot.forEach((doc) => {
        const data = doc.data();
        appFeedbacksData.push({
          id: doc.id,
          userId: data.userId || '',
          email: data.email || '',
          feedbackText: data.feedbackText || '',
          rating: data.rating || 0,
          role: data.role || 'users', // Read actual role from data
          createdAt: data.createdAt
        } as AppFeedback);
      });

      setAppFeedbacks(appFeedbacksData);

      // Fetch technician ratings with technician and user data
      const ratingsSnapshot = await getDocs(
        query(collection(db, 'ratings'), orderBy('createdAt', 'desc'), limit(50))
      );
      const ratingsData: TechnicianRating[] = [];
      
      for (const ratingDoc of ratingsSnapshot.docs) {
        const ratingData = ratingDoc.data();
        
        // Fetch technician data
        let technicianData = null;
        if (ratingData.technicianId) {
          try {
            const techDoc = await getDoc(doc(db, 'technicians', ratingData.technicianId));
            if (techDoc.exists()) {
              technicianData = techDoc.data();
            }
          } catch (error) {
            console.log('Could not fetch technician data for rating:', ratingDoc.id);
          }
        }
        
        // Fetch user data
        let userData = null;
        if (ratingData.userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', ratingData.userId));
            if (userDoc.exists()) {
              userData = userDoc.data();
            }
          } catch (error) {
            console.log('Could not fetch user data for rating:', ratingDoc.id);
          }
        }
        
        ratingsData.push({
          id: ratingDoc.id,
          technicianId: ratingData.technicianId || '',
          userId: ratingData.userId || '',
          rating: ratingData.rating || 0,
          comment: ratingData.comment || '',
          appointmentId: ratingData.appointmentId || '',
          createdAt: ratingData.createdAt || '',
          technician: technicianData ? {
            id: ratingData.technicianId,
            username: technicianData.username || technicianData.fullName || 'Technician',
            fullName: technicianData.fullName || technicianData.username || 'Technician',
            profileImage: technicianData.profileImage
          } : null,
          user: userData ? {
            id: ratingData.userId,
            email: userData.email || '',
            fullName: userData.fullName || ''
          } : null
        } as TechnicianRating);
      }
      
      setTechnicianRatings(ratingsData);

    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    return (role === 'technicians' || role === 'user' || role === 'users') ? 
      (role === 'technicians' ? <FaWrench className="role-icon" /> : <FaUser className="role-icon" />) :
      <FaUser className="role-icon" />;
  };

  const getRoleColor = (role: string) => {
    return (role === 'technicians') ? '#667eea' : '#28a745';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        className={`star ${index < rating ? 'filled' : 'empty'}`}
      />
    ));
  };

  const filteredAppFeedbacks = appFeedbacks.filter(feedback => {
    // Normalize role comparison: 'users' from data should match 'user' filter
    let normalizedRole = feedback.role;
    if (normalizedRole === 'users') normalizedRole = 'user';
    if (normalizedRole === 'technicians') normalizedRole = 'technicians';
    
    const matchesRole = filterRole === "all" || normalizedRole === filterRole;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" || 
      feedback.feedbackText.toLowerCase().includes(searchLower) ||
      feedback.email.toLowerCase().includes(searchLower) ||
      feedback.userId.toLowerCase().includes(searchLower);
    return matchesRole && matchesSearch;
  });

  const feedbackTabs = [
    { id: "app-feedback", label: "App Feedback", icon: FaComments },
    { id: "technician-ratings", label: "Technician Ratings", icon: FaStar }
  ];

  return (
    <DashboardLayout activeMenu="feedbacks">
      <div className="feedbacks-container">
        <div className="header-section">
          <h2 className="page-title">
            <FaComments className="page-icon" style={{ color: '#667eea' }} />
            Feedbacks
          </h2>
          <p className="page-subtitle">Monitor user feedback and technician ratings.</p>
        </div>

        <div className="feedbacks-content">
          {/* Main Content */}
          <div className="main-content">
            {/* Navigation Tabs */}
            <div className="content-header">
              <div className="tab-navigation">
                {feedbackTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <IconComponent className="tab-icon" />
                      <span className="tab-label">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="content-body">
              {/* App Feedback */}
              {activeTab === "app-feedback" && (
                <div className="feedback-section">
                  <div className="section-header">
                    <div className="section-controls">
                      <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                          type="text"
                          placeholder="Search feedback..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                      </div>
                      <div className="filter-buttons">
                        <button
                          className={`filter-btn ${filterRole === "all" ? "active" : ""}`}
                          onClick={() => setFilterRole("all")}
                        >
                          All
                        </button>
                        <button
                          className={`filter-btn ${filterRole === "user" ? "active" : ""}`}
                          onClick={() => setFilterRole("user")}
                        >
                          Users
                        </button>
                        <button
                          className={`filter-btn ${filterRole === "technicians" ? "active" : ""}`}
                          onClick={() => setFilterRole("technicians")}
                        >
                          Technicians
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="feedback-grid">
                    {loading ? (
                      <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading feedbacks...</p>
                      </div>
                    ) : filteredAppFeedbacks.length === 0 ? (
                      <div className="empty-state app-feedback-empty">
                        <FaComments className="empty-icon" />
                        <h4>No feedback found</h4>
                        <p>No feedback matches your current filters.</p>
                      </div>
                    ) : (
                      filteredAppFeedbacks.map((feedback) => (
                        <div key={feedback.id} className="feedback-card">
                          <div className="feedback-header">
                            <div className="user-info">
                              <div className="user-avatar">
                                {getRoleIcon(feedback.role || 'user')}
                              </div>
                              <div className="user-details">
                                <div className="user-email">{feedback.email}</div>
                                <div className="user-role" style={{ color: getRoleColor(feedback.role || 'user') }}>
                                  {(feedback.role === 'technicians') ? 'Technician' : 'User'}
                                </div>
                              </div>
                            </div>
                            <div className="feedback-rating">
                              {renderStars(feedback.rating)}
                            </div>
                          </div>
                          <div className="feedback-content">
                            <p className="feedback-text">{feedback.feedbackText}</p>
                          </div>
                          <div className="feedback-footer">
                            <div className="feedback-date">
                              {feedback.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Technician Ratings */}
              {activeTab === "technician-ratings" && (
                <div className="feedback-section">
                  <div className="section-header">
                    <div className="section-controls">
                      {/* Empty controls to match App Feedback height */}
                      <div className="search-box" style={{ visibility: 'hidden' }}>
                        <div style={{ width: '20px', height: '20px' }}></div>
                        <input
                          type="text"
                          className="search-input"
                          style={{ opacity: 0 }}
                        />
                      </div>
                      <div className="filter-buttons" style={{ visibility: 'hidden' }}>
                        <button className="filter-btn" style={{ opacity: 0 }}>All</button>
                        <button className="filter-btn" style={{ opacity: 0 }}>Users</button>
                        <button className="filter-btn" style={{ opacity: 0 }}>Technicians</button>
                      </div>
                    </div>
                  </div>

                  <div className="feedback-grid">
                    {loading ? (
                      <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading ratings...</p>
                      </div>
                    ) : technicianRatings.length === 0 ? (
                      <div className="empty-state technician-ratings-empty">
                        <FaStar className="empty-icon" />
                        <h4>No ratings found</h4>
                        <p>No technician ratings available yet.</p>
                      </div>
                    ) : (
                      technicianRatings.map((rating) => (
                        <div key={rating.id} className="feedback-card">
                          <div className="feedback-header">
                            <div className="user-info">
                              <div className="user-avatar">
                                {rating.technician?.profileImage ? (
                                  <img 
                                    src={rating.technician.profileImage} 
                                    alt={rating.technician.fullName}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <FaWrench />
                                )}
                              </div>
                              <div className="user-details">
                                <div className="user-email">
                                  {rating.technician?.fullName || rating.technician?.username || 'Technician'}
                                </div>
                                <div className="user-role" style={{ color: '#667eea' }}>Technician</div>
                              </div>
                            </div>
                            <div className="feedback-rating">
                              {renderStars(rating.rating)}
                            </div>
                          </div>
                          <div className="feedback-content">
                            {rating.comment && (
                              <p className="feedback-text">{rating.comment}</p>
                            )}
                            {!rating.comment && (
                              <p className="feedback-text" style={{ fontStyle: 'italic', color: '#888' }}>
                                No comment provided
                              </p>
                            )}
                          </div>
                          <div className="feedback-footer">
                            <div className="feedback-date">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </div>
                            <div className="technician-info">
                              <FaUser className="technician-icon" />
                              {rating.user?.email || rating.user?.fullName || `User: ${rating.userId.slice(0, 8)}...`}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Overview - Outside Main Content */}
          <div className="feedbacks-stats-overview">
            <div className="feedbacks-stat-card">
              <div className="feedbacks-stat-icon app-feedback">
                <FaComments />
              </div>
              <div className="feedbacks-stat-content">
                <div className="feedbacks-stat-number">{appFeedbacks.length}</div>
                <div className="feedbacks-stat-label">App Feedbacks</div>
              </div>
            </div>
            <div className="feedbacks-stat-card">
              <div className="feedbacks-stat-icon technician-ratings">
                <FaStar />
              </div>
              <div className="feedbacks-stat-content">
                <div className="feedbacks-stat-number">{technicianRatings.length}</div>
                <div className="feedbacks-stat-label">Technician Ratings</div>
              </div>
            </div>
            <div className="feedbacks-stat-card">
              <div className="feedbacks-stat-icon average-app-rating">
                <FaStar />
              </div>
              <div className="feedbacks-stat-content">
                <div className="feedbacks-stat-number">
                  {appFeedbacks.length > 0 
                    ? (appFeedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / appFeedbacks.length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div className="feedbacks-stat-label">Avg App Rating</div>
              </div>
            </div>
            <div className="feedbacks-stat-card">
              <div className="feedbacks-stat-icon average-technician-rating">
                <FaStar />
              </div>
              <div className="feedbacks-stat-content">
                <div className="feedbacks-stat-number">
                  {technicianRatings.length > 0 
                    ? (technicianRatings.reduce((sum, rating) => sum + rating.rating, 0) / technicianRatings.length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div className="feedbacks-stat-label">Avg Tech Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
