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
  confirmText = 'Yes, Delete', // Default for delete, can be overridden
  cancelText = 'Cancel',
  type = 'delete' // 'delete' or 'publish'
}) => {
  if (!isOpen) return null;

  // Set confirm button text based on type if not explicitly provided
  const confirmButtonText = confirmText !== 'Yes, Delete' 
    ? confirmText 
    : type === 'publish' 
      ? 'Yes, Publish' 
      : 'Yes, Delete';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            {cancelText}
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
