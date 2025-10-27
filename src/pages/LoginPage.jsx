import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import '../styles/pages/LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  
  // Initialize with empty values - no error
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(''); // Should be empty initially
  const [loading, setLoading] = useState(false);

  // Only redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'Admin') {
        navigate('/admin');
      } else if (user.role === 'Learner') {
        navigate('/learner/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      toast.error('Please enter both email and password');
      return;
    }
    
    setError(''); // Clear any existing errors
    setLoading(true);

    try {
      const response = await authService.login(formData);
      
      if (response && response.token) {
        // Store auth data and login
        login(response.token, {
          userId: response.userId,
          name: response.name,
          role: response.role,
          email: formData.email
        });
        
        // Success toast
        toast.success(`Welcome back, ${response.name || formData.email}!`);
        
        // Redirect based on role
        if (response.role === 'Admin') {
          navigate('/admin');
        } else if (response.role === 'Learner') {
          navigate('/learner/dashboard');
        } else {
          // Fallback redirect
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      // Only set error after failed login attempt
      if (err.response?.status === 401) {
        const errorMsg = 'Invalid email or password';
        setError(errorMsg);
        toast.error(errorMsg);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
        toast.error(err.response.data.message);
      } else if (err.message) {
        const errorMsg = 'Unable to connect to server. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMsg = 'Login failed. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        
        {/* Only show error if it exists */}
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-switch">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Register as Learner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;