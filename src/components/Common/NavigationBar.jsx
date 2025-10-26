import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import homesIcon from '../../assets/home.png'
import arrowIcon from "../../assets/AltArrowRight.png"
import person from "../../assets/person.png"

function NavigationBar() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Automatically determine page name based on current route
    const getPageName = () => {
        const path = location.pathname;
        
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
        
        return 'Form Builder';
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
                    onClick={() => navigate('/admin')}
                    style={{ cursor: 'pointer' }}
                    title="Click to go to home"
                />
                <img src={arrowIcon} alt="Arrow" className="arrow-icon" style={{ width: 24, height: 24 }} />
                <span>{getPageName()}</span> 
            </div>
            <div className="header-actions">
                <img 
                    src={person} 
                    alt="Logout" 
                    className="person-icon"
                    onClick={handleLogout}
                    style={{ 
                        width: 40, 
                        height: 40 ,
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
