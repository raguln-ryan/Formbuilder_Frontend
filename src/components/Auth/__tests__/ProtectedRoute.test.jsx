import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import * as AuthContext from '../../../contexts/AuthContext';

const TestComponent = () => <div>Protected Content</div>;

describe('ProtectedRoute', () => {
  test('shows loading spinner when loading', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<TestComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<TestComponent />} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('renders content when authenticated with correct role', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'Admin' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/" element={<TestComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('redirects admin to admin dashboard when role not allowed', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'Admin' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['Learner']} />}>
            <Route path="/" element={<TestComponent />} />
          </Route>
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  test('redirects learner to learner dashboard when role not allowed', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'Learner' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/" element={<TestComponent />} />
          </Route>
          <Route path="/learner" element={<div>Learner Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Learner Dashboard')).toBeInTheDocument();
  });
});