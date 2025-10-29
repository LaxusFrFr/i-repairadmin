import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./dashboardlayout";
import ConfirmationModal from "../components/ConfirmationModal";
import Notification from "../components/Notification";
import { useNotification } from "../hooks/useNotification";
import { convertFirestoreTimestamp, formatDateOnly } from "../utils/firestoreHelpers";
import "../styles/technicians.css"; // ✅ technicians styles
import { FaTrash, FaEye, FaPause, FaBan, FaTools, FaPlus, FaTimes } from "react-icons/fa";

const formatTime = (time24: string) => {
  if (!time24) return "Not set";
  try {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return time24; // Return original if conversion fails
  }
};

interface TechnicianData {
  uid: string;
  username: string;
  email: string;
  phone?: string;
  fullName?: string;
  profileImage?: string;
  isSuspended?: boolean;
  isBanned?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  lastLogin?: string;
  isOnline?: boolean;
  loginStatus?: string;
  location?: string;
  address?: string;
  status?: "pending" | "approved" | "rejected";
  submitted?: boolean;
  type?: "shop" | "freelance";
  hasShop?: boolean;
  categories?: string[];
  yearsInService?: string;
  workingHours?: {
    startTime: string;
    endTime: string;
  };
  workingDays?: string[];
  shopName?: string;
  shopAddress?: string;
  shopOpeningHours?: string;
  isBlocked?: boolean;
  isActive?: boolean;
  rating?: number;
  totalJobs?: number;
  completedJobs?: number;
  // Photo fields
  profilePhoto?: string;
  recentPhoto?: string;
  businessPermit?: string;
  governmentId?: string;
  certificate?: string;
  locationPhoto?: string;
  shopLocationPhoto?: string;
  freelanceLocationPhoto?: string;
}

export default function Technicians() {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState<TechnicianData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTechnicianModal, setShowAddTechnicianModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const notification = useNotification();
  
  // View Modal State
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianData | null>(null);
  const [shopData, setShopData] = useState<any | null>(null);
  
  // Photo Viewer Modal State
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, title: string} | null>(null);
  
  // Add Technician Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmType, setConfirmType] = useState<'danger' | 'warning' | 'info'>('warning');

  // 🔥 Fetch technicians in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "technicians"), // ✅ use technicians collection
      (snapshot) => {
        setTechnicians(
          snapshot.docs
            .filter((doc) => {
              const data = doc.data();
              // Only show registered technicians (approved and submitted)
              return !data.isDeleted && 
                     data.status === 'approved' && 
                     data.submitted === true;
            })
            .map((doc) => {
            const data = doc.data() as any;
            
            // Handle Firestore timestamp conversion for createdAt
            let createdAt = convertFirestoreTimestamp(data.createdAt);
            if (!createdAt) {
              createdAt = new Date().toISOString();
            }
            
            // Handle Firestore timestamp conversion for lastLogin
            let lastLogin = convertFirestoreTimestamp(data.lastLogin);
            
            return {
              uid: doc.id,
              username: data.username || data.displayName || 'Unknown',
              email: data.email || '',
              phone: data.phone || data.phoneNumber || '',
              fullName: data.fullName || data.displayName || '',
              profileImage: data.profileImage || data.photoURL || '',
              createdAt: createdAt,
              lastLogin: lastLogin,
              location: data.location || data.address || '',
              address: data.address || '',
              isOnline: data.isOnline === true,
              loginStatus: data.loginStatus || 'offline',
              status: data.status || 'pending',
              submitted: data.submitted || false,
              type: data.type || 'freelance',
              hasShop: data.hasShop || false,
              categories: data.categories || [],
              yearsInService: data.yearsInService || '',
              workingHours: data.workingHours || null,
              workingDays: data.workingDays || [],
              shopName: data.shopName || '',
              shopAddress: data.shopAddress || '',
              shopOpeningHours: data.shopOpeningHours || '',
              isBlocked: data.isBlocked || false,
              isActive: data.availability !== false,
              rating: data.averageRating || data.rating || 0,
              totalJobs: data.totalJobs || 0,
              completedJobs: data.completedJobs || 0,
              isSuspended: data.isSuspended || false,
              isBanned: data.isBanned || false,
              isDeleted: data.isDeleted || false,
              // Photo fields
              profilePhoto: data.profilePhoto || null,
              recentPhoto: data.recentPhoto || null,
              businessPermit: data.businessPermit || null,
              governmentId: data.governmentId || null,
              certificate: data.certificate || null,
              locationPhoto: data.locationPhoto || data.shopLocationPhoto || data.freelanceLocationPhoto || null,
              shopLocationPhoto: data.shopLocationPhoto || null,
              freelanceLocationPhoto: data.freelanceLocationPhoto || null
            };
          })
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 👁️ View technician details
  const handleView = async (tech: TechnicianData) => {
    setSelectedTechnician(tech);

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

  // Photo Viewer Functions
  const handlePhotoClick = (url: string, title: string) => {
    setSelectedPhoto({ url, title });
    setShowPhotoViewer(true);
  };

  const closePhotoViewer = () => {
    setShowPhotoViewer(false);
    setSelectedPhoto(null);
  };

  // ⏸️ Suspend/Unsuspend technician
  const handleSuspend = async (uid: string, username: string, isCurrentlySuspended: boolean) => {
    const action = isCurrentlySuspended ? 'unsuspend' : 'suspend';
    
    setConfirmTitle(isCurrentlySuspended ? "Unsuspend Technician" : "Suspend Technician");
    setConfirmMessage(`Are you sure you want to ${action} ${username}?`);
    setConfirmType('warning');
    setConfirmAction(() => async () => {
      try {
        await setDoc(doc(db, "technicians", uid), {
          isSuspended: !isCurrentlySuspended,
          suspendedAt: !isCurrentlySuspended ? new Date().toISOString() : null,
          suspensionReason: !isCurrentlySuspended ? "Suspended by admin" : null
        }, { merge: true });
        
        setShowConfirmModal(false);
        setConfirmAction(null);
      } catch (error) {
        console.error(`Error ${action}ing technician:`, error);
        alert(`Failed to ${action} technician`);
        setShowConfirmModal(false);
        setConfirmAction(null);
      }
    });
    setShowConfirmModal(true);
  };

  // 🚫 Ban technician
  const handleBan = async (uid: string, username: string) => {
    setConfirmTitle("Ban Technician");
    setConfirmMessage(`Are you sure you want to BAN ${username}? This will permanently prevent them from accessing the platform.`);
    setConfirmType('danger');
    setConfirmAction(() => async () => {
      try {
        await setDoc(doc(db, "technicians", uid), {
          isBanned: true,
          bannedAt: new Date().toISOString(),
          bannedReason: "Banned by admin"
        }, { merge: true });
        
        setShowConfirmModal(false);
        setConfirmAction(null);
      } catch (error) {
        console.error("Error banning technician:", error);
        alert("Failed to ban technician");
        setShowConfirmModal(false);
        setConfirmAction(null);
      }
    });
    setShowConfirmModal(true);
  };

  // ❌ Delete technician completely (Firestore, Auth, Cloudinary)
  const handleDelete = async (uid: string) => {
    setConfirmTitle("Delete Technician");
    setConfirmMessage("Are you sure you want to delete this technician? This will mark the technician as deleted and remove them from the system. The shop will also be deleted if it exists.");
    setConfirmType('danger');
    setConfirmAction(() => async () => {
      try {
        // Get technician data first to access shop and photos
        const technicianDoc = await getDoc(doc(db, "technicians", uid));
        const technicianData = technicianDoc.data();
        
        // Mark technician as deleted and blocked
        await setDoc(doc(db, "technicians", uid), {
          isDeleted: true,
          isBlocked: true,
          deletedAt: new Date().toISOString(),
          deletedBy: "admin"
        }, { merge: true });
        
        // Delete shop document if exists
        const shopDoc = await getDoc(doc(db, "shops", uid));
        if (shopDoc.exists()) {
          await deleteDoc(doc(db, "shops", uid));
        }
        
        // Delete Cloudinary photos
        const cloudinaryUrls = [];
        if (technicianData?.profilePhoto) cloudinaryUrls.push(technicianData.profilePhoto);
        if (technicianData?.recentPhoto) cloudinaryUrls.push(technicianData.recentPhoto);
        if (technicianData?.businessPermit) cloudinaryUrls.push(technicianData.businessPermit);
        if (technicianData?.governmentId) cloudinaryUrls.push(technicianData.governmentId);
        if (technicianData?.certificate) cloudinaryUrls.push(technicianData.certificate);
        if (technicianData?.locationPhoto) cloudinaryUrls.push(technicianData.locationPhoto);
        if (technicianData?.shopLocationPhoto) cloudinaryUrls.push(technicianData.shopLocationPhoto);
        if (technicianData?.freelanceLocationPhoto) cloudinaryUrls.push(technicianData.freelanceLocationPhoto);
        
        // Delete shop photos if shop exists
        if (shopDoc.exists()) {
          const shopData = shopDoc.data();
          if (shopData?.locationPhoto) cloudinaryUrls.push(shopData.locationPhoto);
        }
        
        // Delete Cloudinary photos
        for (const url of cloudinaryUrls) {
          try {
            const publicId = url.split('/').pop()?.split('.')[0];
            if (publicId) {
              await fetch(`/api/cloudinary/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId })
              });
            }
          } catch (error) {
            console.error('Error deleting Cloudinary photo:', error);
          }
        }
        
        setShowConfirmModal(false);
        setConfirmAction(null);
        notification.notify('Technician deleted successfully! They will be removed from all lists.', 'success');
      } catch (error: any) {
        console.error("Error deleting technician:", error);
        notification.notify('Failed to delete technician: ' + error.message, 'error');
        setShowConfirmModal(false);
        setConfirmAction(null);
      }
    });
    setShowConfirmModal(true);
  };

  // ➕ Add technician
  const handleAddTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !phone || !password || !confirmPassword) {
      notification.notify('Please fill in all fields.', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      notification.notify('Passwords do not match.', 'error');
      return;
    }
    
    if (phone.length !== 11 || !/^\d{11}$/.test(phone)) {
      notification.notify('Please enter a valid 11-digit phone number.', 'error');
      return;
    }

    setIsCreating(true);
    try {
      // Create technician with Firebase Auth (causes logout - original behavior)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save technician details to Firestore
      await setDoc(doc(db, "technicians", user.uid), {
        uid: user.uid,
        username: username,
        email: email,
        phone: phone,
        createdAt: new Date().toISOString(),
        isSuspended: false,
        isBanned: false,
        isDeleted: false,
        isOnline: false,
        loginStatus: 'offline',
        status: 'pending',
        submitted: false
      });

      notification.notify('Technician created successfully! Please log in again.', 'success');
      
      // Redirect to login after creating technician
      setTimeout(() => {
        navigate('/adminlogin');
      }, 1500);
    } catch (error: any) {
      notification.notify('Error creating technician: ' + error.message, 'error');
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout activeMenu="technicians">
      <div className="technicians-container">
        <div className="header-section">
          <h2 className="page-title">
            <FaTools className="page-icon" style={{ color: '#f59e0b' }} />
            Technician Management
          </h2>
          <p className="page-subtitle">Manage all registered technicians here.</p>
        </div>

        {loading ? (
          <div className="loading">Loading technicians...</div>
        ) : technicians.length === 0 ? (
          <div className="empty-state">No technicians found.</div>
        ) : (
          <div className="technicians-table-wrapper">
            <table className="technicians-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th className="technicians-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((tech) => (
                  <tr key={tech.uid}>
                    <td>
                      <div className="technician-username-cell">
                        <img 
                          src={tech.profileImage || '/assets/images/profile.png'} 
                          alt="Profile" 
                          className="technician-profile-img"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/images/profile.png';
                          }}
                        />
                        <div className="user-details">
                          <span>{tech.username}</span>
                          <div className="status-badges">
                            {tech.type === 'shop' || (tech.hasShop && tech.type !== 'freelance') ? (
                              <span className="status-badge shop-owner">🏪 Shop Owner</span>
                            ) : (
                              <span className="status-badge freelance">🔧 Freelance</span>
                            )}
                            {tech.isBanned && (
                              <span className="status-badge banned">BANNED</span>
                            )}
                            {tech.isSuspended && !tech.isBanned && (
                              <span className="status-badge suspended">SUSPENDED</span>
                            )}
                            {tech.isBlocked && !tech.isBanned && !tech.isSuspended && (
                              <span className="status-badge blocked">BLOCKED</span>
                            )}
                            {tech.status === 'pending' && (
                              <span className="status-badge pending">PENDING</span>
                            )}
                            {tech.status === 'rejected' && (
                              <span className="status-badge rejected">REJECTED</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{tech.email}</td>
                    <td>{tech.phone || "Not set"}</td>
                    <td>
                      <div className="actions-group">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleView(tech)}
                          title="View Details"
                        >
                          <FaEye className="icon" /> View
                        </button>
                        <button
                          className={`action-btn ${tech.isSuspended ? 'unsuspend-btn' : 'suspend-btn'}`}
                          onClick={() => handleSuspend(tech.uid, tech.username, tech.isSuspended || false)}
                          title={tech.isSuspended ? "Unsuspend Technician" : "Suspend Technician"}
                        >
                          <FaPause className="icon" /> {tech.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button
                          className="action-btn ban-btn"
                          onClick={() => handleBan(tech.uid, tech.username)}
                          title="Ban Technician"
                        >
                          <FaBan className="icon" /> Ban
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(tech.uid)}
                          title="Delete Technician"
                        >
                          <FaTrash className="icon" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Technician Button */}
        <button 
          className="add-technician-button"
          onClick={() => setShowAddTechnicianModal(true)}
        >
          <FaPlus className="add-icon" /> Add Technician
        </button>

        {/* Add Technician Modal */}
        {showAddTechnicianModal && (
          <div className="modal-overlay" onClick={() => setShowAddTechnicianModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="technicians-modal-close" 
                onClick={() => {
                  setShowAddTechnicianModal(false);
                  setUsername('');
                  setEmail('');
                  setPhone('');
                  setPassword('');
                  setConfirmPassword('');
                }}
              >
                <FaTimes />
              </button>
              
              <h3>Add New Technician</h3>
              <p>Create a technician account for the I-Repair platform</p>
              
              <form onSubmit={handleAddTechnician} className="modal-form">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      ((e.target as HTMLElement).nextElementSibling as HTMLElement | null)?.focus();
                    }
                  }}
                  className="input"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const phoneInput = (e.target as HTMLElement).nextElementSibling?.querySelector('.phone-input') as HTMLElement | null;
                      phoneInput?.focus();
                    }
                  }}
                  className="input"
                  required
                />
                <div className="phone-input-container">
                  <img 
                    src="https://flagcdn.com/w40/ph.png" 
                    alt="Philippines" 
                    className="phone-flag"
                  />
                  <span className="phone-prefix">+63</span>
                  <input
                    type="tel"
                    placeholder="0XXXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const nextInput = (e.target as HTMLElement).closest('.phone-input-container')?.nextElementSibling?.querySelector('input') as HTMLElement | null;
                      if (nextInput) nextInput.focus();
                    }
                  }}
                    className="phone-input"
                    maxLength={11}
                    required
                  />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      ((e.target as HTMLElement).nextElementSibling as HTMLElement | null)?.focus();
                    }
                  }}
                  className="input"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (username && email && phone && password && confirmPassword) {
                        handleAddTechnician(e as any);
                      }
                    }
                  }}
                  className="input"
                  required
                />
                
                <div className="modal-buttons">
                  <button 
                    type="button"
                    className="cancel-button" 
                    onClick={() => {
                      setShowAddTechnicianModal(false);
                      setUsername('');
                      setEmail('');
                      setPhone('');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="reset-button" 
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Technician Details Modal */}
        {selectedTechnician && (
          <div className="profiles-modal-overlay" onClick={() => { setSelectedTechnician(null); setShopData(null); }}>
            <div className="profiles-modal" onClick={(e) => e.stopPropagation()}>
              <button className="profiles-modal-close" onClick={() => { setSelectedTechnician(null); setShopData(null); }}>
                <FaTimes />
              </button>

              {/* Profile Photo */}
              <div className="profile-photo-container">
                <img 
                  src={selectedTechnician.profileImage || '/assets/images/profile.png'} 
                  alt="Profile" 
                  className="profile-photo"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/images/profile.png';
                  }}
                />
              </div>

              <h2>{selectedTechnician.username || selectedTechnician.fullName}</h2>
              
              {/* Type Badge */}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                {selectedTechnician.type === 'shop' || (selectedTechnician.hasShop && selectedTechnician.type !== 'freelance') ? (
                  <span className="status-badge shop-owner">🏪 Shop Owner</span>
                ) : (
                  <span className="status-badge freelance">🔧 Freelance Technician</span>
                )}
              </div>
              
              {/* Information */}
              <div className="modal-section">
                <h3>📋 Information</h3>
                <p><strong>Email:</strong> {selectedTechnician.email}</p>
                <p><strong>Phone:</strong> {selectedTechnician.phone || "Not set"}</p>
                <p><strong>Full Name:</strong> {selectedTechnician.fullName || "Not set"}</p>
                <p><strong>User ID:</strong> {selectedTechnician.uid}</p>
                <p><strong>Account Created:</strong> {formatDateOnly(selectedTechnician.createdAt)}</p>
                <p><strong>Last Login:</strong> {formatDateOnly(selectedTechnician.lastLogin)}</p>
                <p><strong>Location:</strong> {selectedTechnician.location || "Not set"}</p>
                {selectedTechnician.submitted && (
                  <p><strong>Availability:</strong> 
                    <span className={`status-badge ${selectedTechnician.isActive ? 'active' : 'inactive'}`}>
                      {selectedTechnician.isActive ? '🟢 Available' : '🔴 Unavailable'}
                    </span>
                    {selectedTechnician.isBlocked && <span className="status-badge blocked">🚫 Blocked</span>}
                  </p>
                )}
                {selectedTechnician.loginStatus !== undefined && (
                  <p><strong>Status:</strong> 
                    <span className={`status-badge ${selectedTechnician.isOnline ? 'active' : 'inactive'}`}>
                      {selectedTechnician.isOnline ? '🟢 Online' : '🔴 Offline'}
                    </span>
                  </p>
                )}
                <p><strong>Rating:</strong> {selectedTechnician.rating || 0} ⭐</p>
                <p><strong>Completed Repairs:</strong> {selectedTechnician.completedJobs || 0}</p>
              </div>

              {/* Shop Information */}
              {selectedTechnician.hasShop && (
                <div className="modal-section">
                  <h3>🏪 Shop Information</h3>
                  <p><strong>Shop Name:</strong> {shopData?.name || selectedTechnician.shopName || "Not set"}</p>
                  <p><strong>Shop Address:</strong> {shopData?.address || selectedTechnician.shopAddress || selectedTechnician.location || "Not set"}</p>
                  <p><strong>Opening Hours:</strong> {shopData?.workingHours ? `${formatTime(shopData.workingHours.startTime)} - ${formatTime(shopData.workingHours.endTime)}` : (selectedTechnician.shopOpeningHours || "Not set")}</p>
                  <p><strong>Opening Days:</strong> {shopData?.workingDays ? shopData.workingDays.join(", ") : (selectedTechnician.workingDays ? selectedTechnician.workingDays.join(", ") : "Not set")}</p>
                  <p><strong>Type:</strong> {selectedTechnician.type === 'shop' ? '🏪 Shop Owner' : '🔧 Freelance'}</p>
                  
                  {selectedTechnician.categories?.length ? (
                    <p><strong>Service Categories:</strong> {selectedTechnician.categories.join(", ")}</p>
                  ) : (
                    <p><strong>Service Categories:</strong> None specified</p>
                  )}
                  
                  <p><strong>Years in Service:</strong> {selectedTechnician.yearsInService || "-"}</p>
                </div>
              )}

              {/* Freelance Information */}
              {!selectedTechnician.hasShop && selectedTechnician.type === 'freelance' && (
                <div className="modal-section">
                  <h3>🔧 Freelance Information</h3>
                  <p><strong>Service Address:</strong> {selectedTechnician.location || selectedTechnician.address || "Not set"}</p>
                  <p><strong>Working Hours:</strong> {selectedTechnician.workingHours ? `${formatTime(selectedTechnician.workingHours.startTime)} - ${formatTime(selectedTechnician.workingHours.endTime)}` : "Not set"}</p>
                  <p><strong>Working Days:</strong> {selectedTechnician.workingDays ? selectedTechnician.workingDays.join(", ") : "Not set"}</p>
                  <p><strong>Type:</strong> 🔧 Freelance</p>
                  
                  {selectedTechnician.categories?.length ? (
                    <p><strong>Service Categories:</strong> {selectedTechnician.categories.join(", ")}</p>
                  ) : (
                    <p><strong>Service Categories:</strong> None specified</p>
                  )}
                  
                  <p><strong>Years in Service:</strong> {selectedTechnician.yearsInService || "-"}</p>
                </div>
              )}

              {/* Documentation Photos */}
              <div className="modal-section">
                <h3>📸 Documentation & Requirements</h3>
                
                {/* Photos Grid */}
                <div className="photos-grid">
                  {/* Profile/Recent Photo */}
                  <div className="photo-item">
                    <h4>{selectedTechnician.hasShop ? '📸 Recent Photo' : '📸Recent Photo'}</h4>
                    {selectedTechnician.hasShop ? (
                      selectedTechnician.recentPhoto ? (
                        <img 
                          src={selectedTechnician.recentPhoto} 
                          alt="Recent" 
                          className="tech-photo" 
                          onClick={() => handlePhotoClick(selectedTechnician.recentPhoto!, 'Recent Photo')}
                        />
                      ) : (
                        <div className="no-photo">No data</div>
                      )
                    ) : (
                      selectedTechnician.profilePhoto ? (
                        <img 
                          src={selectedTechnician.profilePhoto} 
                          alt="Profile" 
                          className="tech-photo" 
                          onClick={() => handlePhotoClick(selectedTechnician.profilePhoto!, 'Profile Photo')}
                        />
                      ) : (
                        <div className="no-photo">No data</div>
                      )
                    )}
                  </div>

                  {/* Government ID */}
                  <div className="photo-item">
                    <h4>🆔 Government ID</h4>
                    {selectedTechnician.governmentId ? (
                      <img 
                        src={selectedTechnician.governmentId} 
                        alt="Government ID" 
                        className="tech-photo" 
                        onClick={() => handlePhotoClick(selectedTechnician.governmentId!, 'Government ID')}
                      />
                    ) : (
                      <div className="no-photo">No data</div>
                    )}
                  </div>

                  {/* Business Permit (Shop Only) */}
                  {selectedTechnician.hasShop && (
                    <div className="photo-item">
                      <h4>🏢 Business Permit</h4>
                      {selectedTechnician.businessPermit ? (
                        <img 
                          src={selectedTechnician.businessPermit} 
                          alt="Business Permit" 
                          className="tech-photo" 
                          onClick={() => handlePhotoClick(selectedTechnician.businessPermit!, 'Business Permit')}
                        />
                      ) : (
                        <div className="no-photo">No data</div>
                      )}
                    </div>
                  )}

                  {/* Certificate (Freelance Only) */}
                  {!selectedTechnician.hasShop && selectedTechnician.type === 'freelance' && (
                    <div className="photo-item">
                      <h4>🏆 Proof of Technician Skills</h4>
                      {selectedTechnician.certificate ? (
                        <img 
                          src={selectedTechnician.certificate} 
                          alt="Certificate" 
                          className="tech-photo" 
                          onClick={() => handlePhotoClick(selectedTechnician.certificate!, 'Certificate')}
                        />
                      ) : (
                        <div className="no-photo">No data</div>
                      )}
                    </div>
                  )}

                  {/* Location Photo */}
                  <div className="photo-item">
                    <h4>{selectedTechnician.hasShop ? '🏪 Shop Location Photo' : '🏠 Freelance Location Photo'}</h4>
                    {(selectedTechnician.shopLocationPhoto || selectedTechnician.freelanceLocationPhoto || selectedTechnician.locationPhoto || shopData?.locationPhoto) ? (
                      <img 
                        src={selectedTechnician.shopLocationPhoto || selectedTechnician.freelanceLocationPhoto || selectedTechnician.locationPhoto || shopData?.locationPhoto} 
                        alt="Location" 
                        className="tech-photo" 
                        onClick={() => handlePhotoClick(
                          selectedTechnician.shopLocationPhoto || selectedTechnician.freelanceLocationPhoto || selectedTechnician.locationPhoto || shopData?.locationPhoto!, 
                          selectedTechnician.hasShop ? 'Shop Location Photo' : 'Freelance Location Photo'
                        )}
                      />
                    ) : (
                      <div className="no-photo">No data</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Viewer Modal */}
        {showPhotoViewer && selectedPhoto && (
          <div className="photo-viewer-overlay" onClick={closePhotoViewer}>
            <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
              <button className="photo-viewer-close" onClick={closePhotoViewer}>
                <FaTimes />
              </button>
              <h3 className="photo-viewer-title">{selectedPhoto.title}</h3>
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.title} 
                className="photo-viewer-image"
                onError={(e) => {
                  e.currentTarget.src = '/assets/images/profile.png';
                }}
              />
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          title={confirmTitle}
          message={confirmMessage}
          confirmText="Confirm"
          cancelText="Cancel"
          type={confirmType}
          onConfirm={() => confirmAction && confirmAction()}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
        />

        {/* Notification */}
        <Notification
          isOpen={notification.isOpen}
          message={notification.message}
          type={notification.type}
          onClose={notification.close}
        />
      </div>
    </DashboardLayout>
  );
}
