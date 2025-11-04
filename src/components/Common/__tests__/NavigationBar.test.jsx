import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavigationBar from '../NavigationBar';
import { useAuth } from '../../../contexts/AuthContext';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: jest.fn()
}));

// Import the actual useLocation to mock it properly
const { useLocation } = require('react-router-dom');

describe('NavigationBar Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
  });

  test('renders navigation bar with user info', () => {
    useAuth.mockReturnValue({
      user: { name: 'John Doe', email: 'john@example.com', role: 'Admin' }
    });
    useLocation.mockReturnValue({ pathname: '/admin' });

    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByAltText('Home')).toBeInTheDocument();
    expect(screen.getByAltText('Arrow')).toBeInTheDocument();
    expect(screen.getByAltText('Logout')).toBeInTheDocument();
  });

  test('displays email when name is not available', () => {
    useAuth.mockReturnValue({
      user: { email: 'john@example.com', role: 'Admin' }
    });
    useLocation.mockReturnValue({ pathname: '/admin' });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  test('displays correct page name for admin routes', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' }
    });

    const routes = [
      { path: '/form/123/view', expected: 'View Form' },
      { path: '/form/123/edit', expected: 'Edit Form' },
      { path: '/form/123/responses', expected: 'Form Responses' },
      { path: '/form/new', expected: 'Create Form' },
      { path: '/admin', expected: 'Form Builder' }
    ];

    routes.forEach(({ path, expected }) => {
      useLocation.mockReturnValue({ pathname: path });
      
      const { rerender } = render(
        <MemoryRouter>
          <NavigationBar />
        </MemoryRouter>
      );
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<></>);
    });
  });

  test('displays correct page name for learner routes', () => {
    useAuth.mockReturnValue({
      user: { role: 'Learner' }
    });

    const routes = [
      { path: '/learner/dashboard', expected: 'Published Forms' },
      { path: '/form/123/fill', expected: 'Form Submission' },
      { path: '/learner/submissions', expected: 'My Submissions' }
    ];

    routes.forEach(({ path, expected }) => {
      useLocation.mockReturnValue({ pathname: path });
      
      const { rerender } = render(
        <MemoryRouter>
          <NavigationBar />
        </MemoryRouter>
      );
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<></>);
    });
  });

  test('displays default page name for unknown routes', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' }
    });
    useLocation.mockReturnValue({ pathname: '/unknown' });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    expect(screen.getByText('Form Builder')).toBeInTheDocument();
  });

  test('displays default Dashboard for learner on unknown route', () => {
    useAuth.mockReturnValue({
      user: { role: 'Learner' }
    });
    useLocation.mockReturnValue({ pathname: '/unknown' });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('navigates to admin home when admin clicks home', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' }
    });
    useLocation.mockReturnValue({ pathname: '/form/123/edit' });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    const homeIcon = screen.getByAltText('Home');
    fireEvent.click(homeIcon);

    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  test('navigates to learner dashboard when learner clicks home', () => {
    useAuth.mockReturnValue({
      user: { role: 'Learner' }
    });
    useLocation.mockReturnValue({ pathname: '/form/123/fill' });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    const homeIcon = screen.getByAltText('Home');
    fireEvent.click(homeIcon);

    expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard');
  });

  test('navigates to root when user has no role', () => {
    useAuth.mockReturnValue({
      user: {}
    });
    useLocation.mockReturnValue({ pathname: '/some-page' });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    const homeIcon = screen.getByAltText('Home');
    fireEvent.click(homeIcon);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('handles logout when clicking person icon', () => {
    // Mock window.location.href
    delete window.location;
    window.location = { href: '' };

    useAuth.mockReturnValue({
      user: { role: 'Admin' }
    });
    useLocation.mockReturnValue({ pathname: '/admin' });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    const logoutIcon = screen.getByAltText('Logout');
    fireEvent.click(logoutIcon);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  test('home icon has correct title attribute', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' }
    });
    useLocation.mockReturnValue({ pathname: '/admin' });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    const homeIcon = screen.getByAltText('Home');
    expect(homeIcon).toHaveAttribute('title', 'Click to go to home');
  });

  test('logout icon has correct title attribute', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' }
    });
    useLocation.mockReturnValue({ pathname: '/admin' });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    const logoutIcon = screen.getByAltText('Logout');
    expect(logoutIcon).toHaveAttribute('title', 'Click to logout');
  });

  test('renders with all CSS classes', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' }
    });
    useLocation.mockReturnValue({ pathname: '/admin' });

    const { container } = render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    expect(container.querySelector('.dashboard-header')).toBeInTheDocument();
    expect(container.querySelector('.header-left')).toBeInTheDocument();
    expect(container.querySelector('.header-actions')).toBeInTheDocument();
    expect(container.querySelector('.user-info')).toBeInTheDocument();
    expect(container.querySelector('.home-icon')).toBeInTheDocument();
    expect(container.querySelector('.arrow-icon')).toBeInTheDocument();
    expect(container.querySelector('.person-icon')).toBeInTheDocument();
  });
});