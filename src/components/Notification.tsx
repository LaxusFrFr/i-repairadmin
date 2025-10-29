import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import '../styles/notification.css';

interface NotificationProps {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Notification({
  isOpen,
  message,
  type,
  onClose
}: NotificationProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="notification-icon-success" />;
      case 'error':
        return <FaExclamationCircle className="notification-icon-error" />;
      case 'info':
        return <FaInfoCircle className="notification-icon-info" />;
      default:
        return <FaInfoCircle className="notification-icon-info" />;
    }
  };

  const getClassName = () => {
    return `notification notification-${type}`;
  };

  return (
    <div className={getClassName()}>
      <div className="notification-content">
        {getIcon()}
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
    </div>
  );
}

