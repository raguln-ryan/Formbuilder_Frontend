import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/components/Common/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleHomeClick = () => {
    if (isAdmin()) {
      navigate('/admin');
    } else {
      navigate('/learner');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={handleHomeClick}>
          <h2>Form Builder</h2>
        </div>
        
        <div className="navbar-menu">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">({user?.role})</span>
          </div>
          
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;