import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import homesIcon from '../../assets/home.png'
import arrowIcon from "../../assets/AltArrowRight.png"
import person from "../../assets/person.png"

function NavigationBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Determine if user is admin or learner
    const isAdmin = user?.role === 'Admin';
    const isLearner = user?.role === 'Learner';
    
    // Automatically determine page name based on current route
    const getPageName = () => {
        const path = location.pathname;
        
        // Admin routes
        if (path.includes('/form/') && path.includes('/view')) {
            return 'View Form';
        } else if (path.includes('/form/') && path.includes('/edit')) {
            return 'Edit Form';
        } else if (path.includes('/form/') && path.includes('/responses')) {
            return 'Form Responses';
        } else if (path.includes('/form/new')) {
            return 'Create Form';
        } else if (path.includes('/admin')) {
            return 'Form Builder';
        }
        
        // Learner routes
        if (path.includes('/learner/dashboard')) {
            return 'Published Forms';
        } else if (path.includes('/form/') && path.includes('/fill')) {
            return 'Form Submission';
        } else if (path.includes('/learner/submissions')) {
            return 'My Submissions';
        }
        
        return isAdmin ? 'Form Builder' : 'Dashboard';
    }
    
    const handleHomeClick = () => {
        if (isAdmin) {
            navigate('/admin');
        } else if (isLearner) {
            navigate('/learner/dashboard');
        } else {
            navigate('/');
        }
    }
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    
    return (
        <div className="dashboard-header">
            <div className='header-left'>
                <img 
                    src={homesIcon} 
                    alt="Home" 
                    className="home-icon"
                    onClick={handleHomeClick}
                    style={{ cursor: 'pointer' }}
                    title="Click to go to home"
                />
                <img src={arrowIcon} alt="Arrow" className="arrow-icon" style={{ width: 24, height: 24 }} />
                <span>{getPageName()}</span> 
            </div>
            <div className="header-actions">
                <div className="user-info" style={{ marginRight: '10px', fontSize: '16px', color: 'black' }}>
                    {user?.name || user?.email}
                </div>
                <img 
                    src={person} 
                    alt="Logout" 
                    className="person-icon"
                    onClick={handleLogout}
                    style={{ 
                        width: 40, 
                        height: 40,
                        cursor: 'pointer',
                        borderRadius: '70%',
                        objectFit: 'cover'
                    }}
                    title="Click to logout"
                />
            </div>
        </div>
    )
}

export default NavigationBar
