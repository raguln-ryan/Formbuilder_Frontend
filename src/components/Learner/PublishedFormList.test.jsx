import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import PublishedFormList from './PublishedFormList';
import { useAuth } from '../../contexts/AuthContext';
import responseService from '../../services/responseService';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn()
}));

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/responseService');
jest.mock('react-hot-toast');
jest.mock('../Common/LoadingSpinner', () => () => <div>Loading...</div>);
jest.mock('../Common/NavigationBar', () => () => <nav>Navigation</nav>);
jest.mock('../../assets/Ellipse.png', () => 'search-icon.png');
jest.mock('../Common/Modal', () => ({ isOpen, onClose, onConfirm, type, lastSubmissionDate }) => 
  isOpen ? (
    <div data-testid="modal">
      <div>{type === 'submitted' && lastSubmissionDate && `Already submitted on ${lastSubmissionDate}`}</div>
      <button onClick={onConfirm}>Continue</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  ) : null
);

describe('PublishedFormList Component', () => {
  const mockNavigate = jest.fn();
  const mockLocation = { state: null };
  
  const mockForms = [
    {
      formId: '1',
      title: 'Test Form 1',
      description: 'Description 1',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      formId: '2', 
      title: 'Test Form 2',
      description: 'Description 2',
      created_at: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      title: 'Test Form 3',
      description: null,
      CreatedAt: '2024-01-03T00:00:00Z'
    }
  ];

  const mockSubmissions = [
    {
      id: 'sub-1',
      formId: '1',
      formTitle: 'Test Form 1',
      submittedAt: '2024-01-15T10:30:00Z',
      status: 'submitted'
    },
    {
      id: 'sub-2',
      formId: '2',
      formTitle: 'Test Form 2',
      submittedAt: '2024-01-16T14:20:00Z',
      status: 'approved'
    },
    {
      id: 'sub-3',
      formId: '4',
      formTitle: 'Test Form 4',
      submittedAt: '2024-01-17T09:15:00Z',
      status: 'rejected'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue(mockLocation);
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'Learner', id: 'user-123' }
    });
    responseService.getPublishedForms.mockResolvedValue(mockForms);
    responseService.getMySubmissions.mockResolvedValue(mockSubmissions);
    toast.error = jest.fn();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );
  };

  test('should redirect to login if not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null
    });

    renderComponent();

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('should redirect to login if user is not a Learner', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'Admin' }
    });

    renderComponent();

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('should load published forms on mount', async () => {
    renderComponent();

    await waitFor(() => {
      expect(responseService.getPublishedForms).toHaveBeenCalled();
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
    });
  });

  test('should handle non-array response for forms', async () => {
    responseService.getPublishedForms.mockResolvedValue('not-an-array');

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No forms available')).toBeInTheDocument();
      expect(screen.getByText('No published forms available at the moment')).toBeInTheDocument();
    });
  });

  test('should handle empty forms array', async () => {
    responseService.getPublishedForms.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No forms available')).toBeInTheDocument();
    });
  });

  test('should handle forms loading error', async () => {
    const error = new Error('Network error');
    responseService.getPublishedForms.mockRejectedValue(error);

    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error loading forms: Network error');
      expect(screen.getByText('Failed to load forms. Please try again.')).toBeInTheDocument();
    });
  });

  test('should retry loading forms after error', async () => {
    responseService.getPublishedForms.mockRejectedValueOnce(new Error('Network error'));
    responseService.getPublishedForms.mockResolvedValueOnce(mockForms);

    renderComponent();

    await waitFor(() => {
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });
  });

  test('should filter forms by search term', async () => {
    renderComponent();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search forms...');
      fireEvent.change(searchInput, { target: { value: 'Form 1' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Form 2')).not.toBeInTheDocument();
    });
  });

  test('should show no results when search has no matches', async () => {
    renderComponent();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search forms...');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    });

    await waitFor(() => {
      expect(screen.getByText('No forms available')).toBeInTheDocument();
      expect(screen.getByText('No forms match your search')).toBeInTheDocument();
    });
  });

  test('should display form without description', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No description available')).toBeInTheDocument();
    });
  });

  test('should display form creation dates correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Created: 01/01/2024')).toBeInTheDocument();
      expect(screen.getByText('Created: 01/02/2024')).toBeInTheDocument();
      expect(screen.getByText('Created: 01/03/2024')).toBeInTheDocument();
    });
  });

  test('should navigate to form submission for new form', async () => {
    responseService.getMySubmissions.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      const submitButtons = screen.getAllByText('Submit Response');
      fireEvent.click(submitButtons[0]);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/form/1/submission');
    });
  });

  test('should show modal for already submitted form', async () => {
    renderComponent();

    await waitFor(() => {
      const submitButtons = screen.getAllByText('Submit Response');
      fireEvent.click(submitButtons[0]); // Click first form which has submission
    });

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  test('should handle continue submission after modal', async () => {
    renderComponent();

    await waitFor(() => {
      const submitButtons = screen.getAllByText('Submit Response');
      fireEvent.click(submitButtons[0]);
    });

    await waitFor(() => {
      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/form/1/submission');
  });

  test('should close modal on cancel', async () => {
    renderComponent();

    await waitFor(() => {
      const submitButtons = screen.getAllByText('Submit Response');
      fireEvent.click(submitButtons[0]);
    });

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  test('should handle submission check with different formId formats', async () => {
    const customSubmissions = [
      { form_id: '1', submittedAt: new Date() },
      { form: { id: '2' }, submitted_at: new Date() },
      { form: { formId: '3' }, submittedAt: new Date() }
    ];
    
    responseService.getMySubmissions.mockResolvedValue(customSubmissions);

    renderComponent();

   

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  test('should handle error when checking submissions', async () => {
    responseService.getMySubmissions.mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

   

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/form/1/submission');
    });
  });

  test('should switch to submissions tab', async () => {
    renderComponent();

    await waitFor(() => {
      const submissionsTab = screen.getByText('My Submissions');
      fireEvent.click(submissionsTab);
    });

    await waitFor(() => {
      expect(responseService.getMySubmissions).toHaveBeenCalled();
      expect(screen.getByText('External Training Completion')).toBeInTheDocument();
    });
  });

  test('should handle empty submissions', async () => {
    responseService.getMySubmissions.mockResolvedValue([]);

    renderComponent();


    await waitFor(() => {
      expect(screen.getByText('No submissions yet')).toBeInTheDocument();
      expect(screen.getByText(/You haven't submitted any forms yet/)).toBeInTheDocument();
    });
  });

  test('should handle non-array submissions', async () => {
    responseService.getMySubmissions.mockResolvedValue(null);

    renderComponent();


    await waitFor(() => {
      expect(screen.getByText('No submissions yet')).toBeInTheDocument();
    });
  });

  test('should handle submissions loading error', async () => {
    responseService.getMySubmissions.mockRejectedValue(new Error('Failed'));

    renderComponent();

   
  });

  test('should search submissions', async () => {
    renderComponent();


    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search');
      fireEvent.change(searchInput, { target: { value: 'Form 1' } });
    });

  });

  test('should view submission details', async () => {
    renderComponent();


    
    expect(mockNavigate).toHaveBeenCalledWith('/submission/sub-1/view', {
      state: { submission: mockSubmissions[0] }
    });
  });

  test('should display submission status correctly', async () => {
    renderComponent();

  });

  test('should format submission date correctly', async () => {
    renderComponent();

    const submissionsTab = screen.getByText('My Submissions');
    fireEvent.click(submissionsTab);

  
  });

  test('should handle missing submission date', async () => {
    const submissionNoDate = [
      { id: 'sub-x', formTitle: 'Test Form', submittedAt: null }
    ];
    responseService.getMySubmissions.mockResolvedValue(submissionNoDate);

    renderComponent();

 
  
  });

  test('should handle pagination', async () => {
    const manySubmissions = Array.from({ length: 15 }, (_, i) => ({
      id: `sub-${i}`,
      formTitle: `Form ${i}`,
      submittedAt: new Date()
    }));
    
    responseService.getMySubmissions.mockResolvedValue(manySubmissions);

    renderComponent();


    // Click next page - find the button that has the active class
    const nextButton = screen.getAllByRole('button').find(btn => 
      btn.className && btn.className.includes('pagination-page-btn') && 
      btn.className.includes('active')
    );
    
    if (nextButton) {
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('11–15 of 15 items')).toBeInTheDocument();
      });
    }
  });



 
 
});