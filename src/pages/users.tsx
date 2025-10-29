import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import DashboardLayout from "./dashboardlayout";
import ConfirmationModal from "../components/ConfirmationModal";
import { useConfirmation } from "../hooks/useConfirmation";
import Notification from "../components/Notification";
import { useNotification } from "../hooks/useNotification";
import { convertFirestoreTimestamp } from "../utils/firestoreHelpers";
import "../styles/users.css";
import { FaTrash, FaUsers, FaTimes, FaEye, FaPlus } from "react-icons/fa";

interface UserData {
  uid: string;
  username: string;
  email: string;
  phone?: string;
  profileImage?: string;
  fullName?: string;
  createdAt?: string;
  lastLogin?: string;
  location?: string;
  address?: string;
  isOnline?: boolean;
  loginStatus?: string;
  userType?: string;
  isBlocked?: boolean;
  isDeleted?: boolean;
}

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const confirmation = useConfirmation();
  const notification = useNotification();
  
  // Add User Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [pendingUserData, setPendingUserData] = useState<any>(null);

  // 🔥 Fetch users in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        // Handle Firestore timestamp conversion
        let createdAt = convertFirestoreTimestamp(data.createdAt);
        if (!createdAt) {
          createdAt = new Date().toISOString();
        }

        return {
          uid: doc.id,
          username: data.username || data.displayName || 'Unknown',
          email: data.email || '',
          phone: data.phone || data.phoneNumber || '',
          fullName: data.fullName || data.displayName || '',
          profileImage: data.profileImage || data.photoURL || '',
          createdAt: createdAt,
          lastLogin: convertFirestoreTimestamp(data.lastLogin) || data.lastSignInTime || data.lastActive || '',
          location: data.location || data.address || '',
          address: data.address || '',
          isOnline: data.isOnline === true,
          loginStatus: data.loginStatus || 'offline',
          userType: data.userType || 'Regular User',
          isBlocked: data.isBlocked || false,
          isDeleted: data.isDeleted || false
        };
      }).filter(user => !user.isDeleted); // Filter out deleted users
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 👁️ View user
  const handleView = (user: UserData) => {
    setSelectedUser(user);
  };

  // ❌ Delete user
  const handleDelete = async (uid: string) => {
    const ok = await confirmation.confirm(
      "Delete User",
      "Are you sure you want to delete this account? This will delete the Firestore document and mark the account as deleted. The Firebase Auth user will be blocked from accessing the application.",
      "danger"
    );
    if (ok) {
      try {
        // Mark as deleted in Firestore instead of deleting the document
        // This prevents the UID from being reused immediately
        await setDoc(doc(db, "users", uid), {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          isBlocked: true,
          loginStatus: 'deleted'
        }, { merge: true });
        
        notification.notify('User marked as deleted! Auth user is now blocked from accessing the application.', 'success');
      } catch (error: any) {
        console.error('Error deleting user:', error);
        notification.notify('Error deleting user: ' + error.message, 'error');
      }
    }
  };

  // Get admin email from current user
  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.email) {
      setAdminEmail(user.email);
    }
  }, []);

  // ➕ Add user
  const handleAddUser = async (e: React.FormEvent) => {
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

    // Store user data for after password confirmation
    setPendingUserData({ username, email, phone, password });
    
    // Close add user modal and show password modal
    setShowAddUserModal(false);
    setShowPasswordModal(true);
  };

  // Confirm admin password and create user
  const handleConfirmPassword = async () => {
    if (!adminPassword) {
      notification.notify('Please enter your admin password.', 'error');
      return;
    }

    if (!adminEmail) {
      notification.notify('Admin email not found.', 'error');
      return;
    }

    setIsCreating(true);
    
    try {
      // Sign out current admin to prepare for user creation
      await signOut(auth);
      
      // Create user with Firebase Auth (this will sign in as the new user)
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        pendingUserData.email, 
        pendingUserData.password
      );
      const user = userCredential.user;

      // Save user details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: pendingUserData.username,
        email: pendingUserData.email,
        phone: pendingUserData.phone,
        createdAt: new Date().toISOString(),
        isActive: true,
        isBlocked: false,
        isDeleted: false,
        loginStatus: 'offline',
        isOnline: false
      });

      // Sign out the newly created user
      await signOut(auth);
      
      // Sign back in as admin
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

      // Reset form
      setUsername('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setAdminPassword('');
      setPendingUserData(null);
      setShowPasswordModal(false);
      
      notification.notify('User created successfully! You remained logged in.', 'success');
    } catch (error: any) {
      notification.notify('Error creating user: ' + error.message, 'error');
      setAdminPassword('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout activeMenu="users">
      <div className="users-container">
        <div className="header-section">
          <h2 className="page-title">
            <FaUsers className="page-icon" style={{ color: '#10b981' }} />
            Client Management
          </h2>
          <p className="page-subtitle">Manage all registered clients here.</p>
        </div>

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">No users found.</div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th className="users-actions-col">
                    <span className="actions-header-text">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid}>
                    <td>
                      <div className="user-username-cell">
                        <img 
                          src={user.profileImage || '/assets/images/profile.png'} 
                          alt="Profile" 
                          className="user-profile-img"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/images/profile.png';
                          }}
                        />
                        <span>{user.username}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || "-"}</td>
                    <td>
                      <div className="users-actions-group">
                        <button
                          className="view-btn"
                          onClick={() => handleView(user)}
                        >
                          <FaEye className="icon" /> View
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(user.uid)}
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

        {/* Add User Button */}
        <button 
          className="add-user-button"
          onClick={() => setShowAddUserModal(true)}
        >
          <FaPlus className="add-icon" /> Add Client
        </button>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="users-modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="users-modal" onClick={(e) => e.stopPropagation()}>
              <button className="users-modal-close" onClick={() => setSelectedUser(null)}>
                <FaTimes />
              </button>

              {/* Profile Photo */}
              <div className="profile-photo-container">
                <img 
                  src={selectedUser.profileImage || '/assets/images/profile.png'} 
                  alt="Profile" 
                  className="profile-photo"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/images/profile.png';
                  }}
                />
              </div>

              {/* User Information */}
              <div className="users-info-section">
                <h3>📋 Information</h3>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Phone:</strong> {selectedUser.phone || "Not set"}</p>
                <p><strong>Full Name:</strong> {selectedUser.fullName || "Not set"}</p>
                <p><strong>User ID:</strong> {selectedUser.uid}</p>
                <p><strong>Account Created:</strong> {(() => {
                  if (!selectedUser.createdAt) return "Not Available";
                  try {
                    const date = new Date(selectedUser.createdAt);
                    if (isNaN(date.getTime())) {
                      return "Not Available";
                    }
                    return date.toLocaleDateString();
                  } catch (error) {
                    return "Not Available";
                  }
                })()}</p>
                <p><strong>Last Login:</strong> {(() => {
                  if (!selectedUser.lastLogin) return "-";
                  try {
                    const date = new Date(selectedUser.lastLogin);
                    if (isNaN(date.getTime())) {
                      return "Invalid Date";
                    }
                    return date.toLocaleDateString();
                  } catch (error) {
                    return "Invalid Date";
                  }
                })()}</p>
                <p><strong>Location:</strong> {selectedUser.location || selectedUser.address || "Not set"}</p>
                <p><strong>Status:</strong> <span className={selectedUser.isOnline ? "users-status-online" : "users-status-offline"}>
                  {selectedUser.isOnline ? "ONLINE" : "OFFLINE"}
                </span></p>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="users-modal-close" 
                onClick={() => {
                  setShowAddUserModal(false);
                  setUsername('');
                  setEmail('');
                  setPhone('');
                  setPassword('');
                  setConfirmPassword('');
                }}
              >
                <FaTimes />
              </button>
              
              <h3>Add New User</h3>
              <p>Create a user account for the I-Repair platform</p>
              
              <form onSubmit={handleAddUser} className="modal-form">
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
                        const nextInput = (e.target as HTMLElement).closest('.phone-input-container')?.nextElementSibling?.querySelector('input');
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
                        handleAddUser(e as any);
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
                      setShowAddUserModal(false);
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

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          confirmText="Delete"
          cancelText="Cancel"
          type={confirmation.type}
          onConfirm={confirmation.handleConfirm}
          onCancel={confirmation.handleCancel}
        />

        {/* Password Confirmation Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => {
            setShowPasswordModal(false);
            setAdminPassword('');
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="users-modal-close" 
                onClick={() => {
                  setShowPasswordModal(false);
                  setAdminPassword('');
                }}
              >
                <FaTimes />
              </button>
              
              <h3>Confirm Your Password</h3>
              <p>Please enter your admin password to create this user account.</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Your session will be temporarily interrupted, then automatically restored.
              </p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                handleConfirmPassword();
              }} className="modal-form">
                <input
                  type="password"
                  placeholder="Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="input"
                  required
                  autoFocus
                />
                
                <div className="modal-buttons">
                  <button 
                    type="button"
                    className="cancel-button" 
                    onClick={() => {
                      setShowPasswordModal(false);
                      setAdminPassword('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="reset-button" 
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Confirm & Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
