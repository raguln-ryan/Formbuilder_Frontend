import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicFormPage from '../PublicFormPage';
import { AuthProvider } from '../../contexts/AuthContext';
import api from '../../services/api';

jest.mock('../../services/api');
jest.mock('../../components/Common/LoadingSpinner', () => {
  return function MockLoadingSpinner({ message }) {
    return <div>Loading... {message}</div>;
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ formId: 'public-form-123' })
}));

// Mock auth context
const mockAuthContext = {
  user: { role: 'Learner', id: 1 },
  isAuthenticated: true
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

describe('PublicFormPage', () => {
  const mockForm = {
    formId: 'public-form-123',
    title: 'Public Test Form',
    description: 'Public Form Description',
    questions: [
      {
        id: 'q1',
        text: 'Question 1',
        type: 'short_text',
        required: true
      },
      {
        id: 'q2',
        text: 'Question 2',
        type: 'number',
        required: false
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('redirects to login if not authenticated', () => {
    mockAuthContext.isAuthenticated = false;
    
    render(
      <BrowserRouter>
        <PublicFormPage />
      </BrowserRouter>
    );
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('redirects if user is not a learner', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { role: 'Admin' };
    
    render(
      <BrowserRouter>
        <PublicFormPage />
      </BrowserRouter>
    );
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('loads and displays form', async () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { role: 'Learner' };
    api.get.mockResolvedValue({ data: [mockForm] });
    
    render(
      <BrowserRouter>
        <PublicFormPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Public Test Form')).toBeInTheDocument();
      expect(screen.getByText('Public Form Description')).toBeInTheDocument();
    });
  });

  test('shows loading spinner while fetching', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { role: 'Learner' };
    
    render(
      <BrowserRouter>
        <PublicFormPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Loading... Loading form...')).toBeInTheDocument();
  });

  test('handles form submission', async () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { role: 'Learner' };
    api.get.mockResolvedValue({ data: [mockForm] });
    api.post.mockResolvedValue({ data: { success: true } });
    
    render(
      <BrowserRouter>
        <PublicFormPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Public Test Form')).toBeInTheDocument();
    });
    
    const input = screen.getByPlaceholderText('Enter your answer');
    fireEvent.change(input, { target: { value: 'Test Answer' } });
    
    fireEvent.click(screen.getByText('Submit Response'));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/response', expect.any(Object));
    });
  });

  test('shows success message after submission', async () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { role: 'Learner' };
    api.get.mockResolvedValue({ data: [mockForm] });
    api.post.mockResolvedValue({ data: { success: true } });
    
    render(
      <BrowserRouter>
        <PublicFormPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Public Test Form')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Submit Response'));
    
    await waitFor(() => {
      expect(screen.getByText('✅ Thank You!')).toBeInTheDocument();
    });
  });
});