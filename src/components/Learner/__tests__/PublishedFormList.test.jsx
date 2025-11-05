import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import responseService from '../../../services/responseService';
import toast from 'react-hot-toast';
import PublishedFormList from '../PublishedFormList';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/responseService');
jest.mock('react-hot-toast');
jest.mock('../../Common/LoadingSpinner', () => () => <div>Loading...</div>);
jest.mock('../../Common/NavigationBar', () => () => <nav>NavigationBar</nav>);
jest.mock('../../Common/Modal', () => ({ isOpen, onClose, onConfirm, lastSubmissionDate }) => 
  isOpen ? (
    <div data-testid="modal">
      <p>{lastSubmissionDate}</p>
      <button onClick={onConfirm}>Continue</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null
);
jest.mock('lodash', () => ({
  debounce: (fn) => fn
}));

describe('PublishedFormList', () => {
  const mockNavigate = jest.fn();
  const mockPublishedForms = {
    data: [
      {
        formId: 'form1',
        title: 'Form 1',
        description: 'Description 1',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        createdAt: '2024-01-01'
      },
      {
        id: 'form2',
        title: 'Form 2',
        description: 'Description 2',
        dueDate: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    totalCount: 2,
    totalPages: 1
  };

  const mockSubmissions = {
    data: [
      {
        id: 'sub1',
        formTitle: 'Submitted Form',
        submittedAt: '2024-01-01T10:00:00Z',
        status: 'submitted',
        formId: 'form1'
      }
    ],
    totalCount: 1,
    totalPages: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ state: null });
    useAuth.mockReturnValue({
      user: { role: 'Learner' },
      isAuthenticated: true
    });
  });

  it('should redirect to login if not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should redirect if user is not Learner', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' },
      isAuthenticated: true
    });

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should load with activeTab from location state', () => {
    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    waitFor(() => {
      expect(screen.getByText('My Submissions')).toHaveClass('active');
    });
  });

  it('should fetch published forms on mount', async () => {
    responseService.getPublishedForms.mockResolvedValue(mockPublishedForms);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(responseService.getPublishedForms).toHaveBeenCalledWith(1, 10, '');
      expect(screen.getByText('Form 1')).toBeInTheDocument();
    });
  });

  it('should handle array response for published forms', async () => {
    responseService.getPublishedForms.mockResolvedValue([
      { formId: 'form1', title: 'Array Form' }
    ]);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Array Form')).toBeInTheDocument();
    });
  });

  it('should handle fetch error for published forms', async () => {
    responseService.getPublishedForms.mockRejectedValue(new Error('Fetch failed'));

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error loading forms: Fetch failed');
    });
  });

  it('should search published forms', async () => {
    responseService.getPublishedForms.mockResolvedValue(mockPublishedForms);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    const searchInput = await screen.findByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    await waitFor(() => {
      expect(responseService.getPublishedForms).toHaveBeenCalledWith(1, 10, 'test search');
    });
  });

  it('should switch to submissions tab', async () => {
    responseService.getPublishedForms.mockResolvedValue(mockPublishedForms);
    responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submissionsTab = screen.getByText('My Submissions');
      fireEvent.click(submissionsTab);
    });

    await waitFor(() => {
      expect(responseService.getMySubmissions).toHaveBeenCalled();
    });
  });

  it('should fetch my submissions', async () => {
    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    // ... continuing from previous part

    await waitFor(() => {
      expect(responseService.getMySubmissions).toHaveBeenCalledWith(1, 10, '');
      expect(screen.getByText('Submitted Form')).toBeInTheDocument();
    });
  });

  it('should handle array response for submissions', async () => {
    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue([
      { id: 'sub1', formTitle: 'Array Submission' }
    ]);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Array Submission')).toBeInTheDocument();
    });
  });

  it('should handle error for my submissions', async () => {
    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockRejectedValue(new Error('Failed'));

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No submissions yet')).toBeInTheDocument();
    });
  });

  it('should search submissions', async () => {
    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search submissions...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
    });

    await waitFor(() => {
      expect(responseService.getMySubmissions).toHaveBeenCalledWith(1, 10, 'test');
    });
  });

  it('should handle submit response for new form', async () => {
    responseService.getPublishedForms.mockResolvedValue(mockPublishedForms);
    responseService.getMySubmissions.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButtons = screen.getAllByText('Submit Response');
      fireEvent.click(submitButtons[0]);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/form/form1/submission');
  });

  it('should show modal for already submitted form', async () => {
    responseService.getPublishedForms.mockResolvedValue(mockPublishedForms);
    responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButtons = screen.getAllByText('Submit Response');
      fireEvent.click(submitButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  it('should continue submission when modal confirmed', async () => {
    responseService.getPublishedForms.mockResolvedValue(mockPublishedForms);
    responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButtons = screen.getAllByText('Submit Response');
      fireEvent.click(submitButtons[0]);
    });

    await waitFor(() => {
      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/form/form1/submission');
  });

  it('should handle submit response error', async () => {
    responseService.getPublishedForms.mockResolvedValue(mockPublishedForms);
    responseService.getMySubmissions.mockRejectedValue(new Error('Error'));

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButtons = screen.getAllByText('Submit Response');
      fireEvent.click(submitButtons[0]);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/form/form1/submission');
  });

  it('should view submission details', async () => {
    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const viewButton = screen.getByTitle('View Details');
      fireEvent.click(viewButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/submission/sub1/view',
      { state: { submission: mockSubmissions.data[0] } }
    );
  });

  it('should format due dates correctly', async () => {
    const formsWithDueDates = {
      data: [
        {
          formId: 'form1',
          title: 'Overdue Form',
          dueDate: new Date(Date.now() - 86400000).toISOString()
        },
        {
          formId: 'form2',
          title: 'Today Form',
          dueDate: new Date().toISOString()
        },
        {
          formId: 'form3',
          title: 'Soon Form',
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString()
        },
        {
          formId: 'form4',
          title: 'Future Form',
          dueDate: new Date(Date.now() + 86400000 * 30).toISOString()
        },
        {
          formId: 'form5',
          title: 'No Due Date',
          dueDate: null
        }
      ]
    };

    responseService.getPublishedForms.mockResolvedValue(formsWithDueDates);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('Due Today')).toBeInTheDocument();
      expect(screen.getByText(/Due in \d days/)).toBeInTheDocument();
    });
  });

  it('should format submission dates correctly', async () => {
    const submissionsWithDates = {
      data: [
        {
          id: 'sub1',
          formTitle: 'Form',
          submittedAt: '2024-01-01T10:30:00Z'
        },
        {
          id: 'sub2',
          formTitle: 'Form 2',
          submittedAt: null
        }
      ]
    };

    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue(submissionsWithDates);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Jan 1, 2024 at/)).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  it('should display status correctly', async () => {
    const submissionsWithStatus = {
      data: [
        { id: '1', formTitle: 'F1', status: 'approved', submittedAt: '2024-01-01' },
        { id: '2', formTitle: 'F2', status: 'rejected', submittedAt: '2024-01-01' },
        { id: '3', formTitle: 'F3', status: 'submitted', submittedAt: '2024-01-01' }
      ]
    };

    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue(submissionsWithStatus);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Completion Approved')).toBeInTheDocument();
      expect(screen.getByText('Completion Rejected')).toBeInTheDocument();
      expect(screen.getByText('Completion Submitted')).toBeInTheDocument();
    });
  });

  it('should handle empty forms list', async () => {
    responseService.getPublishedForms.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No forms available')).toBeInTheDocument();
      expect(screen.getByText('No published forms available at the moment')).toBeInTheDocument();
    });
  });

  it('should handle empty forms with search', async () => {
    responseService.getPublishedForms.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    const searchInput = await screen.findByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'search term' } });

    await waitFor(() => {
      expect(screen.getByText('No forms match your search')).toBeInTheDocument();
    });
  });

  it('should handle empty submissions', async () => {
    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No submissions yet')).toBeInTheDocument();
      expect(screen.getByText(/You haven't submitted any forms yet/)).toBeInTheDocument();
    });
  });

  it('should handle empty submissions with search', async () => {
    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search submissions...');
      fireEvent.change(searchInput, { target: { value: 'search' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/No submissions match your search "search"/)).toBeInTheDocument();
    });
  });

  it('should navigate to published forms tab from empty submissions', async () => {
    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue({ data: [] });
    responseService.getPublishedForms.mockResolvedValue(mockPublishedForms);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const viewFormsButton = screen.getByText('View Published Forms');
      fireEvent.click(viewFormsButton);
    });

    expect(responseService.getPublishedForms).toHaveBeenCalled();
  });

  it('should change page size for submissions', async () => {
    const multiPageSubmissions = {
      data: mockSubmissions.data,
      totalCount: 100,
      totalPages: 10
    };

    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue(multiPageSubmissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const pageSizeSelect = screen.getByDisplayValue('10');
      fireEvent.change(pageSizeSelect, { target: { value: '25' } });
    });

    expect(responseService.getMySubmissions).toHaveBeenCalledWith(1, 25, '');
  });

  it('should navigate submissions pages', async () => {
    const multiPageSubmissions = {
      data: mockSubmissions.data,
      totalCount: 100,
      totalPages: 10
    };

    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue(multiPageSubmissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const nextButton = screen.getByText('→');
      fireEvent.click(nextButton);
    });

    expect(responseService.getMySubmissions).toHaveBeenCalledWith(2, 10, '');
  });

  it('should navigate back in submissions pages', async () => {
    const multiPageSubmissions = {
      data: mockSubmissions.data,
      totalCount: 100,
      totalPages: 10
    };

    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue(multiPageSubmissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    // First go to page 2
    await waitFor(() => {
      const nextButton = screen.getByText('→');
      fireEvent.click(nextButton);
    });

    // Then go back
    await waitFor(() => {
      const prevButton = screen.getByText('←');
      fireEvent.click(prevButton);
    });

    expect(responseService.getMySubmissions).toHaveBeenCalledWith(1, 10, '');
  });

  it('should handle form with alternative ID field', async () => {
    const formsWithAltId = {
      data: [
        { id: 'form1', title: 'Form with ID' }
      ]
    };

    responseService.getPublishedForms.mockResolvedValue(formsWithAltId);
    responseService.getMySubmissions.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Submit Response');
      fireEvent.click(submitButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/form/form1/submission');
  });

  it('should check various submission ID formats', async () => {
    const submissions = {
      data: [
        { formId: 'form1', id: 'sub1', formTitle: 'Sub1' },
        { form_id: 'form1', id: 'sub2', formTitle: 'Sub2' },
        { form: { id: 'form1' }, id: 'sub3', formTitle: 'Sub3' },
        { form: { formId: 'form1' }, id: 'sub4', formTitle: 'Sub4' }
      ]
    };

    responseService.getPublishedForms.mockResolvedValue({
      data: [{ formId: 'form1', title: 'Test Form' }]
    });
    responseService.getMySubmissions.mockResolvedValue(submissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Submit Response');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  it('should handle null response data', async () => {
    responseService.getPublishedForms.mockResolvedValue({});

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No forms available')).toBeInTheDocument();
    });
  });

  it('should handle filter change', async () => {
    useLocation.mockReturnValue({ state: { activeTab: 'submissions' } });
    responseService.getMySubmissions.mockResolvedValue(mockSubmissions);

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      const filterSelect = screen.getByDisplayValue('External Training Completion');
      fireEvent.change(filterSelect, { target: { value: 'All Forms' } });
    });

    expect(screen.getByDisplayValue('All Forms')).toBeInTheDocument();
  });

  it('should retry on error', async () => {
    responseService.getPublishedForms.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <PublishedFormList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    responseService.getPublishedForms.mockResolvedValue(mockPublishedForms);
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Form 1')).toBeInTheDocument();
    });
  });
});
