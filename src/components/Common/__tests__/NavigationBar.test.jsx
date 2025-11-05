import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavigationBar from '../NavigationBar';
import * as AuthContext from '../../../contexts/AuthContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('NavigationBar', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
  });

  test('renders navigation bar with user info', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { name: 'John Doe', email: 'john@test.com', role: 'Admin' }
    });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('displays correct page name for admin routes', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'Admin' }
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <NavigationBar />
      </MemoryRouter>
    );
    expect(screen.getByText('Form Builder')).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={['/form/123/view']}>
        <NavigationBar />
      </MemoryRouter>
    );
    expect(screen.getByText('View Form')).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={['/form/123/edit']}>
        <NavigationBar />
      </MemoryRouter>
    );
    expect(screen.getByText('Edit Form')).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={['/form/new']}>
        <NavigationBar />
      </MemoryRouter>
    );
    expect(screen.getByText('Create Form')).toBeInTheDocument();
  });

  test('displays correct page name for learner routes', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'Learner' }
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/learner/dashboard']}>
        <NavigationBar />
      </MemoryRouter>
    );
    expect(screen.getByText('Published Forms')).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={['/form/123/fill']}>
        <NavigationBar />
      </MemoryRouter>
    );
    expect(screen.getByText('Form Submission')).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={['/learner/submissions']}>
        <NavigationBar />
      </MemoryRouter>
    );
    expect(screen.getByText('My Submissions')).toBeInTheDocument();
  });

  test('navigates to admin home when admin clicks home', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'Admin' }
    });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByAltText('Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  test('navigates to learner dashboard when learner clicks home', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'Learner' }
    });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByAltText('Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard');
  });

  test('handles logout when logout icon clicked', () => {
    delete window.location;
    window.location = { href: '' };
    
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { name: 'John', role: 'Admin' }
    });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByAltText('Logout'));
    expect(window.location.href).toBe('/login');
  });

  test('navigates to root when no role', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { name: 'John' }
    });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByAltText('Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('displays email when name is not available', () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { email: 'john@test.com', role: 'Admin' }
    });

    render(
      <MemoryRouter>
        <NavigationBar />
      </MemoryRouter>
    );

    expect(screen.getByText('john@test.com')).toBeInTheDocument();
  });
});