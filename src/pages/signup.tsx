import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Notification from '../components/Notification';
import { useNotification } from '../hooks/useNotification';

import '../styles/signup.css';
import '../styles/adminlogin.css';

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailHistory, setShowEmailHistory] = useState(false);
  const [emailHistory, setEmailHistory] = useState<string[]>([]);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  const notification = useNotification();
  
  // Refs for keyboard navigation
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setReveal(true), 500); // start reveal shortly after load
    return () => clearTimeout(t);
  }, []);

  // Load email history from localStorage
  useEffect(() => {
    const savedEmails = localStorage.getItem('admin-email-history');
    if (savedEmails) {
      setEmailHistory(JSON.parse(savedEmails));
    }
  }, []);

  // Filter emails based on current input
  const filteredEmails = emailHistory.filter(savedEmail =>
    savedEmail.toLowerCase().includes(email.toLowerCase()) && savedEmail !== email
  );

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      notification.notify('Please fill in all fields', 'error');
      return;
    }

    // Validate password requirements
    const passwordValidationErrors = validatePassword(password);
    if (passwordValidationErrors.length > 0) {
      notification.notify('Please meet all password requirements', 'error');
      return;
    }

    if (password !== confirmPassword) {
      notification.notify('Passwords do not match', 'error');
      return;
    }

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional user data to Firestore
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: fullName,
        createdAt: new Date().toISOString(),
        userType: 'admin',
        isActive: true
      });

      // Save email to history
      const updatedHistory = [email, ...emailHistory.filter(e => e !== email)].slice(0, 5);
      setEmailHistory(updatedHistory);
      localStorage.setItem('admin-email-history', JSON.stringify(updatedHistory));

      notification.notify('Account created successfully!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        notification.notify('This email is already registered', 'error');
      } else if (error.code === 'auth/invalid-email') {
        notification.notify('Invalid email address', 'error');
      } else if (error.code === 'auth/weak-password') {
        notification.notify('Password is too weak', 'error');
      } else {
        notification.notify('Signup failed. Please try again.', 'error');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      if (nextRef?.current) {
        nextRef.current.focus();
      } else {
        handleSignup();
      }
    }
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const capitalizedValue = value.replace(/\b\w/g, (char) => char.toUpperCase());
    setFullName(capitalizedValue);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('One number');
    }
    
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('One special character');
    }
    
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordErrors(validatePassword(value));
    
    // Clear confirm password error if passwords match
    if (confirmPassword && value === confirmPassword) {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    if (value && value !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  return (
    <div className="signup-gradient">
      <div className="signup-wrapper">
        <div className="signup-left">
          <img src="../../assets/images/i-repair.png" alt="I-Repair Logo" className="logo" />
          <h1 className="title">I-Repair</h1>
          <p className="subtitle">Quick Fix, Smart Choice</p>
        </div>

        {/* Divider */}
        <div className={`divider ${reveal ? 'divider-show' : ''}`}></div>

        {/* Right Section (hidden first, then slides right) */}
        <div className={`signup-right ${reveal ? 'reveal' : ''}`}>
          <div className="signup-form-container">
            <h2 className="signup-title">Create Account</h2>
            <p className="signup-subtitle">Sign up for I-Repair Admin access.</p>
            
            <div className="signup-form">
              <div className="signup-input-group">
                <input
                  ref={fullNameRef}
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={handleFullNameChange}
                  onKeyPress={(e) => handleKeyPress(e, emailRef)}
                  className="signup-input"
                />
              </div>

              <div className="signup-input-group">
                <input
                  ref={emailRef}
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, passwordRef)}
                  onFocus={() => setShowEmailHistory(true)}
                  onBlur={() => setTimeout(() => setShowEmailHistory(false), 200)}
                  className="signup-input"
                />
                
                {/* Email History Dropdown */}
                {showEmailHistory && filteredEmails.length > 0 && (
                  <div className="signup-email-history">
                    {filteredEmails.map((savedEmail, index) => (
                      <div
                        key={index}
                        className="signup-email-item"
                        onClick={() => {
                          setEmail(savedEmail);
                          setShowEmailHistory(false);
                          passwordRef.current?.focus();
                        }}
                      >
                        {savedEmail}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="signup-input-group">
                <label className="signup-label">
                  Password <span className="required-asterisk">*</span>
                </label>
                <div className="signup-password-container">
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyPress={(e) => handleKeyPress(e, confirmPasswordRef)}
                    className="signup-input"
                  />
                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁" : "👁‍🗨"}
                  </button>
                </div>
                {passwordErrors.length > 0 && (
                  <div className="password-requirements">
                    <p className="requirements-title">Password must contain:</p>
                    <ul className="requirements-list">
                      {passwordErrors.map((error, index) => (
                        <li key={index} className="requirement-item">
                          <span className="requirement-icon">❌</span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="signup-input-group">
                <label className="signup-label">
                  Confirm Password <span className="required-asterisk">*</span>
                </label>
                <div className="signup-password-container">
                  <input
                    ref={confirmPasswordRef}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onKeyPress={(e) => handleKeyPress(e)}
                    className="signup-input"
                  />
                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? "👁" : "👁‍🗨"}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className="password-error">
                    <span className="error-icon">❌</span>
                    {confirmPasswordError}
                  </div>
                )}
              </div>

              <button className="signup-button" onClick={handleSignup}>
                Sign Up
              </button>
              
              <div className="signup-links">
                <button 
                  className="signup-link-button"
                  onClick={() => navigate('/')}
                >
                  Already have an account?
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
