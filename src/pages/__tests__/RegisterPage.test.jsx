import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';
import { AuthProvider } from '../../contexts/AuthContext';
import authService from '../../services/authService';

jest.mock('../../services/authService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderRegisterPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form', () => {
    renderRegisterPage();
    
    expect(screen.getByText('Create Learner Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password *')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  test('validates empty fields', async () => {
    renderRegisterPage();
    
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  test('validates password match', async () => {
    renderRegisterPage();
    
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'Test123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Different123!' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  test('handles successful registration', async () => {
    authService.register.mockResolvedValue({
      token: 'test-token',
      userId: 1,
      name: 'Test User',
      role: 'Learner'
    });
    
    renderRegisterPage();
    
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'Test123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Test123!' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Registration successful! Redirecting...')).toBeInTheDocument();
    });
  });
});