import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}));

jest.mock('../../../contexts/AuthContext');

describe('LoginForm', () => {
  let mockNavigate;
  let mockLogin;
  let mockOnSuccess;

  beforeEach(() => {
    mockNavigate = jest.fn();
    mockLogin = jest.fn();
    mockOnSuccess = jest.fn();
    
    useNavigate.mockReturnValue(mockNavigate);
    useAuth.mockReturnValue({
      login: mockLogin
    });

    // Clear localStorage
    localStorage.clear();
    
    // Reset timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <LoginForm onSuccess={mockOnSuccess} {...props} />
      </BrowserRouter>
    );
  };

  describe('Initial Render', () => {
    test('renders login form with all elements', () => {
      renderComponent();

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to continue to Form Builder')).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument();
      expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByText('Sign up')).toBeInTheDocument();
    });

    test('loads remembered email from localStorage', () => {
      localStorage.setItem('rememberedEmail', 'remembered@test.com');
      
      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const rememberCheckbox = screen.getByLabelText('Remember me');
      
      expect(emailInput.value).toBe('remembered@test.com');
      expect(rememberCheckbox.checked).toBe(true);
    });

    test('initializes with empty form when no remembered email', () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      const rememberCheckbox = screen.getByLabelText('Remember me');
      
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
      expect(rememberCheckbox.checked).toBe(false);
    });
  });

  describe('Form Validation', () => {
    test('shows error when email is empty', async () => {
      renderComponent();

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('shows error when email is invalid', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is invalid')).toBeInTheDocument();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('shows error when password is empty', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('shows error when password is too short', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: '12345' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('shows multiple validation errors', async () => {
      renderComponent();

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('clears error when user types in field', async () => {
      renderComponent();

      // Trigger validation errors
      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      // Type in email field
      const emailInput = screen.getByLabelText(/Email Address/);
      fireEvent.change(emailInput, { target: { value: 't' } });

      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('successful login for Admin user', async () => {
      mockLogin.mockResolvedValue({ success: true });
      localStorage.setItem('user', JSON.stringify({ role: 'Admin' }));

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123');
        expect(screen.getByText('Login successful! Redirecting...')).toBeInTheDocument();
      });

      // Advance timers to trigger redirect
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/admin');
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    test('successful login for Learner user', async () => {
      mockLogin.mockResolvedValue({ success: true });
      localStorage.setItem('user', JSON.stringify({ role: 'Learner' }));

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'learner@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('learner@test.com', 'password123');
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/learner');
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    test('handles login with remember me checked', async () => {
      mockLogin.mockResolvedValue({ success: true });
      localStorage.setItem('user', JSON.stringify({ role: 'Admin' }));

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      const rememberCheckbox = screen.getByLabelText('Remember me');
      
      fireEvent.change(emailInput, { target: { value: 'remember@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(rememberCheckbox);

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('rememberedEmail')).toBe('remember@test.com');
      });
    });

    test('handles login with remember me unchecked', async () => {
      // Set initial remembered email
      localStorage.setItem('rememberedEmail', 'old@test.com');
      mockLogin.mockResolvedValue({ success: true });
      localStorage.setItem('user', JSON.stringify({ role: 'Admin' }));

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      const rememberCheckbox = screen.getByLabelText('Remember me');
      
      // Clear the email and uncheck remember me
      fireEvent.change(emailInput, { target: { value: 'new@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(rememberCheckbox); // Uncheck it

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('rememberedEmail')).toBeNull();
      });
    });

    test('handles login failure with error message', async () => {
      mockLogin.mockResolvedValue({ 
        success: false, 
        message: 'Invalid credentials' 
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
      
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('handles login failure without error message', async () => {
      mockLogin.mockResolvedValue({ success: false });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });

    test('handles login exception', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'));

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
      });
    });

    test('works without onSuccess callback', async () => {
      mockLogin.mockResolvedValue({ success: true });
      localStorage.setItem('user', JSON.stringify({ role: 'Admin' }));

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  describe('Loading State', () => {
    test('shows loading state during submission', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 100);
      }));

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      // Button should be disabled and empty during loading
      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveClass('loading');
        expect(button.textContent).toBe('');
      });

      // Resolve the promise
      act(() => {
        jest.advanceTimersByTime(100);
      });
    });

    test('re-enables button after submission', async () => {
      mockLogin.mockResolvedValue({ success: false });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).not.toBeDisabled();
      });
    });
  });

  describe('Form Interactions', () => {
    test('handles checkbox input change', () => {
      renderComponent();

      const rememberCheckbox = screen.getByLabelText('Remember me');
      
      expect(rememberCheckbox.checked).toBe(false);
      
      fireEvent.click(rememberCheckbox);
      expect(rememberCheckbox.checked).toBe(true);
      
      fireEvent.click(rememberCheckbox);
      expect(rememberCheckbox.checked).toBe(false);
    });

    test('handles text input changes', () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass123' } });
      
      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('testpass123');
    });

    test('prevents default form submission', async () => {
      renderComponent();

      const form = screen.getByRole('button', { name: /Sign In/ }).closest('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      
      fireEvent(form, submitEvent);
      
      expect(submitEvent.defaultPrevented).toBe(true);
    });
  });

  describe('Links', () => {
    test('renders forgot password link', () => {
      renderComponent();
      
      const forgotLink = screen.getByText('Forgot password?');
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink.getAttribute('href')).toBe('#');
    });

    test('renders sign up link', () => {
      renderComponent();
      
      const signUpLink = screen.getByText('Sign up');
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink.getAttribute('href')).toBe('/register');
    });
  });

  describe('Message Display', () => {
    test('displays success message with correct styling', async () => {
      mockLogin.mockResolvedValue({ success: true });
      localStorage.setItem('user', JSON.stringify({ role: 'Admin' }));

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.submit(emailInput.closest('form'));

      await waitFor(() => {
        const message = screen.getByText('Login successful! Redirecting...');
        expect(message.parentElement).toHaveClass('alert-message alert-success');
      });
    });

    test('displays error message with correct styling', async () => {
      mockLogin.mockResolvedValue({ 
        success: false, 
        message: 'Invalid credentials' 
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.submit(emailInput.closest('form'));

      await waitFor(() => {
        const message = screen.getByText('Invalid credentials');
        expect(message.parentElement).toHaveClass('alert-message alert-error');
      });
    });

    test('clears message on new submission attempt', async () => {
      mockLogin
        .mockResolvedValueOnce({ success: false, message: 'First error' })
        .mockResolvedValueOnce({ success: true });

      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      const passwordInput = screen.getByLabelText(/^Password$/);
      const submitButton = screen.getByText('Sign In');
      
      // First submission - fails
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second submission - succeeds
      localStorage.setItem('user', JSON.stringify({ role: 'Admin' }));
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
        expect(screen.getByText('Login successful! Redirecting...')).toBeInTheDocument();
      });
    });
  });

  describe('Input Field Styling', () => {
    test('adds error class to email input when validation fails', async () => {
      renderComponent();

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/Email Address/);
        expect(emailInput).toHaveClass('error');
      });
    });

    test('adds error class to password input when validation fails', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/Email Address/);
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/^Password$/);
        expect(passwordInput).toHaveClass('error');
      });
    });

    test('removes error class when field is corrected', async () => {
      renderComponent();

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/Email Address/);
        expect(emailInput).toHaveClass('error');
      });

      const emailInput = screen.getByLabelText(/Email Address/);
      fireEvent.change(emailInput, { target: { value: 'valid@email.com' } });

      await waitFor(() => {
        expect(emailInput).not.toHaveClass('error');
      });
    });
  });
});
