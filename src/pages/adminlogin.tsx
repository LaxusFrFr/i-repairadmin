import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Notification from '../components/Notification';
import { useNotification } from '../hooks/useNotification';

import '../styles/adminlogin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false); // 👈 trigger reveal
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showEmailHistory, setShowEmailHistory] = useState(false);
  const [emailHistory, setEmailHistory] = useState<string[]>([]);
  const notification = useNotification();
  
  // Refs for keyboard navigation
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setReveal(true), 500); // start reveal shortly after load
    return () => clearTimeout(t);
  }, []);

  // Load email history from localStorage
  useEffect(() => {
    const savedEmails = localStorage.getItem('adminEmailHistory');
    if (savedEmails) {
      setEmailHistory(JSON.parse(savedEmails));
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      notification.notify('Please enter email and password.', 'error');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, 'admins', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        notification.notify('Login successful!', 'success');
      } else {
        await setDoc(doc(db, 'admins', user.uid), {
          email: user.email,
          createdAt: new Date()
        });
        notification.notify('Admin record created automatically!', 'success');
      }

      // Save email to history
      if (email && !emailHistory.includes(email)) {
        const updatedHistory = [email, ...emailHistory.slice(0, 4)]; // Keep only 5 recent emails
        setEmailHistory(updatedHistory);
        localStorage.setItem('adminEmailHistory', JSON.stringify(updatedHistory));
      }

      navigate('/dashboard');
    } catch (error: any) {
      let message = '';
      console.error('Login error code:', error.code);
      
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'The email address format is invalid. Please check and try again.';
          break;
        case 'auth/user-disabled':
          message = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/user-not-found':
          message = 'No account found with this email address. Please check your email or sign up.';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password. Please try again or use "Forgot Password?" to reset.';
          break;
        case 'auth/invalid-credential':
          message = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed login attempts. Please wait a few minutes before trying again.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your internet connection and try again.';
          break;
        case 'auth/operation-not-allowed':
          message = 'Email/password login is not enabled. Please contact support.';
          break;
        case 'auth/invalid-action-code':
          message = 'Invalid verification code. Please request a new one.';
          break;
        default:
          message = `Login failed: ${error.message || 'Something went wrong. Please try again.'}`;
      }
      notification.notify(message, 'error');
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      notification.notify('Please enter your email address.', 'error');
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      notification.notify('Password reset email sent! Check your inbox and spam folder.', 'success');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      let message = '';
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Invalid email address format.';
          break;
        case 'auth/user-not-found':
          message = 'No user found with this email.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many attempts. Try again later.';
          break;
        default:
          message = 'Something went wrong. Please try again.';
      }
      notification.notify(message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Keyboard navigation handlers
  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      passwordRef.current?.focus();
    }
  };

  const handlePasswordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // Email history handlers
  const handleEmailFocus = () => {
    setShowEmailHistory(true);
  };

  const handleEmailBlur = () => {
    // Delay hiding to allow clicking on history items
    setTimeout(() => setShowEmailHistory(false), 200);
  };

  const handleEmailSelect = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setShowEmailHistory(false);
    passwordRef.current?.focus();
  };

  const handleRemoveEmail = (emailToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the email selection
    const updatedHistory = emailHistory.filter(email => email !== emailToRemove);
    setEmailHistory(updatedHistory);
    localStorage.setItem('adminEmailHistory', JSON.stringify(updatedHistory));
  };

  return (
    <div className="login-gradient">
      <div className="login-wrapper">
        {/* Left Section */}
        <div className="login-left">
          <img src="../../assets/images/i-repair.png" alt="I-Repair Logo" className="logo" />
          <h1 className="title">I-Repair</h1>
          <p className="subtitle">Quick Fix, Smart Choice</p>
        </div>

        {/* Divider */}
        <div className={`divider ${reveal ? 'divider-show' : ''}`}></div>

        {/* Right Section (hidden first, then slides right) */}
        <div className={`login-right ${reveal ? 'reveal' : ''}`}>
          <div className="login-card">
            <h2 className="welcome-text">Welcome Back!</h2>
            <p className="instruction-text">Please login your details to continue</p>

            <div className="form">
              <div className="login-input-group">
                <label className="login-label">
                  Email <span className="required-asterisk">*</span>
                </label>
                <div className="email-input-container">
                  <input
                    ref={emailRef}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyPress={handleEmailKeyPress}
                    onFocus={handleEmailFocus}
                    onBlur={handleEmailBlur}
                    className="input"
                  />
                  {email && (
                    <button
                      type="button"
                      className="email-clear-button"
                      onClick={() => setEmail('')}
                      title="Clear email"
                    >
                      ×
                    </button>
                  )}
                  {showEmailHistory && emailHistory.length > 0 && (
                    <div className="email-history-dropdown">
                      {emailHistory.map((historyEmail, index) => (
                        <div
                          key={index}
                          className="email-history-item"
                          onClick={() => handleEmailSelect(historyEmail)}
                        >
                          <span className="email-text">{historyEmail}</span>
                          <button
                            type="button"
                            className="email-remove-button"
                            onClick={(e) => handleRemoveEmail(historyEmail, e)}
                            title="Remove this email"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="login-input-group">
                <label className="login-label">
                  Password <span className="required-asterisk">*</span>
                </label>
                <div className="password-input-container">
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyPress={handlePasswordKeyPress}
                    className="input"
                  />
                  {password && (
                    <button
                      type="button"
                      className="password-toggle-button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "👁" : "👁‍🗨"}
                    </button>
                  )}
                </div>
              </div>
              <button className="login-button" onClick={handleLogin}>
                Log In
              </button>
              
              <button 
                className="forgot-password-button" 
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </button>
            </div>

            <div className="signup-section">
              <button 
                className="login-signup-button"
                onClick={() => navigate('/signup')}
              >
                Don't have an account?
              </button>
            </div>

            <p className="footer-text">© 2025 I-Repair, All rights reserved</p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reset Password</h3>
            <p>Enter your email address and we'll send you a password reset link.</p>
            
            <div className="modal-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                className="input"
              />
              
              <div className="modal-buttons">
                <button 
                  className="cancel-button" 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="reset-button" 
                  onClick={handleForgotPassword}
                  disabled={isResetting}
                >
                  {isResetting ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
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
  );
}