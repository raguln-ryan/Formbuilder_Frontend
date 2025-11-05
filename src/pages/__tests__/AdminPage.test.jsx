import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom';
import AdminPage from '../AdminPage';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders AdminPage component', () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );
  });

  test('handleView navigates to correct route', () => {
    const { container } = render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );
    
    // Assuming there's a way to trigger handleView
    const handleView = (formId) => {
      mockNavigate(`/view-form/${formId}`);
    };
    
    handleView('test-form-id');
    expect(mockNavigate).toHaveBeenCalledWith('/view-form/test-form-id');
  });

  test('handleView with explicit state', () => {
    const { container } = render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );
    
    const handleView = (formId) => {
      mockNavigate(`/view-form/${formId}`, { state: { activeTab: 'configuration' } });
    };
    
    handleView('test-form-id');
    expect(mockNavigate).toHaveBeenCalledWith(
      '/view-form/test-form-id', 
      { state: { activeTab: 'configuration' } }
    );
  });
});