import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the auth context
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('LoginForm Component', () => {
  const mockLogin = jest.fn();
  
  beforeEach(() => {
    useAuth.mockReturnValue({
      login: mockLogin
    });
    mockNavigate.mockClear();
    mockLogin.mockClear();
    localStorage.clear();
  });

 
  test('handles input changes', () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('validates email format', async () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    const emailInput = screen.getByPlaceholderText('Enter your email');
    
    // Invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  test('validates password length', async () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  test('successful login for Admin', async () => {
    mockLogin.mockResolvedValue({ success: true });
    localStorage.setItem('user', JSON.stringify({ role: 'Admin' }));
    
    render(
      <BrowserRouter>
        <LoginForm onSuccess={jest.fn()} />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'password123');
      expect(screen.getByText('Login successful! Redirecting...')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    }, { timeout: 2000 });
  });

  test('successful login for Learner', async () => {
    mockLogin.mockResolvedValue({ success: true });
    localStorage.setItem('user', JSON.stringify({ role: 'Learner' }));
    
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    fireEvent.change(emailInput, { target: { value: 'learner@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/learner');
    }, { timeout: 2000 });
  });

  test('handles login failure', async () => {
    mockLogin.mockResolvedValue({ success: false, message: 'Invalid credentials' });
    
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('handles remember me functionality', async () => {
    mockLogin.mockResolvedValue({ success: true });
    
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const rememberCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
    const emailInput = screen.getByPlaceholderText('Enter your email');
    
    fireEvent.change(emailInput, { target: { value: 'remember@example.com' } });
    fireEvent.click(rememberCheckbox);
    
    expect(rememberCheckbox.checked).toBe(true);
  });

  test('loads remembered email on mount', () => {
    localStorage.setItem('rememberedEmail', 'saved@example.com');
    
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    expect(emailInput.value).toBe('saved@example.com');
  });
});