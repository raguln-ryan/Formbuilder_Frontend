import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';
import authService from '../../services/authService';

jest.mock('../../services/authService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form elements', () => {
    renderLoginPage();
    
    expect(screen.getByText('Log in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('shows error when fields are empty', async () => {
    renderLoginPage();
    
    const submitBtn = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter both email and password')).toBeInTheDocument();
    });
  });

  test('handles successful admin login', async () => {
    authService.login.mockResolvedValue({
      token: 'test-token',
      userId: 1,
      name: 'Admin User',
      role: 'Admin'
    });
    
    renderLoginPage();
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@test.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('handles successful learner login', async () => {
    authService.login.mockResolvedValue({
      token: 'test-token',
      userId: 2,
      name: 'Learner User',
      role: 'Learner'
    });
    
    renderLoginPage();
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'learner@test.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard');
    });
  });

  test('handles login error', async () => {
    authService.login.mockRejectedValue({
      response: { status: 401 }
    });
    
    renderLoginPage();
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@test.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  test('has login links', () => {
    renderLoginPage();
    
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    expect(screen.getByText(/create an account/i)).toBeInTheDocument();
  });
});