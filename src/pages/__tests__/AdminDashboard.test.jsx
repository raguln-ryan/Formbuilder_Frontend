import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';

// Mock the components
jest.mock('../../components/FormBuilder/FormList', () => {
  return function MockFormList() {
    return <div>FormList Component</div>;
  };
});

jest.mock('../../components/Common/NavigationBar', () => {
  return function MockNavigationBar({ pageName }) {
    return <div>NavigationBar - {pageName}</div>;
  };
});

describe('AdminDashboard', () => {
  test('renders NavigationBar with Form Builder pageName', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText('NavigationBar - Form Builder')).toBeInTheDocument();
  });

  test('renders FormList component', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText('FormList Component')).toBeInTheDocument();
  });

  test('has admin-dashboard class', () => {
    const { container } = render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );
    
    expect(container.firstChild).toHaveClass('admin-dashboard');
  });
});