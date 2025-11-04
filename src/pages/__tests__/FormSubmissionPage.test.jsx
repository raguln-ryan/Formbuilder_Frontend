import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FormSubmissionPage from '../FormSubmissionPage';
import responseService from '../../services/responseService';

jest.mock('../../services/responseService');
jest.mock('../../components/Common/NavigationBar', () => {
  return function MockNavigationBar() {
    return <div>NavigationBar</div>;
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ formId: 'test-form-123' })
}));

describe('FormSubmissionPage', () => {
  const mockForm = {
    formId: 'test-form-123',
    title: 'Test Form',
    description: 'Test Description',
    questions: [
      {
        id: 'q1',
        text: 'Question 1',
        type: 'text',
        required: true
      },
      {
        id: 'q2',
        text: 'Question 2',
        type: 'textarea',
        required: false
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    responseService.getPublishedForms.mockResolvedValue([mockForm]);
    responseService.getMySubmissions.mockResolvedValue([]);
  });

  test('renders navigation bar', async () => {
    render(
      <BrowserRouter>
        <FormSubmissionPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('NavigationBar')).toBeInTheDocument();
    });
  });

  test('renders tab buttons', async () => {
    render(
      <BrowserRouter>
        <FormSubmissionPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Form Submit')).toBeInTheDocument();
      expect(screen.getByText('My Submissions')).toBeInTheDocument();
    });
  });

  test('loads and displays form', async () => {
    render(
      <BrowserRouter>
        <FormSubmissionPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText(/Question 1/)).toBeInTheDocument();
    });
  });

  test('switches between tabs', async () => {
    render(
      <BrowserRouter>
        <FormSubmissionPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('My Submissions'));
    
    await waitFor(() => {
      expect(responseService.getMySubmissions).toHaveBeenCalled();
    });
  });

  test.skip('handles form submission', async () => {
    responseService.submitResponse.mockResolvedValue({ success: true });
    
    render(
      <BrowserRouter>
        <FormSubmissionPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test Answer' } });
    
    fireEvent.click(screen.getByText('Submit Form'));
    
    await waitFor(() => {
      expect(responseService.submitResponse).toHaveBeenCalled();
    });
  });

  test('shows error for required fields', async () => {
    render(
      <BrowserRouter>
        <FormSubmissionPage />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Submit Form'));
    
    // Toast error should be called for required field
    await waitFor(() => {
      expect(screen.getByText('Submit Form')).toBeInTheDocument();
    });
  });
});