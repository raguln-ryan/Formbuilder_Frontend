import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../Common/LoadingSpinner', () => {
  return function LoadingSpinner({ message }) {
    return <div>Loading: {message}</div>;
  };
});

describe('ProtectedRoute Component', () => {
  test('shows loading spinner when loading', () => {
    useAuth.mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading: Loading...')).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('allows access when authenticated with correct role', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/protected" element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  test('redirects Admin to admin dashboard when role not allowed', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter initialEntries={['/learner-only']}>
        <Routes>
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
          <Route element={<ProtectedRoute allowedRoles={['Learner']} />}>
            <Route path="/learner-only" element={<div>Learner Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  test('redirects Learner to learner dashboard when role not allowed', () => {
    useAuth.mockReturnValue({
      user: { role: 'Learner' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter initialEntries={['/admin-only']}>
        <Routes>
          <Route path="/learner" element={<div>Learner Dashboard</div>} />
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin-only" element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Learner Dashboard')).toBeInTheDocument();
  });

  test('allows access when no specific roles required', () => {
    useAuth.mockReturnValue({
      user: { role: 'Learner' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});