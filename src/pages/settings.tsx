import React, { useState, useEffect } from "react";
import "../styles/settings.css";
import { FaCog, FaPalette, FaUser, FaCamera, FaTrash, FaKey, FaUserTimes, FaServer, FaDatabase, FaCode, FaLaptopCode } from "react-icons/fa";
import DashboardLayout from "./dashboardlayout";
import ConfirmationModal from "../components/ConfirmationModal";
import { useConfirmation } from "../hooks/useConfirmation";
import Notification from "../components/Notification";
import { useNotification } from "../hooks/useNotification";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged, deleteUser, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/cloudinary";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const confirmation = useConfirmation();
  const notification = useNotification();
  const [settings, setSettings] = useState({
    theme: "default"
  });

  const [activeTab, setActiveTab] = useState("account");
  const [adminData, setAdminData] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Apply theme immediately
    if (key === 'theme') {
      applyTheme(value);
    }
  };

  const applyTheme = (theme: string) => {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-default', 'theme-dark');
    
    // Apply the new theme class
    if (theme === 'dark') {
      body.classList.add('theme-dark');
    } else {
      body.classList.add('theme-default');
    }
  };

  // Load saved theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') || 'default';
    setSettings(prev => ({ ...prev, theme: savedTheme }));
    // Don't apply theme here - let it persist from previous page
  }, []);

  // Fetch admin data and profile image
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists()) {
            const data = adminDoc.data();
            setAdminData(data);
            setProfileImage(data.profileImage || null);
          }
        } catch (error) {
          console.error('Error fetching admin data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      notification.notify('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notification.notify('Image size must be less than 5MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const publicId = `admin_profile_${auth.currentUser?.uid}_${Date.now()}`;
      const uploadedUrl = await uploadToCloudinary(file, 'admin-profiles', publicId);
      
      setProfileImage(uploadedUrl);
      
      // Update Firestore
      if (auth.currentUser) {
        await updateDoc(doc(db, 'admins', auth.currentUser.uid), {
          profileImage: uploadedUrl,
        });
      }
      
      notification.notify('Profile picture updated successfully!', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      notification.notify('Failed to upload image. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveProfileImage = async () => {
    const result = await confirmation.confirm(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      'danger'
    );

    if (result) {
      try {
        setProfileImage(null);
        
        // Update Firestore
        if (auth.currentUser) {
          await updateDoc(doc(db, 'admins', auth.currentUser.uid), {
            profileImage: null,
          });
        }
        
        notification.notify('Profile picture removed successfully!', 'success');
      } catch (error) {
        console.error('Error removing image:', error);
        notification.notify('Failed to remove image. Please try again.', 'error');
      }
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      notification.notify('Please fill in all password fields', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      notification.notify('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      notification.notify('New password must be at least 6 characters', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowChangePassword(false);

      notification.notify('Password changed successfully!', 'success');
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        notification.notify('Current password is incorrect', 'error');
      } else if (error.code === 'auth/weak-password') {
        notification.notify('New password is too weak', 'error');
      } else {
        notification.notify('Failed to change password. Please try again.', 'error');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmMessage = `Are you sure you want to delete your account?\n\nThis action cannot be undone and will:\n- Delete your Firebase Auth account\n- Delete all your admin data from Firestore\n- Remove your profile picture\n\nType "DELETE" to confirm:`;
    
    const userInput = window.prompt(confirmMessage);
    if (userInput !== 'DELETE') {
      return;
    }

    setIsDeletingAccount(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Delete Firestore document
      await deleteDoc(doc(db, 'admins', user.uid));

      // Delete Firebase Auth account
      await deleteUser(user);

      alert('Account deleted successfully. You will be redirected to the login page.');
      navigate('/login');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('Please log out and log back in, then try deleting your account again.');
      } else {
        alert('Failed to delete account. Please try again.');
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-theme', settings.theme);
  }, [settings.theme]);

  const settingsTabs = [
    { id: "account", label: "Account", icon: FaUser },
    { id: "appearance", label: "Appearance", icon: FaPalette },
    { id: "system", label: "System", icon: FaCog }
  ];

  return (
    <DashboardLayout activeMenu="settings">
      <div className="settings-container">
        <div className="header-section">
          <h2 className="page-title">
            <FaCog className="page-icon" style={{ color: '#667eea' }} />
            Settings
          </h2>
          <p className="page-subtitle">Configure system preferences and administrative settings.</p>
        </div>

        <div className="settings-content">
          <div className="settings-layout">
            {/* Settings Navigation */}
            <div className="settings-sidebar">
              <div className="settings-nav">
                {settingsTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <IconComponent className="nav-icon" style={{ color: '#ffffff' }} />
                      <span className="nav-label" style={{ color: '#ffffff' }}>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settings Content */}
            <div className="settings-main">
              <div className="settings-card">
                {/* Account Settings */}
                {activeTab === "account" && (
                  <div className="settings-section">
                    <h3 className="section-title">Account Settings</h3>
                    <div className="settings-grid">
                      {/* Complete Account Section */}
                      <div className="account-section">
                        {/* Profile Picture Section */}
                        <div className="profile-picture-section">
                          <div className="profile-picture-container">
                            <div className="profile-picture-wrapper">
                              <img
                                src={profileImage || "/assets/images/profile.png"}
                                alt="Profile"
                                className="profile-picture"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/assets/images/profile.png";
                                }}
                              />
                              <div className="profile-overlay">
                                <FaCamera className="camera-icon" />
                              </div>
                            </div>
                            <div className="profile-actions">
                            <label className="upload-button" htmlFor="profile-upload">
                              <FaCamera className="button-icon" />
                              {isUploading ? 'Uploading...' : 'Update'}
                            </label>
                              <input
                                id="profile-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleProfileImageUpload}
                                style={{ display: 'none' }}
                                disabled={isUploading}
                              />
                              {profileImage && (
                                <button
                                  className="remove-button"
                                  onClick={handleRemoveProfileImage}
                                  disabled={isUploading}
                                >
                                  <FaTrash className="button-icon" />
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="profile-info">
                            <h4 className="profile-name">{adminData?.fullName || 'Admin'}</h4>
                            <p className="profile-email">{adminData?.email || 'admin@example.com'}</p>
                            <p className="profile-role">Administrator</p>
                          </div>
                        </div>
                        
                        {/* Account Actions */}
                        <div className="account-actions">
                          <button
                            className="action-button change-password-button"
                            onClick={() => setShowChangePassword(!showChangePassword)}
                          >
                            <FaKey className="button-icon" />
                            Change Password
                          </button>
                          
                          <button
                            className="action-button delete-account-button"
                            onClick={handleDeleteAccount}
                            disabled={isDeletingAccount}
                          >
                            <FaUserTimes className="button-icon" />
                            {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Settings */}
                {activeTab === "appearance" && (
                  <div className="settings-section">
                    <h3 className="section-title">Appearance Settings</h3>
                    <div className="settings-grid">
                      <div className="setting-item">
                        <label className="setting-label">Theme</label>
                        <select
                          className="setting-select"
                          value={settings.theme}
                          onChange={(e) => handleSettingChange('theme', e.target.value)}
                        >
                          <option value="default">Default</option>
                          <option value="dark">Dark</option>
                        </select>
                        <p className="setting-description">
                          {settings.theme === 'default' 
                            ? 'Current colorful animated gradient background' 
                            : 'Original black gradient background'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Save Button */}
                    <div className="settings-save-section">
                      <button className="save-button" onClick={() => {
                        localStorage.setItem('admin-theme', settings.theme);
                        notification.notify('Theme saved successfully!', 'success');
                      }}>
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* System Settings */}
                {activeTab === "system" && (
                  <div className="settings-section">
                    <h3 className="section-title">System Settings</h3>
                    <div className="system-info-section">
                      <div className="system-item">
                        <FaServer className="system-icon" style={{ color: '#667eea' }} />
                        <div className="system-details">
                          <h4>Server Status <span className="status-indicator">●</span></h4>
                          <p>All systems operational</p>
                        </div>
                      </div>
                      <div className="system-item">
                        <FaDatabase className="system-icon" style={{ color: '#764ba2' }} />
                        <div className="system-details">
                          <h4>Database <span className="status-indicator">●</span></h4>
                          <p>Firestore connected</p>
                        </div>
                      </div>
                      <div className="system-item">
                        <FaCode className="system-icon" style={{ color: '#f093fb' }} />
                        <div className="system-details">
                          <h4>Version</h4>
                          <p>I-Repair Admin v1.0.0</p>
                        </div>
                      </div>
                      <div className="system-item">
                        <FaLaptopCode className="system-icon" style={{ color: '#4facfe' }} />
                        <div className="system-details">
                          <h4>Framework</h4>
                          <p>React + TypeScript</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Change Password</h3>
            <p>Enter your current password and new password to update your account.</p>
            <div className="modal-form">
              <input
                type="password"
                className="input"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('new-password-input')?.focus();
                  }
                }}
              />
              <input
                id="new-password-input"
                type="password"
                className="input"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('confirm-password-input')?.focus();
                  }
                }}
              />
              <input
                id="confirm-password-input"
                type="password"
                className="input"
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (currentPassword && newPassword && confirmNewPassword) {
                      handleChangePassword();
                    }
                  }
                }}
              />
              <div className="modal-buttons">
                <button
                  className="cancel-button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="reset-button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Updating...' : 'Update'}
                </button>
              </div>
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

      {/* Notification */}
      <Notification
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={notification.close}
      />
    </DashboardLayout>
  );
}