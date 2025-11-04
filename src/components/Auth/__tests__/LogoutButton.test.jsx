import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LogoutButton from '../LogoutButton';
import { useAuth } from '../../../contexts/AuthContext';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('LogoutButton Component', () => {
  const mockLogout = jest.fn();
  
  beforeEach(() => {
    useAuth.mockReturnValue({
      logout: mockLogout
    });
    mockNavigate.mockClear();
    mockLogout.mockClear();
  });

  test('renders logout button', () => {
    render(
      <BrowserRouter>
        <LogoutButton />
      </BrowserRouter>
    );

    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('performs logout without confirmation', async () => {
    jest.useFakeTimers();
    
    render(
      <BrowserRouter>
        <LogoutButton showConfirmation={false} />
      </BrowserRouter>
    );

    const logoutButton = screen.getByRole('button');
    fireEvent.click(logoutButton);
    
    expect(screen.getByText('Logging out...')).toBeInTheDocument();
    
    jest.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
    
    jest.useRealTimers();
  });

  test('shows confirmation modal when showConfirmation is true', () => {
    render(
      <BrowserRouter>
        <LogoutButton showConfirmation={true} />
      </BrowserRouter>
    );

    const logoutButton = screen.getByRole('button');
    fireEvent.click(logoutButton);
    
    expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to logout/)).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Yes, Logout')).toBeInTheDocument();
  });

  test('cancels logout from confirmation modal', () => {
    render(
      <BrowserRouter>
        <LogoutButton showConfirmation={true} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button'));
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Confirm Logout')).not.toBeInTheDocument();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  test('confirms logout from modal', async () => {
    jest.useFakeTimers();
    
    render(
      <BrowserRouter>
        <LogoutButton showConfirmation={true} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button'));
    
    const confirmButton = screen.getByText('Yes, Logout');
    fireEvent.click(confirmButton);
    
    expect(screen.queryByText('Confirm Logout')).not.toBeInTheDocument();
    
    jest.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
    
    jest.useRealTimers();
  });

  test('closes modal when clicking overlay', () => {
    render(
      <BrowserRouter>
        <LogoutButton showConfirmation={true} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button'));
    
    const overlay = screen.getByText('Confirm Logout').closest('.logout-modal-overlay');
    fireEvent.click(overlay);
    
    expect(screen.queryByText('Confirm Logout')).not.toBeInTheDocument();
  });
});