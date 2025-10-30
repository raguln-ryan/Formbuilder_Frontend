import React from 'react';
import Button from './Button';
import '../../styles/components/Common/Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  variant = 'default',
  confirmText, 
  cancelText = 'Cancel',
  type = 'delete', // 'delete', 'publish', 'clear', or 'submitted'
  lastSubmissionDate // New prop for submission date
}) => {
  if (!isOpen) return null;

  // Set confirm button text based on type if not explicitly provided
  const getConfirmText = () => {
    if (confirmText) return confirmText;
    
    switch(type) {
      case 'publish':
        return 'Yes, Publish';
      case 'clear':
        return 'Yes, Clear';
      case 'submitted':
        return 'Yes, Continue';
      case 'delete':
      default:
        return 'Yes, Delete';
    }
  };

  // Set default title based on type if not provided
  const getModalTitle = () => {
    if (title) return title;
    
    switch(type) {
      case 'publish':
        return 'Publish Form';
      case 'clear':
        return 'Clear Form';
      case 'submitted':
        return 'Form Already Submitted';
      case 'delete':
      default:
        return 'Delete Form';
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'recently';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Set default message based on type if not provided
  const getModalMessage = () => {
    if (message) return message;
    
    switch(type) {
      case 'publish':
        return 'Are you sure you want to publish this form? Once published, it will be available for responses.';
      case 'clear':
        return 'Are you sure you want to clear all the information you’ve entered? This action cannot be undone.';
      case 'submitted':
        return `You last submitted this form on ${formatDate(lastSubmissionDate)}. Do you want to submit this form again?`;
      case 'delete':
      default:
        return 'Are you sure you want to delete this form? This action cannot be undone.';
    }
  };

  // Set button class based on type
  const getConfirmButtonClass = () => {
    switch(type) {
      case 'publish':
        return 'confirm-btn publish';
      case 'clear':
        return 'confirm-btn clear';
      case 'submitted':
        return 'confirm-btn submitted';
      case 'delete':
      default:
        return 'confirm-btn delete';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content modal-${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{getModalTitle()}</h3>
          <button className="modal-close" onClick={onClose}>
            <span>&times;</span>
          </button>
        </div>
        <div className="modal-body">
          <p>{getModalMessage()}</p>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            {cancelText}
          </button>
          <button className={getConfirmButtonClass()} onClick={onConfirm}>
            {getConfirmText()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
