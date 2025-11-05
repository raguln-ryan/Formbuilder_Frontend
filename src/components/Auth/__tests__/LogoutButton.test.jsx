import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LogoutButton from '../LogoutButton';
import { AuthProvider } from '../../../contexts/AuthContext';

const MockedLogoutButton = (props) => (
  <BrowserRouter>
    <AuthProvider>
      <LogoutButton {...props} />
    </AuthProvider>
  </BrowserRouter>
);

describe('LogoutButton', () => {
  test('renders logout button', () => {
    render(<MockedLogoutButton />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('shows confirmation modal when showConfirmation is true', () => {
    render(<MockedLogoutButton showConfirmation={true} />);
    const logoutBtn = screen.getByText('Logout');
    
    fireEvent.click(logoutBtn);
    expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to logout/i)).toBeInTheDocument();
  });

  test('closes modal on cancel click', () => {
    render(<MockedLogoutButton showConfirmation={true} />);
    fireEvent.click(screen.getByText('Logout'));
    
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(screen.queryByText('Confirm Logout')).not.toBeInTheDocument();
  });

  test('closes modal on overlay click', () => {
    render(<MockedLogoutButton showConfirmation={true} />);
    fireEvent.click(screen.getByText('Logout'));
    
    const overlay = document.querySelector('.logout-modal-overlay');
    fireEvent.click(overlay);
    expect(screen.queryByText('Confirm Logout')).not.toBeInTheDocument();
  });

  test('performs logout on confirm', async () => {
    render(<MockedLogoutButton showConfirmation={true} />);
    fireEvent.click(screen.getByText('Logout'));
    
    const confirmBtn = screen.getByText('Yes, Logout');
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
      expect(screen.queryByText('Confirm Logout')).not.toBeInTheDocument();
    });
  });

  test('shows loading state during logout', async () => {
    render(<MockedLogoutButton showConfirmation={false} />);
    const logoutBtn = screen.getByText('Logout');
    
    fireEvent.click(logoutBtn);
    expect(await screen.findByText('Logging out...')).toBeInTheDocument();
  });

  test('prevents event propagation on modal click', () => {
    render(<MockedLogoutButton showConfirmation={true} />);
    fireEvent.click(screen.getByText('Logout'));
    
    const modal = document.querySelector('.logout-modal');
    const event = new MouseEvent('click', { bubbles: true });
    jest.spyOn(event, 'stopPropagation');
    fireEvent(modal, event);
    
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});