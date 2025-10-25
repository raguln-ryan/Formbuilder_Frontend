import React from 'react';
import Button from './Button';
import '../../styles/components/Common/Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  variant = 'default' 
}) => {
  if (!isOpen) return null;

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
        Cancel
      </button>
      <button className="confirm-btn" onClick={onConfirm}>
        Yes, Delete
      </button>
    </div>
  </div>
</div>

  );
};

export default Modal;
