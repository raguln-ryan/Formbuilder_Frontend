import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/components/Auth/LogoutButton.css';

const LogoutButton = ({ showConfirmation = false }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (showConfirmation) {
      setShowModal(true);
    } else {
      performLogout();
    }
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    
    // Simulate logout process
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 500);
  };

  const handleConfirm = () => {
    setShowModal(false);
    performLogout();
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <div className="logout-button-container">
        <button 
          className={`logout-btn ${isLoggingOut ? 'loading' : ''}`}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <span className="logout-icon">⏳</span>
              <span className="logout-text">Logging out...</span>
            </>
          ) : (
            <>
              <span className="logout-icon">🚪</span>
              <span className="logout-text">Logout</span>
            </>
          )}
        </button>
      </div>

      {showModal && (
        <div className="logout-modal-overlay" onClick={handleCancel}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h3 className="logout-modal-title">Confirm Logout</h3>
            </div>
            <div className="logout-modal-body">
              <p className="logout-modal-message">
                Are you sure you want to logout? You will need to login again to access your account.
              </p>
            </div>
            <div className="logout-modal-footer">
              <button 
                className="modal-btn modal-btn-cancel"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                className="modal-btn modal-btn-confirm"
                onClick={handleConfirm}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;