import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import homesIcon from '../../assets/home.png'
import arrowIcon from "../../assets/AltArrowRight.png"

function NavigationBar() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Automatically determine page name based on current route
    const getPageName = () => {
        const path = location.pathname;
        
        if (path.includes('/admin/new')) {
            return 'Create Form';
        } else if (path.includes('/admin')) {
            return 'Form Builder';
        }
        
        return 'Form Builder';
    }
    
    return (
        <div className="dashboard-header">
            <div className='header-left'>
                <img 
                    src={homesIcon} 
                    alt="Home" 
                    className="home-icon"
                    onClick={() => navigate('/admin')}
                    style={{ cursor: 'pointer' }}
                />
                <img src={arrowIcon} alt="Arrow" className="arrow-icon" style={{ width: 24, height: 24 }} />
                <span>{getPageName()}</span> 
            </div>
            <div className="header-actions">
                <button
                    className="logout-btn"
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                    }}
                >
                    Logout
                </button>
            </div>
        </div>
    )
}

export default NavigationBar
