import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';
import { AuthProvider } from '../../../contexts/AuthContext';

const MockedLoginForm = ({ onSuccess }) => (
  <BrowserRouter>
    <AuthProvider>
      <LoginForm onSuccess={onSuccess} />
    </AuthProvider>
  </BrowserRouter>
);

describe('LoginForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders login form with all elements', () => {
    render(<MockedLoginForm />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('validates email field', async () => {
    render(<MockedLoginForm />);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Email is invalid')).toBeInTheDocument();
  });

  test('validates password field', async () => {
    render(<MockedLoginForm />);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
    
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  test('handles remember me checkbox', () => {
    render(<MockedLoginForm />);
    const checkbox = screen.getByLabelText(/remember me/i);
    
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  test('clears errors on input change', async () => {
    render(<MockedLoginForm />);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  test('loads remembered email on mount', () => {
    localStorage.setItem('rememberedEmail', 'remembered@test.com');
    render(<MockedLoginForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput.value).toBe('remembered@test.com');
  });
});