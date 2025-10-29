import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
// Note: Firebase Auth tracks login times automatically, but we need to store them in Firestore
import "../styles/profiles.css";
import { FaUser, FaTools, FaTimes, FaUsers, FaClock, FaUserCircle, FaImage } from "react-icons/fa";
import DashboardLayout from "./dashboardlayout";

interface UserData {
  uid: string;
  username: string;
  email: string;
  phone?: string;
  fullName?: string;
  profileImage?: string;
  createdAt?: string;
  lastLogin?: string;
  isActive?: boolean;
  isBlocked?: boolean;
  userType?: string;
  location?: string;
  address?: string;
  availability?: boolean; // Technician availability toggle
  isOnline?: boolean; // Login status
  loginStatus?: string; // 'online' or 'offline'
  
  // Technician specific fields
  categories?: string[];
  yearsInService?: string;
  workingHours?: {
    startTime: string;
    endTime: string;
  };
  workingDays?: string[];
  status?: "pending" | "approved" | "rejected";
  submitted?: boolean;
  type?: "shop" | "freelance";
  hasShop?: boolean;
  shopName?: string;
  shopAddress?: string;
  shopOpeningHours?: string;
  
  // Performance fields
  rating?: number;
  totalJobs?: number;
  completedJobs?: number;
  
  // Documentation & Requirements (photos)
  profilePhoto?: string;
  recentPhoto?: string;
  businessPermit?: string;
  governmentId?: string;
  certificate?: string;
  locationPhoto?: string;
  shopLocationPhoto?: string;
  freelanceLocationPhoto?: string;
}

export default function Profiles() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [technicians, setTechnicians] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTech, setSelectedTech] = useState<UserData | null>(null);
  const [viewingFromTile, setViewingFromTile] = useState<string>('');
  const [shopData, setShopData] = useState<any | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, title: string} | null>(null);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return !data.isDeleted; // Filter out deleted users
        })
        .map((doc) => {
        const data = doc.data() as any;
        // Last login tracking now handled in mobile app login process
        return {
          uid: doc.id,
          username: data.username || data.displayName || 'Unknown',
          email: data.email || '',
          phone: data.phone || data.phoneNumber || '',
          fullName: data.fullName || data.displayName || '',
          profileImage: data.profileImage || data.photoURL || '',
          createdAt: (() => {
            // Handle Firestore timestamp for createdAt
            if (data.createdAt && data.createdAt.seconds) {
              return new Date(data.createdAt.seconds * 1000).toISOString();
            } else if (data.createdAt && data.createdAt.toDate) {
              return data.createdAt.toDate().toISOString();
            } else if (data.createdAt) {
              return data.createdAt;
            } else if (data.timestamp && data.timestamp.seconds) {
              return new Date(data.timestamp.seconds * 1000).toISOString();
            } else {
              return data.timestamp || data.metadata?.creationTime || '';
            }
          })(),
          lastLogin: (() => {
            // Handle Firestore timestamp for lastLogin
            if (data.lastLogin && data.lastLogin.seconds) {
              return new Date(data.lastLogin.seconds * 1000).toISOString();
            } else if (data.lastLogin && data.lastLogin.toDate) {
              return data.lastLogin.toDate().toISOString();
            } else if (data.lastLogin) {
              return data.lastLogin;
            } else if (data.lastSignInTime && data.lastSignInTime.seconds) {
              return new Date(data.lastSignInTime.seconds * 1000).toISOString();
            } else if (data.lastActive && data.lastActive.seconds) {
              return new Date(data.lastActive.seconds * 1000).toISOString();
            } else {
              return data.lastSignInTime || data.metadata?.lastSignInTime || data.lastActive || data.updatedAt || data.timestamp || '';
            }
          })(),
          isActive: data.availability !== false, // Use availability field from technician settings
          isBlocked: data.isBlocked || false,
          userType: data.userType || 'Regular User',
          location: data.location || data.address || '',
          address: data.address || '',
          isOnline: data.isOnline === true,
          loginStatus: data.loginStatus || 'offline'
        };
      });
      setUsers(usersData);
      setLoading(false);
    });

    const unsubscribeTechnicians = onSnapshot(collection(db, "technicians"), (snapshot) => {
      const techniciansData = snapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return !data.isDeleted; // Filter out deleted technicians
        })
        .map((doc) => {
        const data = doc.data() as any;
        // Last login tracking now handled in mobile app login process
        return {
          uid: doc.id,
          username: data.username || data.displayName || 'Unknown',
          email: data.email || '',
          phone: data.phone || data.phoneNumber || '',
          fullName: data.fullName || data.displayName || '',
          profileImage: data.profileImage || data.photoURL || '',
          status: data.status || 'pending',
          submitted: data.submitted || false,
          type: data.type || 'freelance',
          hasShop: data.hasShop || false,
          categories: data.categories || [],
          yearsInService: data.yearsInService || '',
          workingHours: data.workingHours || null,
          workingDays: data.workingDays || [],
          location: data.location || data.address || '',
          address: data.address || '',
          shopName: data.shopName || '',
          shopAddress: data.shopAddress || '',
          shopOpeningHours: data.shopOpeningHours || '',
          isBlocked: data.isBlocked || false,
          isActive: data.availability !== false, // Use availability field from technician settings
          createdAt: (() => {
            // Handle Firestore timestamp for createdAt
            if (data.createdAt && data.createdAt.seconds) {
              return new Date(data.createdAt.seconds * 1000).toISOString();
            } else if (data.createdAt && data.createdAt.toDate) {
              return data.createdAt.toDate().toISOString();
            } else if (data.createdAt) {
              return data.createdAt;
            } else if (data.timestamp && data.timestamp.seconds) {
              return new Date(data.timestamp.seconds * 1000).toISOString();
            } else {
              return data.timestamp || data.metadata?.creationTime || '';
            }
          })(),
          lastLogin: (() => {
            // Handle Firestore timestamp for lastLogin
            if (data.lastLogin && data.lastLogin.seconds) {
              return new Date(data.lastLogin.seconds * 1000).toISOString();
            } else if (data.lastLogin && data.lastLogin.toDate) {
              return data.lastLogin.toDate().toISOString();
            } else if (data.lastLogin) {
              return data.lastLogin;
            } else if (data.lastSignInTime && data.lastSignInTime.seconds) {
              return new Date(data.lastSignInTime.seconds * 1000).toISOString();
            } else if (data.lastActive && data.lastActive.seconds) {
              return new Date(data.lastActive.seconds * 1000).toISOString();
            } else {
              return data.lastSignInTime || data.metadata?.lastSignInTime || data.lastActive || data.updatedAt || data.timestamp || '';
            }
          })(),
          isOnline: data.isOnline === true,
          loginStatus: data.loginStatus || 'offline',
          rating: data.rating || 0,
          totalJobs: data.totalJobs || 0,
          completedJobs: data.completedJobs || 0,
          // Documentation & Requirements
          profilePhoto: data.profilePhoto || '',
          recentPhoto: data.recentPhoto || '',
          businessPermit: data.businessPermit || '',
          governmentId: data.governmentId || '',
          certificate: data.certificate || '',
          locationPhoto: data.locationPhoto || data.shopLocationPhoto || data.freelanceLocationPhoto || ''
        };
        });
      setTechnicians(techniciansData);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTechnicians();
    };
  }, []);

  const updateStatus = async (uid: string, status: "approved" | "rejected") => {
    try {
      const techRef = doc(db, "technicians", uid);

      if (status === "rejected") {
        const shopsRef = collection(db, "shops");
        const q = query(shopsRef, where("technicianId", "==", uid));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }

        await updateDoc(techRef, {
          status: "rejected",
          submitted: false,
          hasShop: false,
          categories: [],
          yearsInService: "",
          type: "freelance",
        });
      } else {
        await updateDoc(techRef, { status: "approved", submitted: true });
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleViewTech = async (tech: UserData, tileType: string = '') => {
    setSelectedTech(tech);
    setViewingFromTile(tileType);

    if (tech.hasShop) {
      const shopsRef = collection(db, "shops");
      const q = query(shopsRef, where("technicianId", "==", tech.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const shopDoc = querySnapshot.docs[0].data();
        setShopData(shopDoc);
      } else {
        setShopData(null);
      }
    } else {
      setShopData(null);
    }
  };

  if (loading) return <div className="profiles-loading">Loading...</div>;

  // Show both submitted pending AND non-submitted pending technicians
  const nonRegisteredTechs = technicians.filter((t) => t.status === "pending");
  const notSubmittedTechs = technicians.filter((t) => !t.submitted);
  const registeredTechs = technicians.filter((t) => t.status === "approved");

  return (
    <DashboardLayout activeMenu="profiles">
      <div className="profiles-container">
        <div className="header-section">
          <h2 className="page-title">
            <FaUserCircle className="page-icon" style={{ color: '#667eea' }} />
            Profile Management
          </h2>
          <p className="page-subtitle">Manage all users and technicians here.</p>
        </div>

      <main className="profiles-wrapper">
        {/* Users */}
        <div className="profiles-card">
          <h2>
            <div className="profiles-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
              <FaUsers />
            </div>
            Users
          </h2>
          {users.length === 0 ? (
            <p className="profiles-empty">No users found.</p>
          ) : (
            <div className={`profiles-table ${users.length > 2 ? 'profiles-scrollable' : ''}`}>
              {users.map((u) => (
                <div key={u.uid} className="profiles-row">
                  <span className="truncate">{u.username}</span>
                  <span className="truncate">{u.email}</span>
                  <span>{u.phone || "Not set"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Non-Registered Techs */}
        <div className="profiles-card">
          <h2>
            <div className="profiles-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
              <FaUser />
            </div>
            Technicians (Non-Registered)
          </h2>
          {notSubmittedTechs.length === 0 ? (
            <p className="profiles-empty">0 records available.</p>
          ) : (
            <div className={`profiles-table ${notSubmittedTechs.length > 2 ? 'profiles-scrollable' : ''}`}>
              {notSubmittedTechs.map((t) => (
                <div key={t.uid} className="profiles-row">
                  <span className="truncate">{t.username || t.fullName}</span>
                  <span className="truncate">{t.email}</span>
                  <span>{t.phone || "Not set"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Techs */}
        <div className="profiles-card">
          <h2>
            <div className="profiles-icon" style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)' }}>
              <FaClock />
            </div>
            Technicians (Under Review)
          </h2>
          {nonRegisteredTechs.length === 0 ? (
            <p className="profiles-empty">No technicians are awaiting approval.</p>
          ) : (
            <div className={`profiles-table ${nonRegisteredTechs.length > 2 ? 'profiles-scrollable' : ''}`}>
              {nonRegisteredTechs.map((t) => (
                <div key={t.uid} className="profiles-row">
                  <span className="truncate">{t.username || t.fullName}</span>
                  <span className="truncate">{t.email}</span>
                  <span>{t.phone || "Not set"}</span>
                  <div className="profiles-actions">
                    <button className="profiles-btn profiles-view" onClick={() => handleViewTech(t, 'pending')}>View</button>
                    <button className="profiles-btn profiles-approve" onClick={() => updateStatus(t.uid, "approved")}>Approve</button>
                    <button className="profiles-btn profiles-reject" onClick={() => updateStatus(t.uid, "rejected")}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registered Techs */}
        <div className="profiles-card">
          <h2>
            <div className="profiles-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
              <FaTools />
            </div>
            Technicians (Registered)
          </h2>
          {registeredTechs.length === 0 ? (
            <p className="profiles-empty">No approved technicians found.</p>
          ) : (
            <div className={`profiles-table ${registeredTechs.length > 2 ? 'profiles-scrollable' : ''}`}>
              {registeredTechs.map((t) => (
                <div key={t.uid} className="profiles-row">
                  <span className="truncate">{t.username || t.fullName}</span>
                  <span className="truncate">{t.email}</span>
                  <span>{t.phone || "Not set"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Freelance Techs - Removed per request */}
        
        {/* Shop Owners - Removed per request */}
      </main>
      </div>

      {/* Modal */}
      {selectedTech && (
        <div className="profiles-modal-overlay" onClick={() => { setSelectedTech(null); setShopData(null); }}>
          <div className="profiles-modal" onClick={(e) => e.stopPropagation()}>
            <button className="profiles-modal-close" onClick={() => { setSelectedTech(null); setShopData(null); }}>
              <FaTimes />
            </button>

            {/* Profile Photo */}
            <div className="profile-photo-container">
              <img 
                src={selectedTech.profileImage || '/assets/images/profile.png'} 
                alt="Profile" 
                className="profile-photo"
                onError={(e) => {
                  e.currentTarget.src = '/assets/images/profile.png';
                }}
              />
            </div>

            <h2>{selectedTech.username || selectedTech.fullName}</h2>
            
            {/* Information - Only for non-shop owner tiles */}
            {viewingFromTile !== 'shopOwners' && (
              <div className="modal-section">
                <h3>📋 Information</h3>
            <p><strong>Email:</strong> {selectedTech.email}</p>
            <p><strong>Phone:</strong> {selectedTech.phone || "Not set"}</p>
                    <p><strong>Full Name:</strong> {selectedTech.fullName || "Not set"}</p>
                <p><strong>User ID:</strong> {selectedTech.uid}</p>
                <p><strong>Account Created:</strong> {selectedTech.createdAt && selectedTech.createdAt !== '' ? (() => {
                  try {
                    const date = new Date(selectedTech.createdAt);
                    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
                  } catch {
                    return "-";
                  }
                })() : "-"}</p>
                <p><strong>Last Login:</strong> {selectedTech.lastLogin && selectedTech.lastLogin !== '' ? (() => {
                  try {
                    const date = new Date(selectedTech.lastLogin);
                    return isNaN(date.getTime()) ? "Never" : date.toLocaleDateString();
                  } catch {
                    return "Never";
                  }
                })() : "Never"}</p>
                <p><strong>Location:</strong> {selectedTech.location || "Not set"}</p>
                {selectedTech.submitted && (
                  <p><strong>Availability:</strong> 
                    <span className={`status-badge ${selectedTech.isActive ? 'active' : 'inactive'}`}>
                      {selectedTech.isActive ? '🟢 Available' : '🔴 Unavailable'}
                    </span>
                    {selectedTech.isBlocked && <span className="status-badge blocked">🚫 Blocked</span>}
                  </p>
                )}
                {selectedTech.loginStatus !== undefined && (
                  <p><strong>Status:</strong> 
                    <span className={`status-badge ${selectedTech.isOnline ? 'active' : 'inactive'}`}>
                      {selectedTech.isOnline ? '🟢 Online' : '🔴 Offline'}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Shop Information - Only when viewing from Shop Owners tile */}
            {selectedTech.hasShop && viewingFromTile === 'shopOwners' && (
              <div className="modal-section">
                <h3>🏪 Shop Information</h3>
                <p><strong>Shop Name:</strong> {shopData?.name || "Not set"}</p>
                <p><strong>Shop Address:</strong> {shopData?.address || selectedTech.location || selectedTech.address || "Not set"}</p>
                <p><strong>Opening Hours:</strong> {shopData?.workingHours ? `${shopData.workingHours.startTime} - ${shopData.workingHours.endTime}` : "Not set"}</p>
                <p><strong>Opening Days:</strong> {shopData?.workingDays ? shopData.workingDays.join(", ") : "Not set"}</p>
                <p><strong>Type:</strong> {selectedTech.type === 'shop' ? '🏪 Shop Owner' : '🔧 Freelance'}</p>
                
                    {selectedTech.categories?.length ? (
                  <p><strong>Service Categories:</strong> {selectedTech.categories.join(", ")}</p>
                ) : (
                  <p><strong>Service Categories:</strong> None specified</p>
                )}
                
                <p><strong>Years in Service:</strong> {selectedTech.yearsInService || "-"}</p>
              </div>
            )}

            {/* Freelance Information - Only when viewing from Freelance Technicians tile */}
            {!selectedTech.hasShop && selectedTech.type === 'freelance' && viewingFromTile === 'freelance' && (
              <div className="modal-section">
                <h3>🔧 Freelance Information</h3>
                <p><strong>Service Address:</strong> {selectedTech.location || selectedTech.address || "Not set"}</p>
                <p><strong>Working Hours:</strong> {selectedTech.workingHours ? `${selectedTech.workingHours.startTime} - ${selectedTech.workingHours.endTime}` : "Not set"}</p>
                <p><strong>Working Days:</strong> {selectedTech.workingDays ? selectedTech.workingDays.join(", ") : "Not set"}</p>
                <p><strong>Type:</strong> 🔧 Freelance</p>
                
                {selectedTech.categories?.length ? (
                  <p><strong>Service Categories:</strong> {selectedTech.categories.join(", ")}</p>
                ) : (
                  <p><strong>Service Categories:</strong> None specified</p>
                )}
                
                <p><strong>Years in Service:</strong> {selectedTech.yearsInService || "-"}</p>
              </div>
            )}

            {/* Submitted Documentation & Requirements - Only for technicians under review (pending) */}
            {selectedTech.status === 'pending' && selectedTech.submitted && (
              <div className="modal-section">
                <h3><FaImage style={{ marginRight: '8px' }} />Submitted Documentation & Requirements</h3>
                
                {/* Photos Grid */}
                <div className="photos-grid">
                  {/* Profile Photo (Freelance) or Recent Photo (Shop) */}
                  <div className="photo-item">
                    <h4>{selectedTech.hasShop ? '📸 Recent Photo' : '📸 Profile Photo'}</h4>
                    {selectedTech.hasShop ? (
                      selectedTech.recentPhoto ? (
                        <img 
                          src={selectedTech.recentPhoto} 
                          alt={selectedTech.hasShop ? 'Recent' : 'Profile'} 
                          className="tech-photo" 
                          onClick={() => setSelectedPhoto({ url: selectedTech.recentPhoto!, title: 'Recent Photo' })}
                        />
                      ) : (
                        <div className="no-photo">No data</div>
                      )
                    ) : (
                      selectedTech.profilePhoto ? (
                        <img 
                          src={selectedTech.profilePhoto} 
                          alt={selectedTech.hasShop ? 'Recent' : 'Profile'} 
                          className="tech-photo" 
                          onClick={() => setSelectedPhoto({ url: selectedTech.profilePhoto!, title: 'Profile Photo' })}
                        />
                      ) : (
                        <div className="no-photo">No data</div>
                      )
                    )}
                  </div>

                  {/* Government ID */}
                  <div className="photo-item">
                    <h4>🆔 Government ID</h4>
                    {selectedTech.governmentId ? (
                      <img 
                        src={selectedTech.governmentId} 
                        alt="Government ID" 
                        className="tech-photo" 
                        onClick={() => setSelectedPhoto({ url: selectedTech.governmentId!, title: 'Government ID' })}
                      />
                    ) : (
                      <div className="no-photo">No data</div>
                    )}
                  </div>

                  {/* Business Permit (Shop Only) */}
                  {selectedTech.hasShop && (
                    <div className="photo-item">
                      <h4>📄 Business Permit</h4>
                      {selectedTech.businessPermit ? (
                        <img 
                          src={selectedTech.businessPermit} 
                          alt="Business Permit" 
                          className="tech-photo" 
                          onClick={() => setSelectedPhoto({ url: selectedTech.businessPermit!, title: 'Business Permit' })}
                        />
                      ) : (
                        <div className="no-photo">No data</div>
                      )}
                    </div>
                  )}

                  {/* Certificate (Freelance Only) */}
                  {!selectedTech.hasShop && (
                    <div className="photo-item">
                      <h4>🎓 Certificate</h4>
                      {selectedTech.certificate ? (
                        <img 
                          src={selectedTech.certificate} 
                          alt="Certificate" 
                          className="tech-photo" 
                          onClick={() => setSelectedPhoto({ url: selectedTech.certificate!, title: 'Certificate' })}
                        />
                      ) : (
                        <div className="no-photo">No data</div>
                      )}
                    </div>
                  )}

                  {/* Location Photo */}
                  <div className="photo-item">
                    <h4>📍 Location Photo</h4>
                    {(selectedTech.locationPhoto || shopData?.locationPhoto) ? (
                      <img 
                        src={selectedTech.locationPhoto || shopData?.locationPhoto} 
                        alt="Location" 
                        className="tech-photo" 
                        onClick={() => setSelectedPhoto({ url: selectedTech.locationPhoto || shopData?.locationPhoto!, title: 'Location Photo' })}
                      />
                    ) : (
                      <div className="no-photo">No data</div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="photo-viewer-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="photo-viewer-close" onClick={() => setSelectedPhoto(null)}>
              <FaTimes />
            </button>
            <img src={selectedPhoto.url} alt={selectedPhoto.title} className="photo-viewer-img" />
            <p className="photo-viewer-title">{selectedPhoto.title}</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
