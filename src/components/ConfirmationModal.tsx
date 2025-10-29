import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import '../styles/confirmation-modal.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'confirm-btn-danger';
      case 'warning':
        return 'confirm-btn-warning';
      case 'info':
        return 'confirm-btn-info';
      default:
        return 'confirm-btn-warning';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <FaExclamationTriangle className="confirm-icon-danger" />;
      case 'warning':
        return <FaExclamationTriangle className="confirm-icon-warning" />;
      case 'info':
        return <FaExclamationTriangle className="confirm-icon-info" />;
      default:
        return <FaExclamationTriangle className="confirm-icon-warning" />;
    }
  };

  return (
    <div className="confirmation-modal-overlay" onClick={onCancel}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <button className="confirmation-modal-close" onClick={onCancel}>
          <FaTimes />
        </button>
        
        <div className="confirmation-modal-icon">
          {getIcon()}
        </div>
        
        <h3>{title}</h3>
        <p>{message}</p>
        
        <div className="confirmation-modal-actions">
          <button className="confirm-btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={getConfirmButtonClass()} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

